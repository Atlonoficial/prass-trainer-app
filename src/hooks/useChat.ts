// src/hooks/useChat.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_type: 'student' | 'teacher' | 'ai';
    message?: string;
    content?: string; // alias for message
    message_type: 'text' | 'image' | 'audio' | 'video';
    media_url?: string;
    is_read: boolean;
    created_at: string;
}

export interface Conversation {
    id: string;
    student_id: string;
    teacher_id?: string;
    last_message?: string;
    last_message_at?: string;
    unread_count: number;
    created_at: string;
    updated_at: string;
}

export function useChat() {
    const { user } = useAuth();
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [teacherId, setTeacherId] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) {
            setConversation(null);
            setMessages([]);
            setLoading(false);
            return;
        }

        const fetchConversation = async () => {
            setLoading(true);
            try {
                // Busca student data (precisamos do user_id e teacher_id)
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id, user_id, teacher_id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (!studentData?.user_id) {
                    setLoading(false);
                    return;
                }

                // Salvar o teacher_id do aluno para verificar se tem treinador
                setTeacherId(studentData.teacher_id || null);
                console.log('Student teacher_id:', studentData.teacher_id);

                // ID esperado da conversa no formato do Dashboard
                const expectedConversationId = studentData.teacher_id
                    ? `${studentData.teacher_id}-${studentData.user_id}`
                    : `ai-${studentData.user_id}`;

                console.log('Expected conversation ID:', expectedConversationId);

                // Buscar conversa por ID direto OU por student_id
                let { data: conv } = await supabase
                    .from('conversations')
                    .select('*')
                    .or(`id.eq.${expectedConversationId},student_id.eq.${studentData.user_id},student_id.eq.${studentData.id}`)
                    .limit(1)
                    .maybeSingle();

                console.log('Found conversation:', conv);

                if (!conv) {
                    // Tenta criar nova conversa
                    const { data: newConv, error: convError } = await supabase
                        .from('conversations')
                        .insert({
                            id: expectedConversationId,
                            student_id: studentData.user_id, // Usar user_id para compatibilidade com Dashboard
                            teacher_id: studentData.teacher_id || null,
                            unread_count: 0,
                        })
                        .select()
                        .single();

                    if (convError) {
                        // Se erro for de duplicata, tenta buscar novamente
                        if (convError.code === '23505') {
                            console.log('Conversation already exists, fetching...');
                            const { data: existingConv } = await supabase
                                .from('conversations')
                                .select('*')
                                .eq('id', expectedConversationId)
                                .single();
                            conv = existingConv;
                        } else {
                            console.error('Error creating conversation:', convError);
                        }
                    } else {
                        conv = newConv;
                    }
                }

                setConversation(conv);

                if (conv) {
                    // Busca mensagens
                    const { data: msgs } = await supabase
                        .from('chat_messages')
                        .select('*')
                        .eq('conversation_id', conv.id)
                        .order('created_at', { ascending: true })
                        .limit(100);

                    setMessages(msgs || []);
                }
            } catch (e: any) {
                console.error('Error fetching conversation:', e);
                setError(e?.message || 'Erro ao carregar conversa');
            } finally {
                setLoading(false);
            }
        };

        fetchConversation();

        // Realtime para novas mensagens
        const channel = supabase
            .channel('chat-messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                },
                (payload) => {
                    const newMessage = payload.new as Message;
                    setMessages((prev) => [...prev, newMessage]);
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);

    // Envia mensagem
    const sendMessage = useCallback(
        async (content: string, messageType: 'text' | 'image' = 'text', mediaUrl?: string) => {
            if (!user?.id || !conversation?.id) throw new Error('No conversation');
            setSending(true);
            try {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (!studentData?.id) {
                    throw new Error('Student not found');
                }

                // Envia mensagem do aluno
                const { data, error: insertError } = await supabase
                    .from('chat_messages')
                    .insert({
                        conversation_id: conversation.id,
                        sender_id: studentData.id,
                        sender_type: 'student',
                        message: content,
                        message_type: messageType,
                        media_url: mediaUrl,
                        is_read: false,
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                // Atualiza última mensagem na conversa
                await supabase
                    .from('conversations')
                    .update({
                        last_message: content,
                        last_message_at: new Date().toISOString(),
                    })
                    .eq('id', conversation.id);

                // Chama a IA para obter resposta
                try {
                    console.log('Calling AI service...');
                    const { openaiService } = await import('@/services/openaiService');
                    const aiResponse = await openaiService.chat(conversation.id, content);
                    console.log('AI Response received:', aiResponse?.substring(0, 100));

                    // Salva resposta da IA no banco
                    const { data: aiData, error: aiInsertError } = await supabase
                        .from('chat_messages')
                        .insert({
                            conversation_id: conversation.id,
                            sender_id: '00000000-0000-0000-0000-000000000000', // UUID fixo para IA
                            sender_type: 'ai',
                            message: aiResponse,
                            message_type: 'text',
                            is_read: false,
                        })
                        .select()
                        .single();

                    if (aiInsertError) {
                        console.error('Error saving AI response:', aiInsertError);
                    } else {
                        console.log('AI response saved successfully');
                        // Adiciona a mensagem da IA ao estado local
                        if (aiData) {
                            setMessages(prev => [...prev, aiData as Message]);
                        }
                    }
                } catch (aiError) {
                    console.error('AI response error:', aiError);
                    // Não bloqueia o envio se a IA falhar
                }

                return data;
            } catch (e: any) {
                console.error('Error sending message:', e);
                throw e;
            } finally {
                setSending(false);
            }
        },
        [user?.id, conversation?.id]
    );

    // Marca mensagens como lidas
    const markAsRead = useCallback(async () => {
        if (!conversation?.id) return;
        try {
            await supabase
                .from('chat_messages')
                .update({ is_read: true })
                .eq('conversation_id', conversation.id)
                .eq('is_read', false);

            await supabase
                .from('conversations')
                .update({ unread_count: 0 })
                .eq('id', conversation.id);
        } catch (e: any) {
            console.error('Error marking as read:', e);
        }
    }, [conversation?.id]);

    return {
        conversation,
        messages,
        loading,
        sending,
        error,
        sendMessage,
        markAsRead,
        hasTeacher: !!teacherId || !!conversation?.teacher_id,
        teacherId,
    };
}

export default useChat;

// src/hooks/useAIConversation.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface AIMessage {
    id: string;
    conversation_id: string;
    content: string;
    role: 'user' | 'assistant';
    created_at: string;
}

export interface AIConversation {
    id: string;
    student_id: string;
    title?: string;
    created_at: string;
    updated_at: string;
    messages?: AIMessage[];
}

export interface DailyUsage {
    date: string;
    messagesCount: number;
    limit: number;
    remaining: number;
}

const DAILY_MESSAGE_LIMIT = 20;

export function useAIConversation() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<AIConversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null);
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Busca conversas existentes
    useEffect(() => {
        if (!user?.id) {
            setConversations([]);
            setLoading(false);
            return;
        }

        const fetchConversations = async () => {
            setLoading(true);
            try {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (!studentData?.id) {
                    setLoading(false);
                    return;
                }

                // Busca conversas
                const { data: convData, error: convError } = await supabase
                    .from('ai_conversations')
                    .select('*')
                    .eq('student_id', studentData.id)
                    .order('updated_at', { ascending: false });

                if (convError) throw convError;
                setConversations(convData || []);

                // Define conversa atual como a mais recente
                if (convData && convData.length > 0) {
                    setCurrentConversation(convData[0]);
                    await loadMessages(convData[0].id);
                }

                // Verifica uso diário
                await checkDailyUsage(studentData.id);
            } catch (e: any) {
                console.error('Error fetching AI conversations:', e);
                setError(e?.message || 'Erro ao carregar conversas');
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, [user?.id]);

    // Carrega mensagens de uma conversa
    const loadMessages = useCallback(async (conversationId: string) => {
        try {
            const { data, error: msgError } = await supabase
                .from('ai_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (msgError) throw msgError;
            setMessages(data || []);
        } catch (e: any) {
            console.error('Error loading messages:', e);
        }
    }, []);

    // Verifica uso diário
    const checkDailyUsage = useCallback(async (studentId: string) => {
        const today = new Date().toISOString().split('T')[0];

        try {
            const { count } = await supabase
                .from('ai_messages')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'user')
                .gte('created_at', `${today}T00:00:00`)
                .lte('created_at', `${today}T23:59:59`);

            const messagesCount = count || 0;
            setDailyUsage({
                date: today,
                messagesCount,
                limit: DAILY_MESSAGE_LIMIT,
                remaining: Math.max(0, DAILY_MESSAGE_LIMIT - messagesCount),
            });
        } catch (e) {
            console.error('Error checking daily usage:', e);
        }
    }, []);

    // Cria nova conversa
    const createConversation = useCallback(async (title?: string) => {
        if (!user?.id) throw new Error('User not authenticated');

        try {
            const { data: studentData } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!studentData) throw new Error('Student not found');

            const { data, error: insertError } = await supabase
                .from('ai_conversations')
                .insert({
                    student_id: studentData.id,
                    title: title || 'Nova conversa',
                })
                .select()
                .single();

            if (insertError) throw insertError;

            setConversations((prev) => [data, ...prev]);
            setCurrentConversation(data);
            setMessages([]);

            return data;
        } catch (e: any) {
            console.error('Error creating conversation:', e);
            throw e;
        }
    }, [user?.id]);

    // Envia mensagem para o AI
    const sendMessage = useCallback(
        async (content: string) => {
            if (!user?.id) throw new Error('User not authenticated');
            if (dailyUsage && dailyUsage.remaining <= 0) {
                throw new Error('Limite diário de mensagens atingido');
            }

            setSending(true);
            setError(null);

            try {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id, teacher_id')
                    .eq('user_id', user.id)
                    .single();

                if (!studentData) throw new Error('Student not found');

                // Cria conversa se não existir
                let conversationId = currentConversation?.id;
                if (!conversationId) {
                    const newConv = await createConversation();
                    conversationId = newConv.id;
                }

                // Salva mensagem do usuário
                const { data: userMsg, error: userMsgError } = await supabase
                    .from('ai_messages')
                    .insert({
                        conversation_id: conversationId,
                        content,
                        role: 'user',
                    })
                    .select()
                    .single();

                if (userMsgError) throw userMsgError;
                setMessages((prev) => [...prev, userMsg]);

                // Chama Edge Function do AI
                const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
                    'ai-assistant',
                    {
                        body: {
                            message: content,
                            conversationId,
                            studentId: studentData.id,
                            teacherId: studentData.teacher_id,
                        },
                    }
                );

                if (aiError) throw aiError;

                // Salva resposta do AI
                const { data: assistantMsg, error: assistantMsgError } = await supabase
                    .from('ai_messages')
                    .insert({
                        conversation_id: conversationId,
                        content: aiResponse.message || aiResponse.content,
                        role: 'assistant',
                    })
                    .select()
                    .single();

                if (assistantMsgError) throw assistantMsgError;
                setMessages((prev) => [...prev, assistantMsg]);

                // Atualiza uso diário
                setDailyUsage((prev) =>
                    prev
                        ? {
                            ...prev,
                            messagesCount: prev.messagesCount + 1,
                            remaining: prev.remaining - 1,
                        }
                        : null
                );

                // Atualiza timestamp da conversa
                await supabase
                    .from('ai_conversations')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', conversationId);

                return assistantMsg;
            } catch (e: any) {
                console.error('Error sending message:', e);
                setError(e?.message || 'Erro ao enviar mensagem');
                throw e;
            } finally {
                setSending(false);
            }
        },
        [user?.id, currentConversation?.id, dailyUsage, createConversation]
    );

    // Seleciona uma conversa
    const selectConversation = useCallback(
        async (conversation: AIConversation) => {
            setCurrentConversation(conversation);
            await loadMessages(conversation.id);
        },
        [loadMessages]
    );

    // Deleta uma conversa
    const deleteConversation = useCallback(
        async (conversationId: string) => {
            try {
                // Deleta mensagens primeiro
                await supabase.from('ai_messages').delete().eq('conversation_id', conversationId);

                // Deleta conversa
                await supabase.from('ai_conversations').delete().eq('id', conversationId);

                setConversations((prev) => prev.filter((c) => c.id !== conversationId));

                if (currentConversation?.id === conversationId) {
                    setCurrentConversation(null);
                    setMessages([]);
                }
            } catch (e: any) {
                console.error('Error deleting conversation:', e);
                throw e;
            }
        },
        [currentConversation?.id]
    );

    return {
        conversations,
        currentConversation,
        messages,
        dailyUsage,
        loading,
        sending,
        error,
        sendMessage,
        createConversation,
        selectConversation,
        deleteConversation,
        canSendMessage: dailyUsage ? dailyUsage.remaining > 0 : true,
    };
}

export default useAIConversation;

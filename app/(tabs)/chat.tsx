// app/(tabs)/chat.tsx - Tela de Mensagens com abas separadas
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useChat, Message } from '@/hooks/useChat';
import Colors from '@/constants/Colors';

type ChatType = 'trainer' | 'ai';

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const content = message.message || message.content || '';
    const isAI = message.sender_type === 'ai';

    return (
        <View style={[
            styles.messageBubble,
            isOwn ? styles.ownMessage : (isAI ? styles.aiMessage : styles.otherMessage)
        ]}>
            {isAI && (
                <View style={styles.aiLabel}>
                    <Feather name="zap" size={12} color="#F59E0B" />
                    <Text style={styles.aiLabelText}>Coach IA</Text>
                </View>
            )}
            <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
                {content}
            </Text>
            <View style={styles.messageFooter}>
                <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
                    {formatTime(message.created_at)}
                </Text>
                {isOwn && message.is_read && (
                    <Feather name="check-circle" size={12} color="rgba(255,255,255,0.6)" style={{ marginLeft: 4 }} />
                )}
            </View>
        </View>
    );
}

export default function ChatScreen() {
    const [chatType, setChatType] = useState<ChatType>('ai');
    const {
        messages,
        loading,
        sendMessage,
        sending,
        hasTeacher,
        markAsRead
    } = useChat();

    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    // Filtrar mensagens por tipo
    // Aba IA: mostra mensagens da IA e do aluno que foram respondidas pela IA
    // Aba Treinador: mostra mensagens do treinador e do aluno que foram enviadas para o treinador
    const filteredMessages = messages.filter(msg => {
        if (chatType === 'ai') {
            // Mostra mensagens da IA e mensagens do aluno para IA
            return msg.sender_type === 'ai' ||
                (msg.sender_type === 'student' && msg.message?.includes('[IA]'));
        } else {
            // Mostra mensagens do treinador e todas as mensagens do aluno (exceto as para IA)
            return msg.sender_type === 'teacher' ||
                (msg.sender_type === 'student' && !msg.message?.includes('[IA]'));
        }
    });

    useEffect(() => {
        markAsRead();
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim() || sending) return;

        const text = inputText.trim();
        setInputText('');

        try {
            await sendMessage(text);
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isOwn = item.sender_type === 'student';
        return <MessageBubble message={item} isOwn={isOwn} />;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mensagens</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Abas de seleção */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, chatType === 'ai' && styles.tabActive]}
                    onPress={() => setChatType('ai')}
                >
                    <Feather name="zap" size={18} color={chatType === 'ai' ? '#F59E0B' : Colors.dark.textSecondary} />
                    <Text style={[styles.tabText, chatType === 'ai' && styles.tabTextActive]}>Coach IA</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, chatType === 'trainer' && styles.tabActive]}
                    onPress={() => setChatType('trainer')}
                >
                    <Feather name="user" size={18} color={chatType === 'trainer' ? '#F59E0B' : Colors.dark.textSecondary} />
                    <Text style={[styles.tabText, chatType === 'trainer' && styles.tabTextActive]}>Treinador</Text>
                    {!hasTeacher && <View style={styles.lockedBadge}><Feather name="lock" size={10} color="#666" /></View>}
                </TouchableOpacity>
            </View>

            {/* Chat Content */}
            <KeyboardAvoidingView
                style={styles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={90}
            >
                {chatType === 'trainer' && !hasTeacher ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIcon}>
                            <Feather name="user-x" size={48} color={Colors.dark.textSecondary} />
                        </View>
                        <Text style={styles.emptyTitle}>Sem treinador vinculado</Text>
                        <Text style={styles.emptyDesc}>
                            Você ainda não tem um treinador vinculado à sua conta. Entre em contato com seu treinador para vincular.
                        </Text>
                    </View>
                ) : loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#F59E0B" />
                        <Text style={styles.loadingText}>Carregando mensagens...</Text>
                    </View>
                ) : filteredMessages.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIcon}>
                            <Feather name={chatType === 'ai' ? "zap" : "message-circle"} size={48} color="#F59E0B" />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {chatType === 'ai' ? 'Converse com o Coach IA' : 'Fale com seu treinador'}
                        </Text>
                        <Text style={styles.emptyDesc}>
                            {chatType === 'ai'
                                ? 'Tire dúvidas sobre treino, dieta e receba dicas personalizadas!'
                                : 'Envie uma mensagem para seu treinador e receba orientações.'}
                        </Text>

                        {chatType === 'ai' && (
                            <View style={styles.suggestionsContainer}>
                                <Text style={styles.suggestionsTitle}>Sugestões:</Text>
                                {[
                                    'Como melhorar meu treino de peito?',
                                    'O que comer antes do treino?',
                                    'Dicas para perder gordura',
                                ].map((suggestion, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.suggestionChip}
                                        onPress={() => setInputText(suggestion)}
                                    >
                                        <Text style={styles.suggestionText}>{suggestion}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={filteredMessages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.messagesList}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    />
                )}

                {/* Input */}
                {(chatType === 'ai' || hasTeacher) && (
                    <View style={styles.inputContainer}>
                        <TouchableOpacity style={styles.attachButton}>
                            <Feather name="plus" size={22} color={Colors.dark.textSecondary} />
                        </TouchableOpacity>

                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder={chatType === 'ai' ? "Pergunte ao Coach IA..." : "Mensagem para o treinador..."}
                            placeholderTextColor={Colors.dark.textSecondary}
                            multiline
                            maxLength={1000}
                        />

                        <TouchableOpacity
                            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <Feather name="send" size={18} color="#000" />
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.dark.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: Colors.dark.backgroundSecondary,
        gap: 8,
    },
    tabActive: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
    },
    tabTextActive: {
        color: '#F59E0B',
    },
    lockedBadge: {
        marginLeft: 4,
    },
    chatContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyDesc: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    suggestionsContainer: {
        marginTop: 32,
        width: '100%',
    },
    suggestionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
        marginBottom: 12,
    },
    suggestionChip: {
        backgroundColor: Colors.dark.backgroundSecondary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    suggestionText: {
        fontSize: 14,
        color: Colors.dark.text,
    },
    messagesList: {
        padding: 16,
        paddingBottom: 8,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
    },
    ownMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#F59E0B',
        borderBottomRightRadius: 4,
    },
    otherMessage: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.dark.backgroundSecondary,
        borderBottomLeftRadius: 4,
    },
    aiMessage: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.dark.backgroundSecondary,
        borderBottomLeftRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: '#F59E0B',
    },
    aiLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 4,
    },
    aiLabelText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#F59E0B',
    },
    messageText: {
        fontSize: 15,
        color: Colors.dark.text,
        lineHeight: 20,
    },
    ownMessageText: {
        color: '#000',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    messageTime: {
        fontSize: 11,
        color: Colors.dark.textSecondary,
    },
    ownMessageTime: {
        color: 'rgba(0, 0, 0, 0.5)',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: Colors.dark.background,
    },
    attachButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.dark.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 100,
        backgroundColor: Colors.dark.backgroundSecondary,
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: Colors.dark.text,
        marginRight: 8,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F59E0B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});

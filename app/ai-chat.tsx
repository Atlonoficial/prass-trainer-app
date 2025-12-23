// app/ai-chat.tsx - Chat com IA do Treinador
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAIConversation } from '@/hooks/useAIConversation';
import { AppHeader } from '@/components/ui/AppHeader';
import Colors from '@/constants/Colors';

export default function AIChatScreen() {
    const {
        messages,
        dailyUsage,
        loading,
        sending,
        error,
        sendMessage,
        canSendMessage,
        createConversation,
    } = useAIConversation();

    const [inputText, setInputText] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);

    // Scroll para o final quando novas mensagens chegam
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim() || sending || !canSendMessage) return;

        const text = inputText.trim();
        setInputText('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            await sendMessage(text);
        } catch (e: any) {
            console.error('Error sending message:', e);
        }
    };

    const renderMessage = (message: any, index: number) => {
        const isUser = message.role === 'user';

        return (
            <View
                key={message.id || index}
                style={[
                    styles.messageContainer,
                    isUser ? styles.userMessageContainer : styles.aiMessageContainer,
                ]}
            >
                {!isUser && (
                    <View style={styles.aiAvatar}>
                        <Ionicons name="sparkles" size={16} color={Colors.primary} />
                    </View>
                )}
                <View
                    style={[
                        styles.messageBubble,
                        isUser ? styles.userBubble : styles.aiBubble,
                    ]}
                >
                    <Text style={[styles.messageText, isUser && styles.userMessageText]}>
                        {message.content}
                    </Text>
                    <Text style={styles.messageTime}>
                        {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <AppHeader title="Coach IA" showBack />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Carregando conversa...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                title="Coach IA"
                showBack
                rightElement={
                    dailyUsage && (
                        <View style={styles.usageContainer}>
                            <Ionicons name="chatbubble-outline" size={14} color="#999" />
                            <Text style={styles.usageText}>
                                {dailyUsage.remaining}/{dailyUsage.limit}
                            </Text>
                        </View>
                    )
                }
            />

            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={100}
            >
                {/* Mensagens */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.aiAvatarLarge}>
                                <Ionicons name="sparkles" size={40} color={Colors.primary} />
                            </View>
                            <Text style={styles.emptyTitle}>Olá! Sou seu Coach IA 🏋️</Text>
                            <Text style={styles.emptySubtitle}>
                                Posso te ajudar com dúvidas sobre treinos, nutrição, objetivos e muito mais!
                            </Text>

                            <View style={styles.suggestionsContainer}>
                                <Text style={styles.suggestionsTitle}>Sugestões:</Text>
                                {[
                                    'Como melhorar meu treino de peito?',
                                    'Preciso de dicas de alimentação pré-treino',
                                    'Quanto tempo de descanso entre as séries?',
                                ].map((suggestion, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.suggestionChip}
                                        onPress={() => {
                                            setInputText(suggestion);
                                            handleSend();
                                        }}
                                    >
                                        <Text style={styles.suggestionText}>{suggestion}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ) : (
                        messages.map(renderMessage)
                    )}

                    {/* Typing indicator */}
                    {sending && (
                        <View style={[styles.messageContainer, styles.aiMessageContainer]}>
                            <View style={styles.aiAvatar}>
                                <Ionicons name="sparkles" size={16} color={Colors.primary} />
                            </View>
                            <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
                                <View style={styles.typingDots}>
                                    <View style={[styles.dot, styles.dot1]} />
                                    <View style={[styles.dot, styles.dot2]} />
                                    <View style={[styles.dot, styles.dot3]} />
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Input */}
                <View style={styles.inputContainer}>
                    {!canSendMessage ? (
                        <View style={styles.limitReached}>
                            <Ionicons name="warning" size={20} color="#F59E0B" />
                            <Text style={styles.limitText}>
                                Limite diário atingido. Volte amanhã!
                            </Text>
                        </View>
                    ) : (
                        <>
                            <TextInput
                                style={styles.input}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Digite sua mensagem..."
                                placeholderTextColor="#666"
                                multiline
                                maxLength={500}
                                editable={!sending}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    (!inputText.trim() || sending) && styles.sendButtonDisabled,
                                ]}
                                onPress={handleSend}
                                disabled={!inputText.trim() || sending}
                            >
                                {sending ? (
                                    <ActivityIndicator size="small" color="#000" />
                                ) : (
                                    <Ionicons name="send" size={20} color="#000" />
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#999',
        marginTop: 12,
    },
    usageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    usageText: {
        color: '#999',
        fontSize: 12,
    },
    keyboardAvoid: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    aiAvatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#999',
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 32,
        lineHeight: 20,
    },
    suggestionsContainer: {
        marginTop: 32,
        width: '100%',
    },
    suggestionsTitle: {
        color: '#666',
        fontSize: 12,
        marginBottom: 12,
        textAlign: 'center',
    },
    suggestionChip: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    suggestionText: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    userMessageContainer: {
        justifyContent: 'flex-end',
    },
    aiMessageContainer: {
        justifyContent: 'flex-start',
    },
    aiAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    messageBubble: {
        maxWidth: '75%',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    userBubble: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        backgroundColor: '#1a1a1a',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        color: '#fff',
        fontSize: 15,
        lineHeight: 22,
    },
    userMessageText: {
        color: '#000',
    },
    messageTime: {
        color: '#666',
        fontSize: 10,
        marginTop: 4,
        textAlign: 'right',
    },
    typingBubble: {
        paddingVertical: 16,
    },
    typingDots: {
        flexDirection: 'row',
        gap: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#666',
    },
    dot1: {
        opacity: 0.3,
    },
    dot2: {
        opacity: 0.6,
    },
    dot3: {
        opacity: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
        backgroundColor: '#0a0a0a',
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    input: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#fff',
        fontSize: 16,
        maxHeight: 100,
        marginRight: 12,
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#333',
    },
    limitReached: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        gap: 8,
    },
    limitText: {
        color: '#F59E0B',
        fontSize: 14,
    },
});

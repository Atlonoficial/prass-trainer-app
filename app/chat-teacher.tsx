// app/chat-teacher.tsx - Chat com Professor
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useChat, Message } from '@/hooks/useChat';
import { AppHeader } from '@/components/ui/AppHeader';
import Colors from '@/constants/Colors';

export default function ChatTeacherScreen() {
    const { messages, loading, sending, sendMessage, hasTeacher } = useChat();
    const [inputText, setInputText] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        // Scroll to bottom when messages change
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim() || sending) return;

        const text = inputText.trim();
        setInputText('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            await sendMessage(text);
        } catch (e: any) {
            console.error('Error sending message:', e);
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Hoje';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Ontem';
        } else {
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
            });
        }
    };

    // Agrupa mensagens por data
    const messagesByDate = messages.reduce((acc, msg) => {
        const date = msg.created_at.split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(msg);
        return acc;
    }, {} as Record<string, Message[]>);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <AppHeader title="Chat com Professor" showBack />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Carregando mensagens...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!hasTeacher) {
        return (
            <SafeAreaView style={styles.container}>
                <AppHeader title="Chat com Professor" showBack />
                <View style={styles.noTeacherContainer}>
                    <Ionicons name="person-outline" size={64} color="#333" />
                    <Text style={styles.noTeacherTitle}>Sem professor vinculado</Text>
                    <Text style={styles.noTeacherSubtitle}>
                        Você precisa estar vinculado a um professor para usar o chat.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                title="Professor"
                showBack
                rightElement={
                    <View style={styles.onlineIndicator}>
                        <View style={styles.onlineDot} />
                    </View>
                }
            />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={90}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.length === 0 ? (
                        <View style={styles.emptyChat}>
                            <Ionicons name="chatbubbles-outline" size={64} color="#333" />
                            <Text style={styles.emptyChatTitle}>Inicie uma conversa</Text>
                            <Text style={styles.emptyChatSubtitle}>
                                Tire suas dúvidas sobre treino e nutrição
                            </Text>
                        </View>
                    ) : (
                        Object.entries(messagesByDate).map(([date, dateMessages]) => (
                            <View key={date}>
                                <View style={styles.dateContainer}>
                                    <Text style={styles.dateText}>{formatDate(date)}</Text>
                                </View>
                                {dateMessages.map((message) => {
                                    const isMe = message.sender_type === 'student';
                                    return (
                                        <View
                                            key={message.id}
                                            style={[
                                                styles.messageWrapper,
                                                isMe ? styles.messageWrapperMe : styles.messageWrapperOther,
                                            ]}
                                        >
                                            <View style={[
                                                styles.messageBubble,
                                                isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
                                            ]}>
                                                <Text style={[
                                                    styles.messageText,
                                                    isMe ? styles.messageTextMe : styles.messageTextOther,
                                                ]}>
                                                    {message.content}
                                                </Text>
                                            </View>
                                            <Text style={styles.messageTime}>
                                                {formatTime(message.created_at)}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        ))
                    )}

                    {sending && (
                        <View style={styles.sendingIndicator}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={styles.sendingText}>Enviando...</Text>
                        </View>
                    )}
                </ScrollView>

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Digite sua mensagem..."
                        placeholderTextColor="#666"
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || sending}
                    >
                        <Ionicons name="send" size={20} color="#000" />
                    </TouchableOpacity>
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
    noTeacherContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noTeacherTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    noTeacherSubtitle: {
        color: '#666',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    onlineIndicator: {
        padding: 8,
    },
    onlineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.success,
    },
    keyboardView: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    emptyChat: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyChatTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptyChatSubtitle: {
        color: '#666',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    dateContainer: {
        alignItems: 'center',
        marginVertical: 16,
    },
    dateText: {
        color: '#666',
        fontSize: 12,
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
    },
    messageWrapper: {
        marginBottom: 12,
        maxWidth: '80%',
    },
    messageWrapperMe: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    messageWrapperOther: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 18,
    },
    messageBubbleMe: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    messageBubbleOther: {
        backgroundColor: '#1a1a1a',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    messageTextMe: {
        color: '#000',
    },
    messageTextOther: {
        color: '#fff',
    },
    messageTime: {
        color: '#666',
        fontSize: 10,
        marginTop: 4,
    },
    readIndicator: {
        color: Colors.primary,
    },
    sendingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 8,
    },
    sendingText: {
        color: '#666',
        fontSize: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        paddingBottom: 24,
        backgroundColor: '#0a0a0a',
        borderTopWidth: 1,
        borderTopColor: '#222',
        gap: 10,
    },
    textInput: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#fff',
        fontSize: 15,
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});

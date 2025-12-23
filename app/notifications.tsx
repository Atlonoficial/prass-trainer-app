// app/notifications.tsx - Tela de Notificações
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useNotifications } from '@/hooks/useNotifications';
import Colors from '@/constants/Colors';

export default function NotificationsScreen() {
    const {
        notifications,
        loading,
        unreadCount,
        markAsRead,
        markAllAsRead,
        permissionGranted
    } = useNotifications();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleNotificationPress = (notification: any) => {
        markAsRead(notification.id);

        // Navegar baseado no tipo
        if (notification.data?.type === 'chat') {
            router.push('/(tabs)/chat');
        } else if (notification.data?.type === 'workout') {
            router.push('/(tabs)/workouts');
        } else if (notification.data?.type === 'nutrition') {
            router.push('/(tabs)/nutrition');
        }
    };

    const getNotificationIcon = (type?: string) => {
        switch (type) {
            case 'chat':
                return 'message-circle';
            case 'workout':
                return 'activity';
            case 'nutrition':
                return 'heart';
            case 'achievement':
                return 'award';
            default:
                return 'bell';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Agora';
        if (minutes < 60) return `${minutes}min atrás`;
        if (hours < 24) return `${hours}h atrás`;
        if (days < 7) return `${days}d atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notificações</Text>
                {unreadCount > 0 && (
                    <TouchableOpacity
                        style={styles.markAllButton}
                        onPress={markAllAsRead}
                    >
                        <Text style={styles.markAllText}>Marcar todas</Text>
                    </TouchableOpacity>
                )}
            </Animated.View>

            {/* Permissão não concedida */}
            {!permissionGranted && (
                <View style={styles.permissionBanner}>
                    <Feather name="bell-off" size={20} color="#F59E0B" />
                    <Text style={styles.permissionText}>
                        Ative as notificações nas configurações do dispositivo
                    </Text>
                </View>
            )}

            {/* Lista */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.tint} />
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Feather name="bell" size={48} color={Colors.dark.textSecondary} />
                    <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
                    <Text style={styles.emptySubtitle}>
                        Você receberá atualizações do seu treinador aqui
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {notifications.map((notification, index) => (
                        <Animated.View
                            key={notification.id}
                            style={{
                                opacity: fadeAnim,
                                transform: [{
                                    translateY: fadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [20, 0],
                                    })
                                }]
                            }}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.notificationItem,
                                    !notification.read && styles.unreadItem
                                ]}
                                onPress={() => handleNotificationPress(notification)}
                            >
                                <View style={[
                                    styles.iconContainer,
                                    { backgroundColor: notification.read ? '#2D2D2D' : 'rgba(245, 158, 11, 0.2)' }
                                ]}>
                                    <Feather
                                        name={getNotificationIcon(notification.data?.type as string)}
                                        size={20}
                                        color={notification.read ? Colors.dark.textSecondary : '#F59E0B'}
                                    />
                                </View>
                                <View style={styles.notificationContent}>
                                    <Text style={[
                                        styles.notificationTitle,
                                        !notification.read && styles.unreadText
                                    ]}>
                                        {notification.title}
                                    </Text>
                                    <Text style={styles.notificationBody} numberOfLines={2}>
                                        {notification.body}
                                    </Text>
                                    <Text style={styles.notificationTime}>
                                        {formatDate(notification.created_at)}
                                    </Text>
                                </View>
                                {!notification.read && (
                                    <View style={styles.unreadDot} />
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </ScrollView>
            )}
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    markAllButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    markAllText: {
        fontSize: 14,
        color: Colors.dark.tint,
        fontWeight: '600',
    },
    permissionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        padding: 12,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 8,
        gap: 10,
    },
    permissionText: {
        flex: 1,
        fontSize: 13,
        color: '#F59E0B',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.dark.text,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 8,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.dark.backgroundSecondary,
        borderRadius: 12,
        padding: 14,
        gap: 12,
    },
    unreadItem: {
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    unreadText: {
        color: '#F59E0B',
    },
    notificationBody: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        lineHeight: 18,
    },
    notificationTime: {
        fontSize: 11,
        color: Colors.dark.textSecondary,
        marginTop: 6,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F59E0B',
        marginTop: 4,
    },
});

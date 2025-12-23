// src/hooks/useNotifications.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

// Configurar como as notificações devem ser exibidas quando o app está em primeiro plano
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface PushNotification {
    id: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    read: boolean;
    created_at: string;
}

export function useNotifications() {
    const { user } = useAuth();
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const [notifications, setNotifications] = useState<PushNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [tableExists, setTableExists] = useState(true);

    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener = useRef<Notifications.EventSubscription | null>(null);

    // Registrar para push notifications (simplificado para Expo Go)
    const registerForPushNotificationsAsync = useCallback(async (): Promise<void> => {
        if (Platform.OS === 'android') {
            try {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#F59E0B',
                });
            } catch (error) {
                console.log('Erro ao criar canal de notificações:', error);
            }
        }

        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            setPermissionGranted(finalStatus === 'granted');

            // Nota: Push tokens remotos não funcionam no Expo Go SDK 53+
            // Para produção, use Development Build
            console.log('Notificações locais configuradas.');

        } catch (error) {
            console.log('Erro ao configurar notificações:', error);
        }
    }, []);

    // Buscar notificações do banco (com tratamento de erro)
    const fetchNotifications = useCallback(async () => {
        if (!user?.id || !tableExists) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                // Se a tabela não existe, desabilitar futuras buscas
                if (error.code === '42703' || error.code === '42P01') {
                    console.log('Tabela de notificações não existe ainda.');
                    setTableExists(false);
                    return;
                }
                throw error;
            }
            setNotifications(data || []);
        } catch (error) {
            console.log('Notificações não disponíveis');
        } finally {
            setLoading(false);
        }
    }, [user?.id, tableExists]);

    // Marcar notificação como lida
    const markAsRead = useCallback(async (notificationId: string) => {
        if (!tableExists) return;

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId);

            if (error) throw error;

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.log('Erro ao marcar como lida:', error);
        }
    }, [tableExists]);

    // Marcar todas como lidas
    const markAllAsRead = useCallback(async () => {
        if (!user?.id || !tableExists) return;

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false);

            if (error) throw error;

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.log('Erro ao marcar todas como lidas:', error);
        }
    }, [user?.id, tableExists]);

    // Contar não lidas
    const unreadCount = notifications.filter(n => !n.read).length;

    // Inicialização
    useEffect(() => {
        if (!user?.id) return;

        // Registrar para notificações
        registerForPushNotificationsAsync();

        // Listener para notificações recebidas
        notificationListener.current = Notifications.addNotificationReceivedListener(notif => {
            setNotification(notif);
            fetchNotifications();
        });

        // Listener para quando usuário interage com a notificação
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Usuário interagiu com notificação:', response.notification.request.content);
        });

        // Buscar notificações existentes
        fetchNotifications();

        // Cleanup
        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, [user?.id, registerForPushNotificationsAsync, fetchNotifications]);

    return {
        expoPushToken,
        notification,
        notifications,
        loading,
        unreadCount,
        permissionGranted,
        tableExists,
        markAsRead,
        markAllAsRead,
        refetch: fetchNotifications,
    };
}

// Função auxiliar para enviar notificação local (para testes)
export async function sendLocalNotification(title: string, body: string, data?: Record<string, unknown>) {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
            },
            trigger: null, // Enviar imediatamente
        });
    } catch (error) {
        console.log('Erro ao enviar notificação local:', error);
    }
}

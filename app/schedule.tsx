// app/schedule.tsx - Agenda de Consultas (simplificado para compatibilidade)
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStudentAppointments, Appointment } from '@/hooks/useStudentAppointments';
import { AppHeader } from '@/components/ui/AppHeader';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Colors from '@/constants/Colors';

export default function ScheduleScreen() {
    const {
        appointments,
        upcomingAppointments,
        loading,
        cancelAppointment,
    } = useStudentAppointments();

    const [refreshing, setRefreshing] = useState(false);

    const pastAppointments = appointments.filter(
        (a) => a.status === 'cancelled' || a.status === 'completed'
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // Simulated refresh - hook reloads on mount
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const handleCancelAppointment = (appointment: Appointment) => {
        Alert.alert(
            'Cancelar consulta?',
            'Esta ação não pode ser desfeita.',
            [
                { text: 'Manter', style: 'cancel' },
                {
                    text: 'Cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await cancelAppointment(appointment.id);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (e: any) {
                            Alert.alert('Erro', e.message);
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateStr: string, timeStr?: string) => {
        const fullDate = timeStr ? `${dateStr}T${timeStr}` : dateStr;
        return new Date(fullDate).toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return { label: 'Confirmado', color: Colors.success };
            case 'scheduled':
                return { label: 'Agendado', color: Colors.warning };
            case 'cancelled':
                return { label: 'Cancelado', color: Colors.error };
            case 'completed':
                return { label: 'Realizado', color: '#3B82F6' };
            default:
                return { label: status, color: '#666' };
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <AppHeader title="Agenda" showBack />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Carregando...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader title="Agenda" showBack />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
            >
                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={24} color={Colors.primary} />
                    <Text style={styles.infoText}>
                        Para agendar uma consulta, entre em contato com seu treinador pelo chat.
                    </Text>
                </View>

                {/* Próximas Consultas */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📅 Próximas Consultas</Text>

                    {upcomingAppointments.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="calendar-outline" size={48} color="#333" />
                            <Text style={styles.emptyText}>Nenhuma consulta agendada</Text>
                            <Text style={styles.emptySubtext}>
                                Agende uma consulta com seu treinador
                            </Text>
                        </View>
                    ) : (
                        upcomingAppointments.map((appointment, index) => {
                            const status = getStatusBadge(appointment.status);
                            return (
                                <AnimatedCard key={appointment.id} delay={index * 50}>
                                    <View style={styles.appointmentCard}>
                                        <View style={styles.appointmentHeader}>
                                            <View style={styles.dateBox}>
                                                <Text style={styles.dateDay}>
                                                    {new Date(appointment.appointment_date).getDate()}
                                                </Text>
                                                <Text style={styles.dateMonth}>
                                                    {new Date(appointment.appointment_date).toLocaleDateString('pt-BR', { month: 'short' })}
                                                </Text>
                                            </View>
                                            <View style={styles.appointmentInfo}>
                                                <Text style={styles.appointmentTime}>
                                                    {appointment.start_time} - {appointment.end_time}
                                                </Text>
                                                <Text style={styles.appointmentDate}>
                                                    {formatDate(appointment.appointment_date)}
                                                </Text>
                                                {appointment.notes && (
                                                    <Text style={styles.appointmentNotes}>
                                                        {appointment.notes}
                                                    </Text>
                                                )}
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                                                <Text style={[styles.statusText, { color: status.color }]}>
                                                    {status.label}
                                                </Text>
                                            </View>
                                        </View>

                                        {appointment.status !== 'cancelled' && (
                                            <TouchableOpacity
                                                style={styles.cancelButton}
                                                onPress={() => handleCancelAppointment(appointment)}
                                            >
                                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </AnimatedCard>
                            );
                        })
                    )}
                </View>

                {/* Histórico */}
                {pastAppointments.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📋 Histórico</Text>
                        {pastAppointments.slice(0, 5).map((appointment) => {
                            const status = getStatusBadge(appointment.status);
                            return (
                                <View key={appointment.id} style={styles.historyCard}>
                                    <View>
                                        <Text style={styles.historyDate}>
                                            {formatDate(appointment.appointment_date)}
                                        </Text>
                                        <Text style={styles.historyTime}>
                                            {appointment.start_time} - {appointment.end_time}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                                        <Text style={[styles.statusText, { color: status.color }]}>
                                            {status.label}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
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
        color: '#fff',
        fontSize: 16,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary + '15',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
        gap: 12,
    },
    infoText: {
        flex: 1,
        color: '#fff',
        fontSize: 13,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    emptyCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    appointmentCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    appointmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateBox: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        marginRight: 16,
    },
    dateDay: {
        color: '#000',
        fontSize: 24,
        fontWeight: '700',
    },
    dateMonth: {
        color: '#000',
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    appointmentInfo: {
        flex: 1,
    },
    appointmentTime: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    appointmentDate: {
        color: '#999',
        fontSize: 12,
        marginTop: 2,
        textTransform: 'capitalize',
    },
    appointmentNotes: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#222',
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        marginTop: 12,
    },
    cancelButtonText: {
        color: Colors.error,
        fontSize: 14,
        fontWeight: '500',
    },
    historyCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    historyDate: {
        color: '#fff',
        fontSize: 14,
        textTransform: 'capitalize',
    },
    historyTime: {
        color: '#666',
        fontSize: 12,
    },
});

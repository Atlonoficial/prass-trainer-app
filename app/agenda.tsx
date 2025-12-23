// app/agenda.tsx - Tela de Agenda
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useWorkouts } from '@/hooks/useWorkouts';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Colors from '@/constants/Colors';

export default function AgendaScreen() {
    const { user } = useAuth();
    const { workouts, currentWorkout } = useWorkouts();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const getDaysOfWeek = () => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push({
                date,
                dayName: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
                dayNumber: date.getDate(),
                isToday: i === 0,
            });
        }
        return days;
    };

    const days = getDaysOfWeek();
    const [selectedDay, setSelectedDay] = useState(0);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Agenda</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={styles.sectionTitle}>Esta Semana</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.daysScroll}
                    >
                        {days.map((day, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.dayCard,
                                    selectedDay === index && styles.dayCardSelected,
                                    day.isToday && styles.dayCardToday,
                                ]}
                                onPress={() => setSelectedDay(index)}
                            >
                                <Text style={[
                                    styles.dayName,
                                    selectedDay === index && styles.dayTextSelected,
                                ]}>
                                    {day.dayName}
                                </Text>
                                <Text style={[
                                    styles.dayNumber,
                                    selectedDay === index && styles.dayTextSelected,
                                ]}>
                                    {day.dayNumber}
                                </Text>
                                {day.isToday && <View style={styles.todayDot} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Animated.View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {selectedDay === 0 ? 'Treinos de Hoje' : `Treinos - ${days[selectedDay].dayName}`}
                    </Text>

                    {currentWorkout ? (
                        <AnimatedCard style={styles.workoutCard} delay={100} onPress={() => router.push('/(tabs)/workouts')}>
                            <View style={styles.workoutTime}>
                                <Feather name="clock" size={14} color="#F59E0B" />
                                <Text style={styles.timeText}>Qualquer horário</Text>
                            </View>
                            <Text style={styles.workoutName}>{currentWorkout.name}</Text>
                            <Text style={styles.workoutDesc}>
                                {currentWorkout.sessions.length} sessões • {currentWorkout.sessions_per_week}x/semana
                            </Text>
                            <TouchableOpacity style={styles.startButton}>
                                <Feather name="play" size={16} color="#000" />
                                <Text style={styles.startButtonText}>Iniciar</Text>
                            </TouchableOpacity>
                        </AnimatedCard>
                    ) : (
                        <AnimatedCard style={styles.emptyCard} delay={100}>
                            <Feather name="calendar" size={32} color={Colors.dark.textSecondary} />
                            <Text style={styles.emptyTitle}>Nenhum treino agendado</Text>
                            <Text style={styles.emptyDesc}>
                                Seu treinador ainda não criou um plano para este dia.
                            </Text>
                        </AnimatedCard>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Lembretes</Text>

                    <AnimatedCard style={styles.reminderCard} delay={200}>
                        <View style={[styles.reminderIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                            <Feather name="droplet" size={20} color="#3B82F6" />
                        </View>
                        <View style={styles.reminderInfo}>
                            <Text style={styles.reminderTitle}>Hidratação</Text>
                            <Text style={styles.reminderDesc}>Beba água regularmente</Text>
                        </View>
                        <Feather name="bell" size={18} color={Colors.dark.textSecondary} />
                    </AnimatedCard>

                    <AnimatedCard style={styles.reminderCard} delay={250}>
                        <View style={[styles.reminderIcon, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                            <Feather name="moon" size={20} color="#22C55E" />
                        </View>
                        <View style={styles.reminderInfo}>
                            <Text style={styles.reminderTitle}>Descanso</Text>
                            <Text style={styles.reminderDesc}>Durma 7-8 horas</Text>
                        </View>
                        <Feather name="bell" size={18} color={Colors.dark.textSecondary} />
                    </AnimatedCard>
                </View>
            </ScrollView>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 16,
    },
    daysScroll: {
        marginBottom: 8,
    },
    dayCard: {
        width: 56,
        height: 72,
        borderRadius: 16,
        backgroundColor: Colors.dark.backgroundSecondary,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayCardSelected: {
        backgroundColor: '#F59E0B',
    },
    dayCardToday: {
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    dayName: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginBottom: 4,
        textTransform: 'capitalize',
    },
    dayNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    dayTextSelected: {
        color: '#000',
    },
    todayDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F59E0B',
        marginTop: 4,
    },
    workoutCard: {
        padding: 16,
    },
    workoutTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    timeText: {
        fontSize: 12,
        color: '#F59E0B',
    },
    workoutName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    workoutDesc: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginBottom: 16,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F59E0B',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
    },
    startButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    emptyCard: {
        padding: 32,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
        marginTop: 12,
    },
    emptyDesc: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        marginTop: 4,
    },
    reminderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        marginBottom: 8,
    },
    reminderIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reminderInfo: {
        flex: 1,
        marginLeft: 12,
    },
    reminderTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    reminderDesc: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        marginTop: 2,
    },
});

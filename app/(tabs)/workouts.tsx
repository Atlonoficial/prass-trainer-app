// app/(tabs)/workouts.tsx - Tela de Treinos com dados reais
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useWorkouts, Workout, WorkoutSession } from '@/hooks/useWorkouts';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { AppHeader } from '@/components/ui/AppHeader';
import Colors from '@/constants/Colors';

function WorkoutCard({ workout, delay }: { workout: Workout; delay: number }) {
    const totalExercises = workout.sessions.reduce(
        (sum, session) => sum + session.exercises.length,
        0
    );

    return (
        <AnimatedCard
            style={styles.workoutCard}
            delay={delay}
            onPress={() => { }}
        >
            <View style={styles.workoutHeader}>
                <View style={styles.workoutIconContainer}>
                    <Feather name="activity" size={24} color="#F59E0B" />
                </View>
                <View style={styles.workoutInfo}>
                    <Text style={styles.workoutName}>{workout.name}</Text>
                    <Text style={styles.workoutDetails}>
                        {workout.sessions.length} sessões • {totalExercises} exercícios
                    </Text>
                </View>
                <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
            </View>

            <View style={styles.workoutMeta}>
                <View style={styles.metaItem}>
                    <Feather name="clock" size={14} color={Colors.dark.textSecondary} />
                    <Text style={styles.metaText}>{workout.duration_weeks} semanas</Text>
                </View>
                <View style={styles.metaItem}>
                    <Feather name="repeat" size={14} color={Colors.dark.textSecondary} />
                    <Text style={styles.metaText}>{workout.sessions_per_week}x/semana</Text>
                </View>
                <View style={[styles.difficultyBadge, {
                    backgroundColor: workout.difficulty === 'beginner' ? '#22C55E20' :
                        workout.difficulty === 'intermediate' ? '#F59E0B20' : '#EF444420'
                }]}>
                    <Text style={[styles.difficultyText, {
                        color: workout.difficulty === 'beginner' ? '#22C55E' :
                            workout.difficulty === 'intermediate' ? '#F59E0B' : '#EF4444'
                    }]}>
                        {workout.difficulty === 'beginner' ? 'Iniciante' :
                            workout.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                    </Text>
                </View>
            </View>
        </AnimatedCard>
    );
}

function SessionCard({ session, index }: { session: WorkoutSession; index: number }) {
    return (
        <AnimatedCard style={styles.sessionCard} delay={200 + index * 100} onPress={() => { }}>
            <View style={styles.sessionHeader}>
                <View style={styles.sessionNumber}>
                    <Text style={styles.sessionNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.sessionInfo}>
                    <Text style={styles.sessionName}>{session.name}</Text>
                    <Text style={styles.sessionExercises}>
                        {session.exercises.length} exercícios
                    </Text>
                </View>
                <TouchableOpacity style={styles.startButton}>
                    <Feather name="play" size={16} color="#000" />
                </TouchableOpacity>
            </View>
        </AnimatedCard>
    );
}

export default function WorkoutsScreen() {
    const { workouts, currentWorkout, loading, error } = useWorkouts();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.loadingText}>Carregando treinos...</Text>
            </View>
        );
    }

    const hasWorkouts = workouts.length > 0;

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header com Logo */}
                <AppHeader />

                {/* Treino Atual */}
                {currentWorkout && (
                    <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                        <Text style={styles.sectionTitle}>Treino Atual</Text>
                        <AnimatedCard style={styles.currentWorkoutCard} delay={100}>
                            <View style={styles.currentWorkoutHeader}>
                                <View style={styles.currentWorkoutIcon}>
                                    <Feather name="zap" size={28} color="#F59E0B" />
                                </View>
                                <View style={styles.currentWorkoutInfo}>
                                    <Text style={styles.currentWorkoutName}>{currentWorkout.name}</Text>
                                    <Text style={styles.currentWorkoutDesc}>
                                        {currentWorkout.description || 'Vamos treinar!'}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.startWorkoutButton}>
                                <Feather name="play" size={18} color="#000" />
                                <Text style={styles.startWorkoutText}>Iniciar Treino</Text>
                            </TouchableOpacity>
                        </AnimatedCard>

                        {/* Sessões do treino atual */}
                        <Text style={styles.subsectionTitle}>Sessões</Text>
                        {currentWorkout.sessions.map((session, index) => (
                            <SessionCard key={session.id} session={session} index={index} />
                        ))}
                    </Animated.View>
                )}

                {/* Lista de todos os treinos */}
                {hasWorkouts && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Meus Treinos</Text>
                        {workouts.map((workout, index) => (
                            <WorkoutCard key={workout.id} workout={workout} delay={index * 100} />
                        ))}
                    </View>
                )}

                {/* Empty State */}
                {!hasWorkouts && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>Nenhum plano encontrado</Text>
                        <Text style={styles.emptyDescription}>
                            Entre em contato com o seu professor para receber o seu plano de treino e dieta.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: Colors.dark.textSecondary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 16,
    },
    subsectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
        marginTop: 16,
        marginBottom: 12,
    },
    currentWorkoutCard: {
        padding: 20,
    },
    currentWorkoutHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    currentWorkoutIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentWorkoutInfo: {
        flex: 1,
        marginLeft: 14,
        justifyContent: 'center',
    },
    currentWorkoutName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    currentWorkoutDesc: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginTop: 4,
    },
    startWorkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F59E0B',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    startWorkoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    sessionCard: {
        padding: 16,
        marginBottom: 8,
    },
    sessionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sessionNumber: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sessionNumberText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F59E0B',
    },
    sessionInfo: {
        flex: 1,
        marginLeft: 12,
    },
    sessionName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    sessionExercises: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        marginTop: 2,
    },
    startButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F59E0B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    workoutCard: {
        padding: 16,
        marginBottom: 12,
    },
    workoutHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    workoutIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    workoutInfo: {
        flex: 1,
        marginLeft: 12,
    },
    workoutName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    workoutDetails: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        marginTop: 2,
    },
    workoutMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    difficultyText: {
        fontSize: 11,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyDescription: {
        fontSize: 15,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F59E0B',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    contactButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
});

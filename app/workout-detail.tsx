// app/workout-detail.tsx - Tela de execução de treino
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useWorkouts, Exercise } from '@/hooks/useWorkouts';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Colors from '@/constants/Colors';

export default function WorkoutDetailScreen() {
    const router = useRouter();
    const { workoutId, sessionId } = useLocalSearchParams<{ workoutId: string; sessionId: string }>();
    const {
        workouts,
        activeSession,
        startWorkout,
        completeSet,
        completeExercise,
        completeWorkout,
        cancelWorkout
    } = useWorkouts();

    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const [restTime, setRestTime] = useState(60);
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const workout = workouts.find((w) => w.id === workoutId);
    const session = workout?.sessions.find((s) => s.id === sessionId);
    const currentExercise = session?.exercises[currentExerciseIndex];

    // Inicia o treino quando a tela carrega
    useEffect(() => {
        if (workoutId && sessionId && !activeSession) {
            startWorkout(workoutId, sessionId).catch((e) => {
                Alert.alert('Erro', e.message);
                router.back();
            });
        }
    }, [workoutId, sessionId]);

    // Timer de descanso
    useEffect(() => {
        if (isResting && restTime > 0) {
            timerRef.current = setTimeout(() => {
                setRestTime((prev) => prev - 1);
            }, 1000);
        } else if (isResting && restTime === 0) {
            setIsResting(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isResting, restTime]);

    const handleCompleteSet = () => {
        if (!currentExercise) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        completeSet(currentExercise.id, currentSetIndex, {
            reps: parseInt(reps) || currentExercise.reps || 12,
            weight: parseFloat(weight) || currentExercise.weight,
        });

        const totalSets = parseInt(currentExercise.sets) || 3;

        if (currentSetIndex < totalSets - 1) {
            // Próxima série
            setCurrentSetIndex((prev) => prev + 1);
            setRestTime(currentExercise.rest_time || 60);
            setIsResting(true);
        } else {
            // Exercício completo
            completeExercise(currentExercise.id);

            if (currentExerciseIndex < (session?.exercises.length || 0) - 1) {
                // Próximo exercício
                setCurrentExerciseIndex((prev) => prev + 1);
                setCurrentSetIndex(0);
                setRestTime(90); // Descanso maior entre exercícios
                setIsResting(true);
            } else {
                // Treino completo
                handleFinishWorkout();
            }
        }

        setShowWeightModal(false);
        setWeight('');
        setReps('');
    };

    const handleFinishWorkout = async () => {
        try {
            const result = await completeWorkout();
            if (result) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                    '🎉 Treino Concluído!',
                    `Duração: ${result.duration} minutos\nXP Ganho: +${result.xpEarned}`,
                    [{ text: 'OK', onPress: () => router.replace('/(tabs)/workouts') }]
                );
            }
        } catch (e: any) {
            Alert.alert('Erro', e.message);
        }
    };

    const handleCancelWorkout = () => {
        Alert.alert(
            'Cancelar Treino?',
            'O progresso não será salvo.',
            [
                { text: 'Continuar', style: 'cancel' },
                {
                    text: 'Cancelar Treino',
                    style: 'destructive',
                    onPress: () => {
                        cancelWorkout();
                        router.back();
                    }
                },
            ]
        );
    };

    const skipRest = () => {
        setIsResting(false);
        setRestTime(0);
    };

    if (!workout || !session || !currentExercise) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Carregando treino...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const progress = ((currentExerciseIndex * (parseInt(currentExercise.sets) || 3) + currentSetIndex + 1) /
        (session.exercises.reduce((sum, ex) => sum + (parseInt(ex.sets) || 3), 0))) * 100;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancelWorkout} style={styles.backButton}>
                    <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{session.name}</Text>
                    <Text style={styles.headerSubtitle}>
                        Exercício {currentExerciseIndex + 1}/{session.exercises.length}
                    </Text>
                </View>
                <TouchableOpacity onPress={handleFinishWorkout} style={styles.finishButton}>
                    <Text style={styles.finishButtonText}>Finalizar</Text>
                </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Timer de Descanso */}
                {isResting ? (
                    <AnimatedCard delay={0}>
                        <View style={styles.restCard}>
                            <Text style={styles.restTitle}>⏱️ Descanse</Text>
                            <Text style={styles.restTimer}>{restTime}s</Text>
                            <TouchableOpacity style={styles.skipButton} onPress={skipRest}>
                                <Text style={styles.skipButtonText}>Pular Descanso</Text>
                            </TouchableOpacity>
                        </View>
                    </AnimatedCard>
                ) : (
                    <>
                        {/* Card do Exercício Atual */}
                        <AnimatedCard delay={0}>
                            <View style={styles.exerciseCard}>
                                <View style={styles.exerciseHeader}>
                                    <Text style={styles.exerciseName}>{currentExercise.name}</Text>
                                    <View style={styles.categoryBadge}>
                                        <Text style={styles.categoryText}>{currentExercise.category}</Text>
                                    </View>
                                </View>

                                <View style={styles.exerciseDetails}>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Séries</Text>
                                        <Text style={styles.detailValue}>
                                            {currentSetIndex + 1}/{currentExercise.sets || 3}
                                        </Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Repetições</Text>
                                        <Text style={styles.detailValue}>{currentExercise.reps || 12}</Text>
                                    </View>
                                    {currentExercise.weight && (
                                        <View style={styles.detailItem}>
                                            <Text style={styles.detailLabel}>Carga</Text>
                                            <Text style={styles.detailValue}>{currentExercise.weight}kg</Text>
                                        </View>
                                    )}
                                </View>

                                {currentExercise.notes && (
                                    <View style={styles.notesContainer}>
                                        <Text style={styles.notesLabel}>📝 Observações:</Text>
                                        <Text style={styles.notesText}>{currentExercise.notes}</Text>
                                    </View>
                                )}

                                {currentExercise.instructions && (
                                    <View style={styles.instructionsContainer}>
                                        <Text style={styles.instructionsLabel}>🎯 Instruções:</Text>
                                        <Text style={styles.instructionsText}>{currentExercise.instructions}</Text>
                                    </View>
                                )}
                            </View>
                        </AnimatedCard>

                        {/* Botão de Completar */}
                        <TouchableOpacity
                            style={styles.completeButton}
                            onPress={() => setShowWeightModal(true)}
                        >
                            <Text style={styles.completeButtonText}>✓ Completar Série</Text>
                        </TouchableOpacity>

                        {/* Lista de Exercícios */}
                        <View style={styles.exerciseList}>
                            <Text style={styles.listTitle}>Exercícios do Treino</Text>
                            {session.exercises.map((ex, index) => (
                                <View
                                    key={ex.id}
                                    style={[
                                        styles.exerciseListItem,
                                        index < currentExerciseIndex && styles.completedExercise,
                                        index === currentExerciseIndex && styles.currentExercise,
                                    ]}
                                >
                                    <View style={styles.exerciseIcon}>
                                        {index < currentExerciseIndex ? (
                                            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                                        ) : index === currentExerciseIndex ? (
                                            <Ionicons name="play-circle" size={24} color={Colors.primary} />
                                        ) : (
                                            <Ionicons name="ellipse-outline" size={24} color="#666" />
                                        )}
                                    </View>
                                    <View style={styles.exerciseInfo}>
                                        <Text style={[
                                            styles.exerciseListName,
                                            index < currentExerciseIndex && styles.completedText,
                                        ]}>
                                            {ex.name}
                                        </Text>
                                        <Text style={styles.exerciseListMeta}>
                                            {ex.sets} séries × {ex.reps} reps
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Modal para registrar peso/reps */}
            <Modal
                visible={showWeightModal}
                transparent
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Registrar Série</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Repetições</Text>
                            <TextInput
                                style={styles.input}
                                value={reps}
                                onChangeText={setReps}
                                placeholder={`${currentExercise?.reps || 12}`}
                                placeholderTextColor="#666"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Carga (kg)</Text>
                            <TextInput
                                style={styles.input}
                                value={weight}
                                onChangeText={setWeight}
                                placeholder={`${currentExercise?.weight || 0}`}
                                placeholderTextColor="#666"
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowWeightModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalConfirmButton}
                                onPress={handleCompleteSet}
                            >
                                <Text style={styles.modalConfirmText}>Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    headerSubtitle: {
        color: '#999',
        fontSize: 12,
    },
    finishButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    finishButtonText: {
        color: '#000',
        fontWeight: '600',
        fontSize: 14,
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#222',
        marginHorizontal: 16,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    restCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    restTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 20,
    },
    restTimer: {
        color: Colors.primary,
        fontSize: 72,
        fontWeight: '700',
    },
    skipButton: {
        marginTop: 30,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#333',
        borderRadius: 25,
    },
    skipButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    exerciseCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 20,
    },
    exerciseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    exerciseName: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '700',
        flex: 1,
    },
    categoryBadge: {
        backgroundColor: Colors.primary + '20',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '500',
    },
    exerciseDetails: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    detailItem: {
        alignItems: 'center',
    },
    detailLabel: {
        color: '#666',
        fontSize: 12,
        marginBottom: 4,
    },
    detailValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    notesContainer: {
        backgroundColor: '#222',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    notesLabel: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    notesText: {
        color: '#ccc',
        fontSize: 14,
    },
    instructionsContainer: {
        backgroundColor: '#222',
        borderRadius: 12,
        padding: 12,
    },
    instructionsLabel: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    instructionsText: {
        color: '#ccc',
        fontSize: 14,
        lineHeight: 20,
    },
    completeButton: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginVertical: 20,
    },
    completeButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: '700',
    },
    exerciseList: {
        marginTop: 10,
    },
    listTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    exerciseListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    completedExercise: {
        opacity: 0.6,
    },
    currentExercise: {
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    exerciseIcon: {
        marginRight: 12,
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseListName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    completedText: {
        textDecorationLine: 'line-through',
    },
    exerciseListMeta: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        color: '#999',
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#222',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        marginTop: 24,
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: '#333',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    modalConfirmButton: {
        flex: 1,
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    modalConfirmText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
});

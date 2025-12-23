// src/hooks/useWorkouts.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Exercise {
    id: string;
    name: string;
    category: string;
    sets: string;
    reps: number;
    weight?: number;
    duration?: number;
    rest_time: number;
    notes?: string;
    muscle_groups?: string[];
    equipment?: string[];
    difficulty?: string;
    instructions?: string;
    video_url?: string;
    image_url?: string;
}

export interface WorkoutSession {
    id: string;
    name: string;
    notes?: string;
    exercises: Exercise[];
}

export interface Workout {
    id: string;
    name: string;
    description?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration_weeks: number;
    sessions_per_week: number;
    sessions: WorkoutSession[];
    tags: string[];
    notes?: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface WorkoutPlan {
    id: string;
    student_id: string;
    teacher_id?: string;
    name: string;
    description?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration_weeks: number;
    sessions_per_week: number;
    exercises_data: any;
    tags: string[];
    notes?: string;
    status: 'active' | 'inactive' | 'completed';
    created_at: string;
    updated_at: string;
}

export function useWorkouts() {
    const { user } = useAuth();
    const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Converte WorkoutPlan para formato Workout
    const convertWorkoutPlan = (plan: WorkoutPlan): Workout => {
        let sessions: WorkoutSession[] = [];

        if (Array.isArray(plan.exercises_data)) {
            if (plan.exercises_data.length > 0 && 'exercises' in plan.exercises_data[0]) {
                sessions = plan.exercises_data.map((sessionData: any) => ({
                    id: sessionData.id || `session-${Math.random()}`,
                    name: sessionData.name || 'Treino Principal',
                    notes: sessionData.notes,
                    exercises: Array.isArray(sessionData.exercises)
                        ? sessionData.exercises.map((ex: any) => ({
                            id: ex.id || `ex-${Math.random()}`,
                            name: ex.name,
                            category: ex.category || 'general',
                            sets: ex.sets || '3',
                            reps: ex.reps || 12,
                            weight: ex.weight,
                            duration: ex.duration,
                            rest_time: ex.rest_time || 60,
                            notes: ex.notes,
                            muscle_groups: ex.muscle_groups || [],
                            equipment: ex.equipment || [],
                            difficulty: plan.difficulty,
                            instructions: ex.instructions || '',
                            video_url: ex.video_url || '',
                            image_url: ex.image_url || '',
                        }))
                        : [],
                }));
            } else if (plan.exercises_data.length > 0) {
                sessions = [
                    {
                        id: `session-${plan.id}`,
                        name: 'Treino Completo',
                        notes: plan.description,
                        exercises: plan.exercises_data.map((ex: any) => ({
                            id: ex.id || `ex-${Math.random()}`,
                            name: ex.name || ex.exercise || 'Exercício',
                            category: ex.category || 'general',
                            sets: ex.sets || '3',
                            reps: ex.reps || 12,
                            weight: ex.weight,
                            duration: ex.duration,
                            rest_time: ex.rest_time || 60,
                            notes: ex.notes,
                            muscle_groups: ex.muscle_groups || [],
                            equipment: ex.equipment || [],
                            difficulty: plan.difficulty,
                            instructions: ex.instructions || '',
                            video_url: ex.video_url || '',
                            image_url: ex.image_url || '',
                        })),
                    },
                ];
            }
        }

        return {
            id: plan.id,
            name: plan.name,
            description: plan.description,
            difficulty: plan.difficulty,
            duration_weeks: plan.duration_weeks,
            sessions_per_week: plan.sessions_per_week,
            sessions,
            tags: plan.tags || [],
            notes: plan.notes,
            status: plan.status,
            created_at: plan.created_at,
            updated_at: plan.updated_at,
        };
    };

    useEffect(() => {
        if (!user?.id) {
            setWorkoutPlans([]);
            setWorkouts([]);
            setLoading(false);
            return;
        }

        let studentId: string | null = null;

        const fetchWorkouts = async () => {
            setLoading(true);
            try {
                // Primeiro busca o student_id
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (!studentData?.id) {
                    setLoading(false);
                    return;
                }

                studentId = studentData.id;

                // Busca treinos de duas formas:
                // 1. Planos atribuídos via assigned_students (usado pelo dashboard web)
                // 2. Planos criados diretamente com student_id

                const { data: plansByAssigned } = await supabase
                    .from('workout_plans')
                    .select('*')
                    .contains('assigned_students', [studentData.id])
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                const { data: plansByStudentId } = await supabase
                    .from('workout_plans')
                    .select('*')
                    .eq('student_id', studentData.id)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                // Combina os resultados e remove duplicatas
                const allPlans = [...(plansByAssigned || []), ...(plansByStudentId || [])];
                const uniquePlans = allPlans.filter((plan, index, self) =>
                    index === self.findIndex(p => p.id === plan.id)
                );

                setWorkoutPlans(uniquePlans);
                setWorkouts(uniquePlans.map(convertWorkoutPlan));
            } catch (e: any) {
                console.error('Error fetching workouts:', e);
                setError(e?.message || 'Erro ao carregar treinos');
            } finally {
                setLoading(false);
            }
        };

        fetchWorkouts();

        // Realtime subscription para atualizações automáticas
        const channel = supabase
            .channel('workout-plans-changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'workout_plans',
                },
                (payload) => {
                    console.log('Workout plan changed:', payload.eventType);
                    // Recarrega todos os treinos quando há mudança
                    fetchWorkouts();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);

    const currentWorkout = workouts.length > 0 ? workouts[0] : null;

    // Estado da sessão de treino ativa
    const [activeSession, setActiveSession] = useState<{
        workoutId: string;
        sessionId: string;
        startedAt: Date;
        completedExercises: string[];
        exerciseLogs: Array<{
            exerciseId: string;
            sets: Array<{ reps: number; weight?: number; completed: boolean }>;
        }>;
    } | null>(null);

    // Inicia uma sessão de treino
    const startWorkout = useCallback(
        async (workoutId: string, sessionId: string) => {
            if (!user?.id) throw new Error('User not authenticated');

            const workout = workouts.find((w) => w.id === workoutId);
            const session = workout?.sessions.find((s) => s.id === sessionId);

            if (!workout || !session) {
                throw new Error('Treino ou sessão não encontrada');
            }

            // Inicializa logs de exercícios
            const exerciseLogs = session.exercises.map((ex) => ({
                exerciseId: ex.id,
                sets: Array.from({ length: parseInt(ex.sets) || 3 }, () => ({
                    reps: ex.reps || 12,
                    weight: ex.weight,
                    completed: false,
                })),
            }));

            setActiveSession({
                workoutId,
                sessionId,
                startedAt: new Date(),
                completedExercises: [],
                exerciseLogs,
            });

            return { workout, session };
        },
        [user?.id, workouts]
    );

    // Registra uma série completada
    const completeSet = useCallback(
        (exerciseId: string, setIndex: number, data: { reps: number; weight?: number }) => {
            if (!activeSession) return;

            setActiveSession((prev) => {
                if (!prev) return null;

                const updatedLogs = prev.exerciseLogs.map((log) => {
                    if (log.exerciseId !== exerciseId) return log;

                    const updatedSets = [...log.sets];
                    updatedSets[setIndex] = {
                        ...updatedSets[setIndex],
                        ...data,
                        completed: true,
                    };

                    return { ...log, sets: updatedSets };
                });

                return { ...prev, exerciseLogs: updatedLogs };
            });
        },
        [activeSession]
    );

    // Marca exercício como completo
    const completeExercise = useCallback(
        (exerciseId: string) => {
            if (!activeSession) return;

            setActiveSession((prev) => {
                if (!prev) return null;
                return {
                    ...prev,
                    completedExercises: [...prev.completedExercises, exerciseId],
                };
            });
        },
        [activeSession]
    );

    // Finaliza a sessão de treino
    const completeWorkout = useCallback(async () => {
        if (!activeSession || !user?.id) return null;

        try {
            const { data: studentData } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!studentData) throw new Error('Student not found');

            const duration = Math.floor(
                (new Date().getTime() - activeSession.startedAt.getTime()) / 1000 / 60
            );

            // Salva o registro do treino
            const { data: workoutLog, error: logError } = await supabase
                .from('workout_logs')
                .insert({
                    student_id: studentData.id,
                    workout_plan_id: activeSession.workoutId,
                    session_name: activeSession.sessionId,
                    duration_minutes: duration,
                    exercises_completed: activeSession.completedExercises.length,
                    exercise_logs: activeSession.exerciseLogs,
                    completed_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (logError) throw logError;

            // Adiciona pontos de gamificação
            const XP_PER_WORKOUT = 50;
            const XP_PER_EXERCISE = 5;
            const totalXP = XP_PER_WORKOUT + activeSession.completedExercises.length * XP_PER_EXERCISE;

            await supabase.from('gamification_points').insert({
                student_id: studentData.id,
                points: totalXP,
                reason: `Treino concluído: ${duration} minutos`,
            });

            // Atualiza streak
            await supabase.rpc('update_streak', { p_student_id: studentData.id });

            // Limpa sessão ativa
            const result = { workoutLog, duration, xpEarned: totalXP };
            setActiveSession(null);

            return result;
        } catch (e: any) {
            console.error('Error completing workout:', e);
            throw e;
        }
    }, [activeSession, user?.id]);

    // Cancela treino sem salvar
    const cancelWorkout = useCallback(() => {
        setActiveSession(null);
    }, []);

    // Busca histórico de treinos
    const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchWorkoutHistory = useCallback(async () => {
        if (!user?.id) return;
        setHistoryLoading(true);

        try {
            const { data: studentData } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!studentData) return;

            const { data, error: historyError } = await supabase
                .from('workout_logs')
                .select('*')
                .eq('student_id', studentData.id)
                .order('completed_at', { ascending: false })
                .limit(30);

            if (historyError) throw historyError;
            setWorkoutHistory(data || []);
        } catch (e) {
            console.error('Error fetching workout history:', e);
        } finally {
            setHistoryLoading(false);
        }
    }, [user?.id]);

    return {
        workouts,
        workoutPlans,
        currentWorkout,
        loading,
        error,
        // Sessão ativa
        activeSession,
        startWorkout,
        completeSet,
        completeExercise,
        completeWorkout,
        cancelWorkout,
        isWorkoutActive: !!activeSession,
        // Histórico
        workoutHistory,
        historyLoading,
        fetchWorkoutHistory,
    };
}

export default useWorkouts;

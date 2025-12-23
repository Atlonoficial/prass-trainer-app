// src/hooks/useGoals.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Goal {
    id: string;
    student_id: string;
    title: string;
    description?: string;
    type: 'weight' | 'workout' | 'nutrition' | 'habit' | 'custom';
    target_value: number;
    current_value: number;
    unit: string;
    start_date: string;
    target_date?: string;
    status: 'active' | 'completed' | 'cancelled';
    progress_percentage: number;
    created_at: string;
    updated_at: string;
}

export function useGoals() {
    const { user } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
    const [completedGoals, setCompletedGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) {
            setGoals([]);
            setLoading(false);
            return;
        }

        const fetchGoals = async () => {
            setLoading(true);
            try {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (!studentData?.id) {
                    setLoading(false);
                    return;
                }

                const { data, error: fetchError } = await supabase
                    .from('goals')
                    .select('*')
                    .eq('student_id', studentData.id)
                    .order('created_at', { ascending: false });

                if (fetchError) throw fetchError;

                // Calcula progresso para cada meta
                const goalsWithProgress = (data || []).map((goal) => ({
                    ...goal,
                    progress_percentage: Math.min(
                        100,
                        Math.round((goal.current_value / goal.target_value) * 100)
                    ),
                }));

                setGoals(goalsWithProgress);
                setActiveGoals(goalsWithProgress.filter((g) => g.status === 'active'));
                setCompletedGoals(goalsWithProgress.filter((g) => g.status === 'completed'));
            } catch (e: any) {
                console.error('Error fetching goals:', e);
                setError(e?.message || 'Erro ao carregar metas');
            } finally {
                setLoading(false);
            }
        };

        fetchGoals();
    }, [user?.id]);

    // Cria nova meta
    const createGoal = useCallback(
        async (goalData: Omit<Goal, 'id' | 'student_id' | 'created_at' | 'updated_at' | 'progress_percentage'>) => {
            if (!user?.id) throw new Error('User not authenticated');

            try {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (!studentData) throw new Error('Student not found');

                const { data, error: insertError } = await supabase
                    .from('goals')
                    .insert({
                        student_id: studentData.id,
                        ...goalData,
                        status: 'active',
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                const goalWithProgress = {
                    ...data,
                    progress_percentage: Math.min(
                        100,
                        Math.round((data.current_value / data.target_value) * 100)
                    ),
                };

                setGoals((prev) => [goalWithProgress, ...prev]);
                setActiveGoals((prev) => [goalWithProgress, ...prev]);

                return goalWithProgress;
            } catch (e: any) {
                console.error('Error creating goal:', e);
                throw e;
            }
        },
        [user?.id]
    );

    // Atualiza progresso da meta
    const updateProgress = useCallback(
        async (goalId: string, newValue: number) => {
            try {
                const goal = goals.find((g) => g.id === goalId);
                if (!goal) throw new Error('Meta não encontrada');

                const progress_percentage = Math.min(
                    100,
                    Math.round((newValue / goal.target_value) * 100)
                );
                const isComplete = progress_percentage >= 100;

                const { data, error: updateError } = await supabase
                    .from('goals')
                    .update({
                        current_value: newValue,
                        status: isComplete ? 'completed' : 'active',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', goalId)
                    .select()
                    .single();

                if (updateError) throw updateError;

                const updatedGoal = { ...data, progress_percentage };

                setGoals((prev) =>
                    prev.map((g) => (g.id === goalId ? updatedGoal : g))
                );

                if (isComplete) {
                    setActiveGoals((prev) => prev.filter((g) => g.id !== goalId));
                    setCompletedGoals((prev) => [updatedGoal, ...prev]);
                } else {
                    setActiveGoals((prev) =>
                        prev.map((g) => (g.id === goalId ? updatedGoal : g))
                    );
                }

                return updatedGoal;
            } catch (e: any) {
                console.error('Error updating goal progress:', e);
                throw e;
            }
        },
        [goals]
    );

    // Cancela uma meta
    const cancelGoal = useCallback(async (goalId: string) => {
        try {
            const { error: updateError } = await supabase
                .from('goals')
                .update({ status: 'cancelled' })
                .eq('id', goalId);

            if (updateError) throw updateError;

            setGoals((prev) =>
                prev.map((g) => (g.id === goalId ? { ...g, status: 'cancelled' } : g))
            );
            setActiveGoals((prev) => prev.filter((g) => g.id !== goalId));
        } catch (e: any) {
            console.error('Error cancelling goal:', e);
            throw e;
        }
    }, []);

    // Deleta uma meta
    const deleteGoal = useCallback(async (goalId: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('goals')
                .delete()
                .eq('id', goalId);

            if (deleteError) throw deleteError;

            setGoals((prev) => prev.filter((g) => g.id !== goalId));
            setActiveGoals((prev) => prev.filter((g) => g.id !== goalId));
            setCompletedGoals((prev) => prev.filter((g) => g.id !== goalId));
        } catch (e: any) {
            console.error('Error deleting goal:', e);
            throw e;
        }
    }, []);

    return {
        goals,
        activeGoals,
        completedGoals,
        loading,
        error,
        createGoal,
        updateProgress,
        cancelGoal,
        deleteGoal,
    };
}

export default useGoals;

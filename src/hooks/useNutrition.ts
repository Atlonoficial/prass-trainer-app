// src/hooks/useNutrition.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface MealPlan {
    id: string;
    student_id: string;
    teacher_id?: string;
    name: string;
    description?: string;
    total_calories?: number;
    total_protein?: number;
    total_carbs?: number;
    total_fat?: number;
    meals_data?: any;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

export interface MealLog {
    id: string;
    student_id: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    description: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    photo_url?: string;
    logged_at: string;
    created_at: string;
}

export interface DailyNutrition {
    date: string;
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    mealsLogged: number;
}

export function useNutrition() {
    const { user } = useAuth();
    const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
    const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
    const [todayNutrition, setTodayNutrition] = useState<DailyNutrition | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Busca dados de nutrição
    useEffect(() => {
        if (!user?.id) {
            setMealPlans([]);
            setMealLogs([]);
            setLoading(false);
            return;
        }

        const fetchNutrition = async () => {
            setLoading(true);
            try {
                // Busca student_id
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (!studentData?.id) {
                    setLoading(false);
                    return;
                }

                // Busca planos alimentares
                const { data: plans } = await supabase
                    .from('meal_plans')
                    .select('*')
                    .eq('student_id', studentData.id)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                setMealPlans(plans || []);

                // Busca logs de hoje
                const today = new Date().toISOString().split('T')[0];
                const { data: logs } = await supabase
                    .from('meal_logs')
                    .select('*')
                    .eq('student_id', studentData.id)
                    .gte('logged_at', `${today}T00:00:00`)
                    .lte('logged_at', `${today}T23:59:59`)
                    .order('logged_at', { ascending: false });

                setMealLogs(logs || []);

                // Calcula nutrição de hoje
                const totals = (logs || []).reduce(
                    (acc, log) => ({
                        totalCalories: acc.totalCalories + (log.calories || 0),
                        totalProtein: acc.totalProtein + (log.protein || 0),
                        totalCarbs: acc.totalCarbs + (log.carbs || 0),
                        totalFat: acc.totalFat + (log.fat || 0),
                    }),
                    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
                );

                setTodayNutrition({
                    date: today,
                    ...totals,
                    mealsLogged: (logs || []).length,
                });
            } catch (e: any) {
                console.error('Error fetching nutrition:', e);
                setError(e?.message || 'Erro ao carregar dados de nutrição');
            } finally {
                setLoading(false);
            }
        };

        fetchNutrition();
    }, [user?.id]);

    // Registra uma refeição
    const logMeal = useCallback(
        async (mealData: Omit<MealLog, 'id' | 'student_id' | 'created_at'>) => {
            if (!user?.id) throw new Error('User not authenticated');
            try {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (!studentData) throw new Error('Student not found');

                const { data, error: insertError } = await supabase
                    .from('meal_logs')
                    .insert({ student_id: studentData.id, ...mealData })
                    .select()
                    .single();

                if (insertError) throw insertError;

                setMealLogs((prev) => [data, ...prev]);
                return data;
            } catch (e: any) {
                console.error('Error logging meal:', e);
                throw e;
            }
        },
        [user?.id]
    );

    const currentPlan = mealPlans.length > 0 ? mealPlans[0] : null;

    return {
        mealPlans,
        currentPlan,
        mealLogs,
        todayNutrition,
        loading,
        error,
        logMeal,
    };
}

export default useNutrition;

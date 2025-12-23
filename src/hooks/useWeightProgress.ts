// src/hooks/useWeightProgress.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface WeightEntry {
    id: string;
    student_id: string;
    weight: number;
    date: string;
    notes?: string;
    photo_url?: string;
    created_at: string;
}

export interface ProgressPhoto {
    id: string;
    student_id: string;
    photo_url: string;
    photo_type: 'front' | 'side' | 'back';
    date: string;
    notes?: string;
    created_at: string;
}

export interface WeightStats {
    currentWeight: number | null;
    initialWeight: number | null;
    goalWeight: number | null;
    totalChange: number;
    lastWeekChange: number;
    trend: 'up' | 'down' | 'stable';
}

export function useWeightProgress() {
    const { user } = useAuth();
    const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
    const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
    const [stats, setStats] = useState<WeightStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) {
            setWeightHistory([]);
            setProgressPhotos([]);
            setLoading(false);
            return;
        }

        const fetchProgress = async () => {
            setLoading(true);
            try {
                // Busca student_id
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id, current_weight, goal_weight')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (!studentData?.id) {
                    setLoading(false);
                    return;
                }

                // Busca histórico de peso
                const { data: weights } = await supabase
                    .from('weight_entries')
                    .select('*')
                    .eq('student_id', studentData.id)
                    .order('date', { ascending: false })
                    .limit(30);

                setWeightHistory(weights || []);

                // Busca fotos de progresso
                const { data: photos } = await supabase
                    .from('progress_photos')
                    .select('*')
                    .eq('student_id', studentData.id)
                    .order('date', { ascending: false })
                    .limit(20);

                setProgressPhotos(photos || []);

                // Calcula estatísticas
                if (weights && weights.length > 0) {
                    const currentWeight = weights[0].weight;
                    const initialWeight = weights[weights.length - 1].weight;
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    const lastWeekEntry = weights.find(
                        (w) => new Date(w.date) <= oneWeekAgo
                    );
                    const lastWeekChange = lastWeekEntry
                        ? currentWeight - lastWeekEntry.weight
                        : 0;

                    setStats({
                        currentWeight,
                        initialWeight,
                        goalWeight: studentData.goal_weight,
                        totalChange: currentWeight - initialWeight,
                        lastWeekChange,
                        trend:
                            lastWeekChange > 0.5
                                ? 'up'
                                : lastWeekChange < -0.5
                                    ? 'down'
                                    : 'stable',
                    });
                }
            } catch (e: any) {
                console.error('Error fetching progress:', e);
                setError(e?.message || 'Erro ao carregar progresso');
            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, [user?.id]);

    // Adiciona entrada de peso
    const addWeightEntry = useCallback(
        async (weight: number, date?: string, notes?: string) => {
            if (!user?.id) throw new Error('User not authenticated');
            try {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (!studentData) throw new Error('Student not found');

                const { data, error: insertError } = await supabase
                    .from('weight_entries')
                    .insert({
                        student_id: studentData.id,
                        weight,
                        date: date || new Date().toISOString().split('T')[0],
                        notes,
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                // Atualiza peso atual no perfil
                if (studentData?.id) {
                    await supabase
                        .from('students')
                        .update({ current_weight: weight })
                        .eq('id', studentData.id);
                }

                setWeightHistory((prev) => [data, ...prev]);
                return data;
            } catch (e: any) {
                console.error('Error adding weight entry:', e);
                throw e;
            }
        },
        [user?.id]
    );

    // Adiciona foto de progresso
    const addProgressPhoto = useCallback(
        async (photoUrl: string, photoType: 'front' | 'side' | 'back', notes?: string) => {
            if (!user?.id) throw new Error('User not authenticated');
            try {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (!studentData) throw new Error('Student not found');

                const { data, error: insertError } = await supabase
                    .from('progress_photos')
                    .insert({
                        student_id: studentData.id,
                        photo_url: photoUrl,
                        photo_type: photoType,
                        date: new Date().toISOString().split('T')[0],
                        notes,
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                setProgressPhotos((prev) => [data, ...prev]);
                return data;
            } catch (e: any) {
                console.error('Error adding progress photo:', e);
                throw e;
            }
        },
        [user?.id]
    );

    return {
        weightHistory,
        progressPhotos,
        stats,
        loading,
        error,
        addWeightEntry,
        addProgressPhoto,
    };
}

export default useWeightProgress;

// src/hooks/useAnamnese.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Anamnese {
    id: string;
    student_id: string;
    // Informações Pessoais
    birth_date?: string;
    gender?: string;
    height?: number;
    weight?: number;
    occupation?: string;
    // Histórico Médico
    medical_conditions?: string[];
    medications?: string[];
    surgeries?: string[];
    allergies?: string[];
    injuries?: string[];
    // Hábitos
    sleep_hours?: number;
    smoking?: boolean;
    alcohol?: boolean;
    exercise_frequency?: string;
    stress_level?: number;
    // Objetivos
    main_goals?: string[];
    target_weight?: number;
    availability_days?: string[];
    preferred_workout_time?: string;
    // Alimentação
    dietary_restrictions?: string[];
    meals_per_day?: number;
    water_intake?: number;
    // Outros
    notes?: string;
    completed?: boolean;
    created_at: string;
    updated_at: string;
}

export function useAnamnese() {
    const { user } = useAuth();
    const [anamnese, setAnamnese] = useState<Anamnese | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) {
            setAnamnese(null);
            setLoading(false);
            return;
        }

        const fetchAnamnese = async () => {
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

                // Busca anamnese existente
                const { data, error: fetchError } = await supabase
                    .from('anamneses')
                    .select('*')
                    .eq('student_id', studentData.id)
                    .maybeSingle();

                if (fetchError) throw fetchError;
                setAnamnese(data);
            } catch (e: any) {
                console.error('Error fetching anamnese:', e);
                setError(e?.message || 'Erro ao carregar anamnese');
            } finally {
                setLoading(false);
            }
        };

        fetchAnamnese();
    }, [user?.id]);

    // Salva ou atualiza a anamnese
    const saveAnamnese = useCallback(
        async (data: Partial<Anamnese>) => {
            if (!user?.id) throw new Error('User not authenticated');
            setSaving(true);
            setError(null);

            try {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (!studentData) throw new Error('Student not found');

                if (anamnese?.id) {
                    // Atualiza existente
                    const { data: updated, error: updateError } = await supabase
                        .from('anamneses')
                        .update({ ...data, updated_at: new Date().toISOString() })
                        .eq('id', anamnese.id)
                        .select()
                        .single();

                    if (updateError) throw updateError;
                    setAnamnese(updated);
                    return updated;
                } else {
                    // Cria nova
                    const { data: created, error: insertError } = await supabase
                        .from('anamneses')
                        .insert({
                            student_id: studentData.id,
                            ...data,
                            completed: false,
                        })
                        .select()
                        .single();

                    if (insertError) throw insertError;
                    setAnamnese(created);
                    return created;
                }
            } catch (e: any) {
                console.error('Error saving anamnese:', e);
                setError(e?.message || 'Erro ao salvar anamnese');
                throw e;
            } finally {
                setSaving(false);
            }
        },
        [user?.id, anamnese?.id]
    );

    // Marca como completa
    const markAsComplete = useCallback(async () => {
        if (!anamnese?.id) return;
        return saveAnamnese({ completed: true });
    }, [anamnese?.id, saveAnamnese]);

    return {
        anamnese,
        loading,
        saving,
        error,
        saveAnamnese,
        markAsComplete,
        isComplete: anamnese?.completed ?? false,
    };
}

export default useAnamnese;

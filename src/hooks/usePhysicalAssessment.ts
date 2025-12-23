// src/hooks/usePhysicalAssessment.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface PhysicalAssessment {
    id: string;
    student_id: string;
    assessment_date: string;
    // Medidas corporais
    weight: number;
    height?: number;
    body_fat_percentage?: number;
    muscle_mass?: number;
    // Circunferências (cm)
    chest?: number;
    waist?: number;
    hip?: number;
    left_arm?: number;
    right_arm?: number;
    left_thigh?: number;
    right_thigh?: number;
    left_calf?: number;
    right_calf?: number;
    // Dobras cutâneas (mm)
    triceps_fold?: number;
    biceps_fold?: number;
    subscapular_fold?: number;
    suprailiac_fold?: number;
    abdominal_fold?: number;
    thigh_fold?: number;
    calf_fold?: number;
    // Calculados
    bmi?: number;
    lean_mass?: number;
    fat_mass?: number;
    // Observações
    notes?: string;
    evaluated_by?: string;
    created_at: string;
}

export function usePhysicalAssessment() {
    const { user } = useAuth();
    const [assessments, setAssessments] = useState<PhysicalAssessment[]>([]);
    const [latestAssessment, setLatestAssessment] = useState<PhysicalAssessment | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) {
            setAssessments([]);
            setLoading(false);
            return;
        }

        const fetchAssessments = async () => {
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
                    .from('physical_assessments')
                    .select('*')
                    .eq('student_id', studentData.id)
                    .order('assessment_date', { ascending: false });

                if (fetchError) throw fetchError;

                setAssessments(data || []);
                setLatestAssessment(data?.[0] || null);
            } catch (e: any) {
                console.error('Error fetching assessments:', e);
                setError(e?.message || 'Erro ao carregar avaliações');
            } finally {
                setLoading(false);
            }
        };

        fetchAssessments();
    }, [user?.id]);

    // Calcula IMC
    const calculateBMI = (weight: number, height: number): number => {
        const heightInMeters = height / 100;
        return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
    };

    // Salva nova avaliação
    const saveAssessment = useCallback(
        async (data: Omit<PhysicalAssessment, 'id' | 'student_id' | 'created_at' | 'bmi' | 'lean_mass' | 'fat_mass'>) => {
            if (!user?.id) throw new Error('User not authenticated');
            setSaving(true);

            try {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (!studentData) throw new Error('Student not found');

                // Calcula valores derivados
                const bmi = data.height ? calculateBMI(data.weight, data.height) : undefined;
                const fat_mass = data.body_fat_percentage
                    ? Number((data.weight * (data.body_fat_percentage / 100)).toFixed(1))
                    : undefined;
                const lean_mass = fat_mass !== undefined
                    ? Number((data.weight - fat_mass).toFixed(1))
                    : undefined;

                const { data: created, error: insertError } = await supabase
                    .from('physical_assessments')
                    .insert({
                        student_id: studentData.id,
                        ...data,
                        bmi,
                        fat_mass,
                        lean_mass,
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                setAssessments((prev) => [created, ...prev]);
                setLatestAssessment(created);

                return created;
            } catch (e: any) {
                console.error('Error saving assessment:', e);
                throw e;
            } finally {
                setSaving(false);
            }
        },
        [user?.id]
    );

    // Compara duas avaliações
    const compareAssessments = useCallback(
        (assessmentId1: string, assessmentId2: string) => {
            const a1 = assessments.find((a) => a.id === assessmentId1);
            const a2 = assessments.find((a) => a.id === assessmentId2);

            if (!a1 || !a2) return null;

            return {
                weight: Number((a2.weight - a1.weight).toFixed(1)),
                body_fat_percentage: a1.body_fat_percentage && a2.body_fat_percentage
                    ? Number((a2.body_fat_percentage - a1.body_fat_percentage).toFixed(1))
                    : null,
                muscle_mass: a1.muscle_mass && a2.muscle_mass
                    ? Number((a2.muscle_mass - a1.muscle_mass).toFixed(1))
                    : null,
                waist: a1.waist && a2.waist
                    ? Number((a2.waist - a1.waist).toFixed(1))
                    : null,
                bmi: a1.bmi && a2.bmi
                    ? Number((a2.bmi - a1.bmi).toFixed(1))
                    : null,
            };
        },
        [assessments]
    );

    // Progresso desde a primeira avaliação
    const getOverallProgress = useCallback(() => {
        if (assessments.length < 2) return null;

        const first = assessments[assessments.length - 1];
        const latest = assessments[0];

        return {
            weightChange: Number((latest.weight - first.weight).toFixed(1)),
            bodyFatChange: first.body_fat_percentage && latest.body_fat_percentage
                ? Number((latest.body_fat_percentage - first.body_fat_percentage).toFixed(1))
                : null,
            muscleMassChange: first.muscle_mass && latest.muscle_mass
                ? Number((latest.muscle_mass - first.muscle_mass).toFixed(1))
                : null,
            periodDays: Math.floor(
                (new Date(latest.assessment_date).getTime() - new Date(first.assessment_date).getTime()) /
                (1000 * 60 * 60 * 24)
            ),
        };
    }, [assessments]);

    return {
        assessments,
        latestAssessment,
        loading,
        saving,
        error,
        saveAssessment,
        compareAssessments,
        getOverallProgress,
    };
}

export default usePhysicalAssessment;

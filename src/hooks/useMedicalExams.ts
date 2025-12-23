// src/hooks/useMedicalExams.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface MedicalExam {
    id: string;
    student_id: string;
    exam_type: string;
    exam_name: string;
    exam_date: string;
    result?: string;
    notes?: string;
    file_url?: string;
    status: 'pending' | 'normal' | 'attention' | 'critical';
    created_at: string;
    updated_at: string;
}

const EXAM_TYPES = [
    { value: 'blood', label: 'Exame de Sangue' },
    { value: 'cardiac', label: 'Avaliação Cardíaca' },
    { value: 'hormonal', label: 'Hormonal' },
    { value: 'imaging', label: 'Exame de Imagem' },
    { value: 'physical', label: 'Avaliação Física' },
    { value: 'other', label: 'Outro' },
];

export function useMedicalExams() {
    const { user } = useAuth();
    const [exams, setExams] = useState<MedicalExam[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) {
            setExams([]);
            setLoading(false);
            return;
        }

        const fetchExams = async () => {
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
                    .from('medical_exams')
                    .select('*')
                    .eq('student_id', studentData.id)
                    .order('exam_date', { ascending: false });

                if (fetchError) throw fetchError;
                setExams(data || []);
            } catch (e: any) {
                console.error('Error fetching medical exams:', e);
                setError(e?.message || 'Erro ao carregar exames');
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, [user?.id]);

    // Adiciona novo exame
    const addExam = useCallback(
        async (examData: Omit<MedicalExam, 'id' | 'student_id' | 'created_at' | 'updated_at'>) => {
            if (!user?.id) throw new Error('User not authenticated');
            setSaving(true);

            try {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (!studentData) throw new Error('Student not found');

                const { data, error: insertError } = await supabase
                    .from('medical_exams')
                    .insert({
                        student_id: studentData.id,
                        ...examData,
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                setExams((prev) => [data, ...prev]);
                return data;
            } catch (e: any) {
                console.error('Error adding exam:', e);
                throw e;
            } finally {
                setSaving(false);
            }
        },
        [user?.id]
    );

    // Atualiza exame
    const updateExam = useCallback(
        async (examId: string, updates: Partial<MedicalExam>) => {
            setSaving(true);

            try {
                const { data, error: updateError } = await supabase
                    .from('medical_exams')
                    .update({
                        ...updates,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', examId)
                    .select()
                    .single();

                if (updateError) throw updateError;

                setExams((prev) =>
                    prev.map((exam) => (exam.id === examId ? data : exam))
                );
                return data;
            } catch (e: any) {
                console.error('Error updating exam:', e);
                throw e;
            } finally {
                setSaving(false);
            }
        },
        []
    );

    // Deleta exame
    const deleteExam = useCallback(async (examId: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('medical_exams')
                .delete()
                .eq('id', examId);

            if (deleteError) throw deleteError;

            setExams((prev) => prev.filter((exam) => exam.id !== examId));
        } catch (e: any) {
            console.error('Error deleting exam:', e);
            throw e;
        }
    }, []);

    // Agrupa exames por tipo
    const examsByType = exams.reduce((acc, exam) => {
        if (!acc[exam.exam_type]) acc[exam.exam_type] = [];
        acc[exam.exam_type].push(exam);
        return acc;
    }, {} as Record<string, MedicalExam[]>);

    // Exames que requerem atenção
    const attentionExams = exams.filter(
        (exam) => exam.status === 'attention' || exam.status === 'critical'
    );

    return {
        exams,
        examsByType,
        attentionExams,
        examTypes: EXAM_TYPES,
        loading,
        saving,
        error,
        addExam,
        updateExam,
        deleteExam,
    };
}

export default useMedicalExams;

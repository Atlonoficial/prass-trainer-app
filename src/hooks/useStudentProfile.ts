// src/hooks/useStudentProfile.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Student {
    id: string;
    user_id: string;
    teacher_id?: string;
    full_name?: string;
    phone?: string;
    avatar_url?: string;
    birth_date?: string;
    gender?: string;
    height?: number;
    current_weight?: number;
    goal_weight?: number;
    fitness_goal?: string;
    experience_level?: string;
    health_conditions?: string[];
    membership_status?: 'active' | 'inactive' | 'pending';
    created_at: string;
    updated_at: string;
}

export function useStudentProfile() {
    const { user } = useAuth();
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) {
            setStudent(null);
            setLoading(false);
            return;
        }

        const fetchStudentProfile = async () => {
            setLoading(true);
            try {
                const { data, error: fetchError } = await supabase
                    .from('students')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (fetchError) throw fetchError;
                setStudent(data);
            } catch (e: any) {
                console.error('Error fetching student profile:', e);
                setError(e?.message || 'Erro ao carregar perfil');
            } finally {
                setLoading(false);
            }
        };

        fetchStudentProfile();

        // Realtime subscription
        const channel = supabase
            .channel('student-profile')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'students',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                        setStudent(payload.new as Student);
                    } else if (payload.eventType === 'DELETE') {
                        setStudent(null);
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);

    const createStudentProfile = useCallback(
        async (profileData: Partial<Student>) => {
            if (!user?.id) throw new Error('User not authenticated');
            setError(null);
            try {
                const { data, error: insertError } = await supabase
                    .from('students')
                    .insert({ user_id: user.id, ...profileData })
                    .select()
                    .single();

                if (insertError) throw insertError;
                setStudent(data);
                return data.id;
            } catch (e: any) {
                console.error('Error creating student profile:', e);
                setError(e?.message || 'Erro ao criar perfil');
                throw e;
            }
        },
        [user?.id]
    );

    const updateProfile = useCallback(
        async (updates: Partial<Student>) => {
            if (!student?.id) throw new Error('Student profile not loaded');
            setError(null);
            try {
                const { error: updateError } = await supabase
                    .from('students')
                    .update(updates)
                    .eq('id', student.id);

                if (updateError) throw updateError;
            } catch (e: any) {
                console.error('Error updating profile:', e);
                setError(e?.message || 'Erro ao atualizar perfil');
                throw e;
            }
        },
        [student?.id]
    );

    return {
        student,
        loading,
        error,
        createStudentProfile,
        updateProfile,
        isActive: student?.membership_status === 'active',
        hasTeacher: !!student?.teacher_id,
    };
}

export default useStudentProfile;

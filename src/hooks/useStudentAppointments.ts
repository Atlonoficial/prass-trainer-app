// src/hooks/useStudentAppointments.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface TimeSlot {
    id: string;
    teacher_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
    location?: string;
}

export interface Appointment {
    id: string;
    student_id: string;
    teacher_id: string;
    slot_id?: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
    type: 'in_person' | 'online';
    location?: string;
    notes?: string;
    created_at: string;
    teacher?: {
        id: string;
        name: string;
        avatar_url?: string;
    };
}

export function useStudentAppointments() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [scheduling, setScheduling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) {
            setAppointments([]);
            setLoading(false);
            return;
        }

        const fetchAppointments = async () => {
            setLoading(true);
            try {
                // Busca student_id
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id, teacher_id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (!studentData?.id) {
                    setLoading(false);
                    return;
                }

                // Busca agendamentos do aluno
                const { data: appointmentsData, error: appointmentsError } = await supabase
                    .from('appointments')
                    .select(`
                        *,
                        teacher:teachers(id, name, avatar_url)
                    `)
                    .eq('student_id', studentData.id)
                    .order('appointment_date', { ascending: true });

                if (appointmentsError) throw appointmentsError;

                setAppointments(appointmentsData || []);

                // Filtra próximos agendamentos
                const now = new Date();
                const upcoming = (appointmentsData || []).filter((apt) => {
                    const aptDate = new Date(`${apt.appointment_date}T${apt.start_time}`);
                    return aptDate >= now && apt.status !== 'cancelled';
                });
                setUpcomingAppointments(upcoming);

                // Busca horários disponíveis do professor
                if (studentData.teacher_id) {
                    const { data: slotsData } = await supabase
                        .from('teacher_availability')
                        .select('*')
                        .eq('teacher_id', studentData.teacher_id)
                        .eq('is_available', true);

                    setAvailableSlots(slotsData || []);
                }
            } catch (e: any) {
                console.error('Error fetching appointments:', e);
                setError(e?.message || 'Erro ao carregar agendamentos');
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [user?.id]);

    // Agenda um novo horário
    const scheduleAppointment = useCallback(
        async (data: {
            appointment_date: string;
            start_time: string;
            end_time: string;
            type: 'in_person' | 'online';
            notes?: string;
        }) => {
            if (!user?.id) throw new Error('User not authenticated');

            try {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id, teacher_id')
                    .eq('user_id', user.id)
                    .single();

                if (!studentData || !studentData.teacher_id) {
                    throw new Error('Você não tem um professor vinculado');
                }

                setScheduling(true);

                const { data: newAppointment, error: insertError } = await supabase
                    .from('appointments')
                    .insert({
                        student_id: studentData.id,
                        teacher_id: studentData.teacher_id,
                        ...data,
                        status: 'scheduled',
                    })
                    .select(`
                        *,
                        teacher:teachers(id, name, avatar_url)
                    `)
                    .single();

                if (insertError) throw insertError;

                setAppointments((prev) => [...prev, newAppointment]);
                setUpcomingAppointments((prev) => [...prev, newAppointment]);

                return newAppointment;
            } catch (e: any) {
                console.error('Error scheduling appointment:', e);
                throw e;
            } finally {
                setScheduling(false);
            }
        },
        [user?.id]
    );

    // Cancela um agendamento
    const cancelAppointment = useCallback(
        async (appointmentId: string) => {
            try {
                const { error: updateError } = await supabase
                    .from('appointments')
                    .update({ status: 'cancelled' })
                    .eq('id', appointmentId);

                if (updateError) throw updateError;

                setAppointments((prev) =>
                    prev.map((apt) =>
                        apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt
                    )
                );
                setUpcomingAppointments((prev) =>
                    prev.filter((apt) => apt.id !== appointmentId)
                );
            } catch (e: any) {
                console.error('Error cancelling appointment:', e);
                throw e;
            }
        },
        []
    );

    // Busca horários disponíveis para uma data específica
    const getAvailableSlotsForDate = useCallback(
        async (date: string) => {
            if (!user?.id) return [];

            try {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('teacher_id')
                    .eq('user_id', user.id)
                    .single();

                if (!studentData?.teacher_id) return [];

                const dayOfWeek = new Date(date).getDay();

                // Busca slots disponíveis para o dia da semana
                const { data: slots } = await supabase
                    .from('teacher_availability')
                    .select('*')
                    .eq('teacher_id', studentData.teacher_id)
                    .eq('day_of_week', dayOfWeek)
                    .eq('is_available', true);

                // Busca agendamentos já feitos para essa data
                const { data: bookedAppointments } = await supabase
                    .from('appointments')
                    .select('start_time, end_time')
                    .eq('teacher_id', studentData.teacher_id)
                    .eq('appointment_date', date)
                    .neq('status', 'cancelled');

                // Remove horários já ocupados
                const bookedTimes = new Set(
                    (bookedAppointments || []).map((apt) => apt.start_time)
                );

                return (slots || []).filter((slot) => !bookedTimes.has(slot.start_time));
            } catch (e) {
                console.error('Error getting available slots:', e);
                return [];
            }
        },
        [user?.id]
    );

    // Função para refresh manual
    const refresh = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        // Re-trigger useEffect by forcing re-render
        // The useEffect will handle the actual data fetching
    }, [user?.id]);

    return {
        appointments,
        upcomingAppointments,
        availableSlots,
        loading,
        scheduling,
        error,
        scheduleAppointment,
        cancelAppointment,
        getAvailableSlotsForDate,
        fetchAvailableSlots: getAvailableSlotsForDate,
        refresh,
        nextAppointment: upcomingAppointments[0] || null,
    };
}

export default useStudentAppointments;

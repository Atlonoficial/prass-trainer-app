// src/hooks/useCourses.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail?: string;
    instructor?: string;
    modules?: any;
    enrolled_users?: string[];
    is_published?: boolean;
    duration?: number;
    category?: string;
    price?: number;
    created_at: string;
    updated_at: string;
}

export function useCourses() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) {
            setCourses([]);
            setLoading(false);
            return;
        }

        const fetchCourses = async () => {
            setLoading(true);
            try {
                // Busca o professor do aluno
                const { data: studentData } = await supabase
                    .from('students')
                    .select('teacher_id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                // Query simplificada de cursos - busca todos os cursos publicados
                // A estrutura da tabela pode variar, então fazemos uma query básica
                const { data, error: fetchError } = await supabase
                    .from('courses')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (fetchError) {
                    // Se houver erro de tabela/coluna inexistente, retorna lista vazia
                    console.log('Courses table may not exist or has different structure:', fetchError.message);
                    setCourses([]);
                    return;
                }

                // Filtra cursos baseado no professor do aluno ou cursos sem instrutor (públicos)
                const filteredCourses = (data || []).filter((course: any) => {
                    // Cursos do professor do aluno
                    if (studentData?.teacher_id && course.instructor === studentData.teacher_id) {
                        return true;
                    }
                    // Cursos sem instrutor (públicos/gerais)
                    if (!course.instructor) {
                        return true;
                    }
                    // Usuário está inscrito
                    if (course.enrolled_users?.includes(user.id)) {
                        return true;
                    }
                    return false;
                });

                setCourses(filteredCourses);
            } catch (e: any) {
                console.error('Error fetching courses:', e);
                setError(e?.message || 'Erro ao carregar cursos');
                setCourses([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [user?.id]);

    // Verifica se usuário tem acesso ao curso
    const hasAccess = (course: Course): boolean => {
        // Cursos sem preço ou gratuitos
        if (!course.price || course.price === 0) return true;
        // Usuário está inscrito
        if (course.enrolled_users?.includes(user?.id || '')) return true;
        return false;
    };

    return {
        courses,
        loading,
        error,
        hasAccess,
    };
}

export default useCourses;

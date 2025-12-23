// src/hooks/useGamification.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    points: number;
    requirement_type: string;
    requirement_value: number;
}

export interface UserAchievement {
    id: string;
    student_id: string;
    achievement_id: string;
    unlocked_at: string;
    achievement?: Achievement;
}

export interface Streak {
    current: number;
    longest: number;
    lastActivityDate: string | null;
}

export interface GamificationStats {
    totalPoints: number;
    level: number;
    nextLevelPoints: number;
    currentStreak: number;
    longestStreak: number;
    achievementsUnlocked: number;
    totalAchievements: number;
    rank: number;
}

export function useGamification() {
    const { user } = useAuth();
    const [stats, setStats] = useState<GamificationStats | null>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
    const [streak, setStreak] = useState<Streak>({ current: 0, longest: 0, lastActivityDate: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Calcula nível baseado nos pontos
    const calculateLevel = (points: number): { level: number; nextLevelPoints: number } => {
        const basePoints = 100;
        const multiplier = 1.5;
        let level = 1;
        let totalRequired = basePoints;

        while (points >= totalRequired) {
            level++;
            totalRequired += Math.floor(basePoints * Math.pow(multiplier, level - 1));
        }

        return {
            level,
            nextLevelPoints: totalRequired - points,
        };
    };

    useEffect(() => {
        if (!user?.id) {
            setStats(null);
            setAchievements([]);
            setLoading(false);
            return;
        }

        const fetchGamification = async () => {
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

                // Busca pontos do aluno
                const { data: pointsData } = await supabase
                    .from('gamification_points')
                    .select('points')
                    .eq('student_id', studentData.id);

                const totalPoints = (pointsData || []).reduce((sum, p) => sum + p.points, 0);
                const { level, nextLevelPoints } = calculateLevel(totalPoints);

                // Busca conquistas disponíveis
                const { data: allAchievements } = await supabase
                    .from('achievements')
                    .select('*')
                    .eq('is_active', true);

                setAchievements(allAchievements || []);

                // Busca conquistas desbloqueadas
                const { data: unlocked } = await supabase
                    .from('user_achievements')
                    .select('*, achievement:achievements(*)')
                    .eq('student_id', studentData.id);

                setUserAchievements(unlocked || []);

                // Busca streak
                const { data: streakData } = await supabase
                    .from('streaks')
                    .select('*')
                    .eq('student_id', studentData.id)
                    .maybeSingle();

                if (streakData) {
                    setStreak({
                        current: streakData.current_streak || 0,
                        longest: streakData.longest_streak || 0,
                        lastActivityDate: streakData.last_activity_date,
                    });
                }

                // Busca ranking
                const { data: rankingData } = await supabase
                    .rpc('get_student_rank', { p_student_id: studentData.id });

                setStats({
                    totalPoints,
                    level,
                    nextLevelPoints,
                    currentStreak: streakData?.current_streak || 0,
                    longestStreak: streakData?.longest_streak || 0,
                    achievementsUnlocked: (unlocked || []).length,
                    totalAchievements: (allAchievements || []).length,
                    rank: rankingData || 1,
                });
            } catch (e: any) {
                console.error('Error fetching gamification:', e);
                setError(e?.message || 'Erro ao carregar gamificação');
            } finally {
                setLoading(false);
            }
        };

        fetchGamification();
    }, [user?.id]);

    // Adiciona pontos
    const addPoints = useCallback(
        async (points: number, reason: string) => {
            if (!user?.id) throw new Error('User not authenticated');
            try {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (!studentData) throw new Error('Student not found');

                await supabase.from('gamification_points').insert({
                    student_id: studentData.id,
                    points,
                    reason,
                });

                // Atualiza stats localmente
                setStats((prev) =>
                    prev
                        ? {
                            ...prev,
                            totalPoints: prev.totalPoints + points,
                            ...calculateLevel(prev.totalPoints + points),
                        }
                        : null
                );
            } catch (e: any) {
                console.error('Error adding points:', e);
                throw e;
            }
        },
        [user?.id]
    );

    // Registra atividade diária (para streak)
    const registerDailyActivity = useCallback(async () => {
        if (!user?.id) return;
        try {
            const { data: studentData } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!studentData) return;

            await supabase.rpc('update_streak', { p_student_id: studentData.id });
        } catch (e: any) {
            console.error('Error registering activity:', e);
        }
    }, [user?.id]);

    return {
        stats,
        achievements,
        userAchievements,
        streak,
        loading,
        error,
        addPoints,
        registerDailyActivity,
        unlockedIds: userAchievements.map((ua) => ua.achievement_id),
    };
}

export default useGamification;

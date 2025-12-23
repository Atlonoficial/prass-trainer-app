// app/metas.tsx - Tela de Metas
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { useWeightProgress } from '@/hooks/useWeightProgress';
import { useGamification } from '@/hooks/useGamification';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Colors from '@/constants/Colors';

export default function MetasScreen() {
    const { student } = useStudentProfile();
    const { stats: weightStats } = useWeightProgress();
    const { stats: gameStats, streak } = useGamification();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    // Metas do usuário
    const goals = [
        {
            id: '1',
            title: 'Meta de Peso',
            icon: 'trending-down',
            color: '#22C55E',
            current: weightStats?.currentWeight || student?.current_weight || 0,
            target: student?.goal_weight || 70,
            unit: 'kg',
            type: 'weight',
        },
        {
            id: '2',
            title: 'Treinos da Semana',
            icon: 'activity',
            color: '#F59E0B',
            current: gameStats?.achievementsUnlocked || 0,
            target: 5,
            unit: 'treinos',
            type: 'training',
        },
        {
            id: '3',
            title: 'Streak Diário',
            icon: 'zap',
            color: '#8B5CF6',
            current: streak?.current || 0,
            target: 30,
            unit: 'dias',
            type: 'streak',
        },
        {
            id: '4',
            title: 'Pontos XP',
            icon: 'star',
            color: '#EC4899',
            current: gameStats?.totalPoints || 0,
            target: 1000,
            unit: 'pontos',
            type: 'points',
        },
    ];

    const calculateProgress = (current: number, target: number, type: string) => {
        if (type === 'weight') {
            // Para peso, calcular diferença do objetivo
            const initial = weightStats?.initialWeight || current;
            const diff = initial - target;
            const progress = (initial - current) / diff;
            return Math.min(Math.max(progress, 0), 1);
        }
        return Math.min(current / target, 1);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Minhas Metas</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Feather name="plus" size={24} color="#F59E0B" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Resumo */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <AnimatedCard style={styles.summaryCard} delay={100}>
                        <View style={styles.summaryHeader}>
                            <View style={styles.summaryIcon}>
                                <Feather name="target" size={28} color="#F59E0B" />
                            </View>
                            <View style={styles.summaryInfo}>
                                <Text style={styles.summaryTitle}>Continue assim!</Text>
                                <Text style={styles.summaryDesc}>
                                    Você está no caminho certo para alcançar seus objetivos.
                                </Text>
                            </View>
                        </View>
                    </AnimatedCard>
                </Animated.View>

                {/* Lista de Metas */}
                <Text style={styles.sectionTitle}>Suas Metas</Text>

                {goals.map((goal, index) => {
                    const progress = calculateProgress(goal.current, goal.target, goal.type);
                    const progressPercent = Math.round(progress * 100);

                    return (
                        <AnimatedCard
                            key={goal.id}
                            style={styles.goalCard}
                            delay={200 + index * 100}
                            onPress={() => { }}
                        >
                            <View style={styles.goalHeader}>
                                <View style={[styles.goalIcon, { backgroundColor: `${goal.color}20` }]}>
                                    <Feather name={goal.icon as any} size={20} color={goal.color} />
                                </View>
                                <View style={styles.goalInfo}>
                                    <Text style={styles.goalTitle}>{goal.title}</Text>
                                    <Text style={styles.goalProgress}>
                                        {goal.current} / {goal.target} {goal.unit}
                                    </Text>
                                </View>
                                <Text style={[styles.goalPercent, { color: goal.color }]}>
                                    {progressPercent}%
                                </Text>
                            </View>

                            {/* Barra de progresso */}
                            <View style={styles.progressBarContainer}>
                                <View style={styles.progressBarBg}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            { width: `${progressPercent}%`, backgroundColor: goal.color }
                                        ]}
                                    />
                                </View>
                            </View>

                            {progressPercent >= 100 && (
                                <View style={styles.completeBadge}>
                                    <Feather name="check-circle" size={14} color="#22C55E" />
                                    <Text style={styles.completeText}>Meta alcançada!</Text>
                                </View>
                            )}
                        </AnimatedCard>
                    );
                })}

                {/* Dica */}
                <AnimatedCard style={styles.tipCard} delay={600}>
                    <View style={styles.tipIcon}>
                        <Feather name="info" size={20} color="#3B82F6" />
                    </View>
                    <View style={styles.tipContent}>
                        <Text style={styles.tipTitle}>Dica</Text>
                        <Text style={styles.tipText}>
                            Defina metas realistas e acompanhe seu progresso diariamente para manter a motivação!
                        </Text>
                    </View>
                </AnimatedCard>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.dark.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
        marginTop: 24,
        marginBottom: 16,
    },
    summaryCard: {
        padding: 20,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryInfo: {
        flex: 1,
        marginLeft: 14,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    summaryDesc: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginTop: 4,
    },
    goalCard: {
        padding: 16,
        marginBottom: 12,
    },
    goalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    goalIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    goalInfo: {
        flex: 1,
        marginLeft: 12,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    goalProgress: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        marginTop: 2,
    },
    goalPercent: {
        fontSize: 18,
        fontWeight: '700',
    },
    progressBarContainer: {
        marginTop: 4,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    completeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    completeText: {
        fontSize: 13,
        color: '#22C55E',
        fontWeight: '500',
    },
    tipCard: {
        flexDirection: 'row',
        padding: 16,
        marginTop: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderLeftWidth: 3,
        borderLeftColor: '#3B82F6',
    },
    tipIcon: {
        marginRight: 12,
    },
    tipContent: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
        marginBottom: 4,
    },
    tipText: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        lineHeight: 18,
    },
});

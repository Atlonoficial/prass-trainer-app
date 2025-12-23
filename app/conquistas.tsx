// app/conquistas.tsx - Tela de Conquistas
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useGamification } from '@/hooks/useGamification';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Colors from '@/constants/Colors';

export default function ConquistasScreen() {
    const { achievements, userAchievements, unlockedIds, stats, loading } = useGamification();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const getAchievementIcon = (category: string) => {
        switch (category) {
            case 'workout': return 'activity';
            case 'nutrition': return 'heart';
            case 'streak': return 'zap';
            case 'social': return 'users';
            default: return 'award';
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Conquistas</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Resumo */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <AnimatedCard style={styles.summaryCard} delay={100}>
                        <View style={styles.summaryIcon}>
                            <Feather name="award" size={32} color="#F59E0B" />
                        </View>
                        <View style={styles.summaryInfo}>
                            <Text style={styles.summaryValue}>
                                {stats?.achievementsUnlocked || 0} / {stats?.totalAchievements || 0}
                            </Text>
                            <Text style={styles.summaryLabel}>Conquistas desbloqueadas</Text>
                        </View>
                    </AnimatedCard>
                </Animated.View>

                {/* Lista de Conquistas */}
                <Text style={styles.sectionTitle}>Todas as Conquistas</Text>

                {achievements.length > 0 ? (
                    achievements.map((achievement, index) => {
                        const isUnlocked = unlockedIds.includes(achievement.id);
                        return (
                            <AnimatedCard
                                key={achievement.id}
                                style={isUnlocked ? styles.achievementCard : [styles.achievementCard, styles.achievementLocked]}
                                delay={200 + index * 50}
                            >
                                <View style={[
                                    styles.achievementIcon,
                                    { backgroundColor: isUnlocked ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)' }
                                ]}>
                                    <Feather
                                        name={getAchievementIcon(achievement.category) as any}
                                        size={24}
                                        color={isUnlocked ? '#F59E0B' : Colors.dark.textSecondary}
                                    />
                                </View>
                                <View style={styles.achievementInfo}>
                                    <Text style={[styles.achievementName, !isUnlocked && styles.textLocked]}>
                                        {achievement.name}
                                    </Text>
                                    <Text style={styles.achievementDesc}>{achievement.description}</Text>
                                    <View style={styles.achievementPoints}>
                                        <Feather name="star" size={12} color="#F59E0B" />
                                        <Text style={styles.pointsText}>{achievement.points} pontos</Text>
                                    </View>
                                </View>
                                {isUnlocked ? (
                                    <Feather name="check-circle" size={24} color="#22C55E" />
                                ) : (
                                    <Feather name="lock" size={20} color={Colors.dark.textSecondary} />
                                )}
                            </AnimatedCard>
                        );
                    })
                ) : (
                    <AnimatedCard style={styles.emptyCard} delay={200}>
                        <Feather name="award" size={48} color={Colors.dark.textSecondary} />
                        <Text style={styles.emptyTitle}>Nenhuma conquista disponível</Text>
                        <Text style={styles.emptyDesc}>
                            Continue treinando para desbloquear conquistas!
                        </Text>
                    </AnimatedCard>
                )}
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
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    summaryIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryInfo: {
        flex: 1,
        marginLeft: 16,
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#F59E0B',
    },
    summaryLabel: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginTop: 4,
    },
    achievementCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 10,
    },
    achievementLocked: {
        opacity: 0.6,
    },
    achievementIcon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    achievementInfo: {
        flex: 1,
        marginLeft: 14,
    },
    achievementName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    textLocked: {
        color: Colors.dark.textSecondary,
    },
    achievementDesc: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        marginTop: 2,
    },
    achievementPoints: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    pointsText: {
        fontSize: 12,
        color: '#F59E0B',
        fontWeight: '500',
    },
    emptyCard: {
        padding: 40,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
        marginTop: 16,
    },
    emptyDesc: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
});

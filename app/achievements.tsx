// app/achievements.tsx - Conquistas e Recompensas (simplificado)
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGamification } from '@/hooks/useGamification';
import { AppHeader } from '@/components/ui/AppHeader';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Colors from '@/constants/Colors';

export default function AchievementsScreen() {
    const {
        stats,
        achievements,
        userAchievements,
        streak,
        loading,
    } = useGamification();

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    // Calcular conquistas desbloqueadas
    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));
    const unlockedAchievements = achievements.filter(a => unlockedIds.has(a.id));
    const lockedAchievements = achievements.filter(a => !unlockedIds.has(a.id));

    // Calcular progresso para próximo nível
    const progressPercent = stats ?
        ((stats.totalPoints - (stats.nextLevelPoints - 100)) / 100) * 100 : 0;
    const pointsToNext = stats ? stats.nextLevelPoints - stats.totalPoints : 0;

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <AppHeader title="Conquistas" showBack />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Carregando conquistas...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader title="Conquistas" showBack />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
            >
                {/* Stats Card */}
                {stats && (
                    <AnimatedCard delay={0}>
                        <View style={styles.statsCard}>
                            <View style={styles.levelSection}>
                                <View style={styles.levelBadge}>
                                    <Text style={styles.levelNumber}>{stats.level}</Text>
                                </View>
                                <View style={styles.levelInfo}>
                                    <Text style={styles.levelTitle}>Nível {stats.level}</Text>
                                    <Text style={styles.pointsText}>{stats.totalPoints} XP</Text>
                                </View>
                            </View>

                            <View style={styles.progressSection}>
                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            { width: `${Math.min(progressPercent, 100)}%` }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.progressText}>
                                    {pointsToNext > 0 ? `${pointsToNext} XP para o próximo nível` : 'Nível máximo!'}
                                </Text>
                            </View>

                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <Ionicons name="flame" size={24} color="#EF4444" />
                                    <Text style={styles.statValue}>{streak.current}</Text>
                                    <Text style={styles.statLabel}>Sequência</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="trophy" size={24} color={Colors.primary} />
                                    <Text style={styles.statValue}>{stats.achievementsUnlocked}</Text>
                                    <Text style={styles.statLabel}>Conquistas</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="star" size={24} color="#3B82F6" />
                                    <Text style={styles.statValue}>{streak.longest}</Text>
                                    <Text style={styles.statLabel}>Maior Seq.</Text>
                                </View>
                            </View>
                        </View>
                    </AnimatedCard>
                )}

                {/* Unlocked Achievements */}
                {unlockedAchievements.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🏆 Desbloqueadas</Text>
                        {unlockedAchievements.map((achievement, index) => {
                            const userAchievement = userAchievements.find(
                                ua => ua.achievement_id === achievement.id
                            );
                            return (
                                <AnimatedCard key={achievement.id} delay={index * 50}>
                                    <View style={styles.achievementCard}>
                                        <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                                        <View style={styles.achievementInfo}>
                                            <Text style={styles.achievementName}>{achievement.name}</Text>
                                            <Text style={styles.achievementDescription}>
                                                {achievement.description}
                                            </Text>
                                            {userAchievement && (
                                                <Text style={styles.achievementDate}>
                                                    Desbloqueada em {new Date(userAchievement.unlocked_at).toLocaleDateString('pt-BR')}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={styles.xpBadge}>
                                            <Text style={styles.xpText}>+{achievement.points} XP</Text>
                                        </View>
                                    </View>
                                </AnimatedCard>
                            );
                        })}
                    </View>
                )}

                {/* Locked Achievements */}
                {lockedAchievements.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🔒 A Conquistar</Text>
                        {lockedAchievements.map((achievement) => (
                            <View key={achievement.id} style={styles.lockedCard}>
                                <View style={styles.lockedIcon}>
                                    <Ionicons name="lock-closed" size={24} color="#444" />
                                </View>
                                <View style={styles.achievementInfo}>
                                    <Text style={styles.lockedName}>{achievement.name}</Text>
                                    <Text style={styles.lockedDescription}>
                                        {achievement.description}
                                    </Text>
                                </View>
                                <View style={styles.xpBadgeLocked}>
                                    <Text style={styles.xpTextLocked}>+{achievement.points}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Empty state */}
                {achievements.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="trophy-outline" size={64} color="#333" />
                        <Text style={styles.emptyTitle}>Nenhuma conquista ainda</Text>
                        <Text style={styles.emptySubtitle}>
                            Continue treinando para desbloquear conquistas!
                        </Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#999',
        marginTop: 12,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    statsCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    levelSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    levelBadge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    levelNumber: {
        color: '#000',
        fontSize: 24,
        fontWeight: '700',
    },
    levelInfo: {
        flex: 1,
    },
    levelTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    pointsText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    progressSection: {
        marginBottom: 20,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#333',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 4,
    },
    progressText: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        marginTop: 8,
    },
    statLabel: {
        color: '#666',
        fontSize: 11,
        marginTop: 2,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    achievementCard: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    achievementIcon: {
        fontSize: 32,
        marginRight: 14,
    },
    achievementInfo: {
        flex: 1,
    },
    achievementName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    achievementDescription: {
        color: '#999',
        fontSize: 12,
        marginTop: 4,
    },
    achievementDate: {
        color: '#666',
        fontSize: 10,
        marginTop: 6,
    },
    xpBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    xpText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '600',
    },
    lockedCard: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        opacity: 0.7,
    },
    lockedIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    lockedName: {
        color: '#888',
        fontSize: 16,
        fontWeight: '600',
    },
    lockedDescription: {
        color: '#555',
        fontSize: 12,
        marginTop: 4,
    },
    xpBadgeLocked: {
        backgroundColor: '#333',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    xpTextLocked: {
        color: '#666',
        fontSize: 12,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtitle: {
        color: '#666',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
});

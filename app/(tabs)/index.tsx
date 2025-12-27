// app/(tabs)/index.tsx - Dashboard com dados reais
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useWeightProgress } from '@/hooks/useWeightProgress';
import { useGamification } from '@/hooks/useGamification';
import { useNotifications } from '@/hooks/useNotifications';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Colors from '@/constants/Colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function DashboardScreen() {
    const { user } = useAuth();
    const { student } = useStudentProfile();
    const { currentWorkout, loading: workoutsLoading } = useWorkouts();
    const { weightHistory, stats: weightStats } = useWeightProgress();
    const { stats: gameStats, streak } = useGamification();
    const { unreadCount } = useNotifications();
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const userName = student?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Aluno';
    const today = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    // Dados reais ou placeholders
    const currentWeight = weightStats?.currentWeight || student?.current_weight;
    const lastWeights = weightHistory.slice(0, 3);
    const totalPoints = gameStats?.totalPoints || 0;
    const currentStreak = streak?.current || 0;
    const trainingsCount = gameStats?.achievementsUnlocked || 0;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header Fixo */}
            <View style={styles.fixedHeader}>
                {/* Espaço vazio para balancear o botão de notificação */}
                <View style={styles.headerSpacer} />

                {/* Logo Centralizada */}
                <Image
                    source={require('../../assets/logo.png')}
                    style={styles.headerLogo}
                    resizeMode="contain"
                />

                {/* Botão de Notificação */}
                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => router.push('/notifications')}
                >
                    <Feather name="bell" size={22} color={Colors.dark.text} />
                    {unreadCount > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.notificationBadgeText}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.dark.tint}
                    />
                }
            >
                {/* Data */}
                <View style={styles.dateContainer}>
                    <Feather name="calendar" size={16} color={Colors.dark.textSecondary} />
                    <Text style={styles.dateText}>{today}</Text>
                </View>

                {/* Saudação */}
                <Animated.View style={[styles.greetingContainer, { opacity: fadeAnim }]}>
                    <View style={styles.avatarGradient}>
                        <Text style={styles.avatarText}>
                            {userName.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.greetingTextContainer}>
                        <Text style={styles.greeting}>
                            Olá, <Text style={styles.greetingName}>{userName}!</Text>
                        </Text>
                    </View>
                </Animated.View>

                <Text style={styles.welcomeText}>Estou aqui para te guiar, vamos começar?</Text>

                {/* Evolução do Peso */}
                <AnimatedCard style={styles.weightCard} delay={100}>
                    <View style={styles.weightHeader}>
                        <View>
                            <Text style={styles.weightTitle}>Evolução do Peso</Text>
                            <Text style={styles.weightSubtitle}>
                                Mês atual - {lastWeights.length} registros
                            </Text>
                        </View>
                        <View style={styles.weightValueContainer}>
                            <Text style={styles.weightValue}>
                                {currentWeight ? `${currentWeight}kg` : '--kg'}
                            </Text>
                            <Text style={styles.weightChange}>
                                {weightStats?.lastWeekChange
                                    ? `${weightStats.lastWeekChange > 0 ? '+' : ''}${weightStats.lastWeekChange.toFixed(1)}kg vs anterior`
                                    : 'Adicione seu peso'}
                            </Text>
                        </View>
                    </View>

                    {/* Gráfico de barras */}
                    <View style={styles.chartContainer}>
                        {lastWeights.length > 0 ? lastWeights.reverse().map((entry, index) => (
                            <View key={entry.id} style={styles.chartBar}>
                                <Text style={styles.chartBarValue}>{entry.weight}kg</Text>
                                <View style={[styles.chartBarFill, { height: `${Math.min(100, (entry.weight / 150) * 100)}%` }]} />
                                <Text style={styles.chartBarLabel}>
                                    {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                </Text>
                            </View>
                        )) : (
                            <>
                                <View style={styles.chartBar}>
                                    <View style={[styles.chartBarFill, { height: '40%' }]} />
                                    <Text style={styles.chartBarLabel}>--</Text>
                                </View>
                                <View style={styles.chartBar}>
                                    <View style={[styles.chartBarFill, { height: '60%' }]} />
                                    <Text style={styles.chartBarLabel}>--</Text>
                                </View>
                                <View style={styles.chartBar}>
                                    <View style={[styles.chartBarFill, { height: '80%' }]} />
                                    <Text style={styles.chartBarLabel}>--</Text>
                                </View>
                            </>
                        )}
                    </View>
                </AnimatedCard>

                {/* Coach IA */}
                <AnimatedCard style={styles.coachCard} delay={200}>
                    <View style={styles.coachHeader}>
                        <View style={styles.coachIconContainer}>
                            <Feather name="zap" size={24} color="#F59E0B" />
                        </View>
                        <View style={styles.coachInfo}>
                            <View style={styles.coachTitleRow}>
                                <Text style={styles.coachTitle}>Coach IA</Text>
                                <View style={styles.onlineBadge}>
                                    <View style={styles.onlineDot} />
                                    <Text style={styles.onlineText}>Online 24/7</Text>
                                </View>
                            </View>
                            <Text style={styles.coachDescription}>
                                Seu assistente pessoal para treinos, dieta e dicas de performance.
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.chatButton}
                        onPress={() => router.push('/(tabs)/chat')}
                    >
                        <Feather name="message-circle" size={18} color="#000" />
                        <Text style={styles.chatButtonText}>Conversar Agora</Text>
                    </TouchableOpacity>
                </AnimatedCard>

                {/* Grid de Ações */}
                <View style={styles.actionsGrid}>
                    <AnimatedCard style={styles.actionCard} delay={300} onPress={() => router.push('/(tabs)/workouts')}>
                        <View style={styles.actionIconContainer}>
                            <Feather name="play" size={24} color={Colors.dark.text} />
                        </View>
                        <Text style={styles.actionTitle}>Iniciar Treino</Text>
                        <Text style={styles.actionSubtitle}>
                            {currentWorkout ? currentWorkout.name : 'Treino do dia'}
                        </Text>
                    </AnimatedCard>

                    <AnimatedCard style={styles.actionCard} delay={350} onPress={() => router.push('/(tabs)/nutrition')}>
                        <View style={styles.actionIconContainer}>
                            <Feather name="heart" size={24} color="#F59E0B" />
                        </View>
                        <Text style={styles.actionTitle}>Registrar Refeição</Text>
                        <Text style={styles.actionSubtitle}>Controle nutricional</Text>
                    </AnimatedCard>

                    <AnimatedCard style={styles.actionCard} delay={400} onPress={() => router.push('/agenda')}>
                        <View style={styles.actionIconContainer}>
                            <Feather name="calendar" size={24} color={Colors.dark.text} />
                        </View>
                        <Text style={styles.actionTitle}>Agenda</Text>
                        <Text style={styles.actionSubtitle}>Próximos treinos</Text>
                    </AnimatedCard>

                    <AnimatedCard style={styles.actionCard} delay={450} onPress={() => router.push('/metas')}>
                        <View style={styles.actionIconContainer}>
                            <Feather name="target" size={24} color="#F59E0B" />
                        </View>
                        <Text style={styles.actionTitle}>Metas</Text>
                        <Text style={styles.actionSubtitle}>Acompanhar progresso</Text>
                    </AnimatedCard>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <AnimatedCard style={styles.statsCard} delay={500}>
                        <View style={styles.statsHeader}>
                            <Text style={styles.statsTitle}>Dias Seguidos</Text>
                            <Feather name="zap" size={18} color="#F59E0B" />
                        </View>
                        <Text style={styles.statsValue}>{currentStreak}</Text>
                        <Text style={styles.statsSubtext}>Streak atual</Text>
                    </AnimatedCard>

                    <AnimatedCard style={styles.statsCard} delay={550}>
                        <View style={styles.statsHeader}>
                            <Text style={styles.statsTitle}>Treinos</Text>
                            <Feather name="check-circle" size={18} color="#F59E0B" />
                        </View>
                        <Text style={styles.statsValue}>{trainingsCount}</Text>
                        <Text style={styles.statsSubtext}>Este mês</Text>
                    </AnimatedCard>
                </View>

                <View style={styles.statsRow}>
                    <AnimatedCard style={styles.statsCard} delay={600}>
                        <View style={styles.statsHeader}>
                            <Text style={styles.statsTitle}>Pontos XP</Text>
                            <Feather name="star" size={18} color="#F59E0B" />
                        </View>
                        <Text style={styles.statsValue}>{totalPoints}</Text>
                        <Text style={styles.statsSubtext}>Nível {gameStats?.level || 1}</Text>
                    </AnimatedCard>

                    <AnimatedCard style={styles.statsCard} delay={650}>
                        <View style={styles.statsHeader}>
                            <Text style={styles.statsTitle}>Ranking</Text>
                            <Feather name="award" size={18} color="#F59E0B" />
                        </View>
                        <Text style={styles.statsValue}>#{gameStats?.rank || 1}</Text>
                        <Text style={[styles.statsSubtext, { color: '#F59E0B' }]}>Posição mensal</Text>
                    </AnimatedCard>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    fixedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: Colors.dark.background,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    headerSpacer: {
        width: 40,
        height: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 32,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    headerLogo: {
        width: 120,
        height: 50,
    },
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.dark.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    dateText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    greetingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
    },
    avatarGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F59E0B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    greetingTextContainer: {
        marginLeft: 12,
    },
    greeting: {
        fontSize: 20,
        color: Colors.dark.text,
    },
    greetingName: {
        color: '#F59E0B',
        fontWeight: 'bold',
    },
    welcomeText: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        marginTop: 8,
        marginBottom: 20,
    },
    weightCard: {
        padding: 20,
        marginBottom: 12,
    },
    weightHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    weightTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    weightSubtitle: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginTop: 2,
    },
    weightValueContainer: {
        alignItems: 'flex-end',
    },
    weightValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#F59E0B',
    },
    weightChange: {
        fontSize: 11,
        color: '#22C55E',
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 80,
        marginTop: 8,
    },
    chartBar: {
        alignItems: 'center',
        width: 60,
        height: '100%',
        justifyContent: 'flex-end',
    },
    chartBarValue: {
        fontSize: 10,
        color: '#F59E0B',
        marginBottom: 4,
    },
    chartBarFill: {
        width: 40,
        backgroundColor: '#F59E0B',
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        marginBottom: 8,
    },
    chartBarLabel: {
        fontSize: 10,
        color: Colors.dark.textSecondary,
    },
    coachCard: {
        padding: 20,
        marginBottom: 16,
    },
    coachHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    coachIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    coachInfo: {
        flex: 1,
        marginLeft: 14,
    },
    coachTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    coachTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    onlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#22C55E',
    },
    onlineText: {
        fontSize: 11,
        color: '#22C55E',
        fontWeight: '500',
    },
    coachDescription: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        marginTop: 4,
        lineHeight: 18,
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F59E0B',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    chatButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    actionCard: {
        width: CARD_WIDTH,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    actionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 2,
    },
    actionSubtitle: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    statsCard: {
        flex: 1,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F59E0B',
        borderLeftWidth: 3,
    },
    statsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statsTitle: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    statsValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    statsSubtext: {
        fontSize: 11,
        color: Colors.dark.textSecondary,
        marginTop: 2,
    },
    notificationBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    notificationBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});

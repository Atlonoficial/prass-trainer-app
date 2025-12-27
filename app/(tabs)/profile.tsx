// app/(tabs)/profile.tsx - Tela de Perfil com dados reais
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { useGamification } from '@/hooks/useGamification';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Colors from '@/constants/Colors';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const { student, loading } = useStudentProfile();
    const { stats: gameStats } = useGamification();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const userName = student?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Aluno';
    const userEmail = user?.email || '';
    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        : 'Membro';

    const handleLogout = async () => {
        console.log('🚪 handleLogout chamado - fazendo logout direto');

        try {
            // Fazer signOut PRIMEIRO
            console.log('🔄 Chamando signOut...');
            await signOut();
            console.log('✅ signOut completado');
        } catch (err) {
            console.error('❌ Erro no signOut:', err);
        }

        // Navegar para login (vai acontecer de qualquer forma)
        console.log('🔀 Navegando para login...');
        router.replace('/(auth)/login');
    };

    const menuItems = [
        { icon: 'user', label: 'Editar Perfil', color: '#3B82F6', onPress: () => router.push('/editar-perfil') },
        { icon: 'message-circle', label: 'Mensagens', color: '#22C55E', onPress: () => router.push('/(tabs)/chat') },
        { icon: 'target', label: 'Minhas Metas', color: '#10B981', onPress: () => router.push('/metas') },
        { icon: 'award', label: 'Conquistas', color: '#F59E0B', badge: gameStats?.achievementsUnlocked || 0, onPress: () => router.push('/conquistas') },
        { icon: 'bell', label: 'Notificações', color: '#8B5CF6', onPress: () => router.push('/configuracoes') },
        { icon: 'settings', label: 'Configurações', color: '#6B7280', onPress: () => router.push('/configuracoes') },
        { icon: 'help-circle', label: 'Ajuda', color: '#06B6D4', onPress: () => router.push('/configuracoes') },
    ];

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar e Info */}
                <Animated.View style={[styles.profileHeader, { opacity: fadeAnim }]}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {userName.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.userName}>{userName}</Text>
                    <Text style={styles.userEmail}>{userEmail}</Text>
                    <View style={styles.memberBadge}>
                        <Feather name="star" size={12} color="#F59E0B" />
                        <Text style={styles.memberText}>{memberSince}</Text>
                    </View>
                </Animated.View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <AnimatedCard style={styles.statCard} delay={100}>
                        <Text style={styles.statValue}>{gameStats?.level || 1}</Text>
                        <Text style={styles.statLabel}>Nível</Text>
                    </AnimatedCard>

                    <AnimatedCard style={styles.statCard} delay={150}>
                        <Text style={styles.statValue}>{gameStats?.totalPoints || 0}</Text>
                        <Text style={styles.statLabel}>Pontos</Text>
                    </AnimatedCard>

                    <AnimatedCard style={styles.statCard} delay={200}>
                        <Text style={styles.statValue}>{gameStats?.achievementsUnlocked || 0}</Text>
                        <Text style={styles.statLabel}>Conquistas</Text>
                    </AnimatedCard>
                </View>

                {/* Info do Aluno */}
                {student && (
                    <AnimatedCard style={styles.infoCard} delay={250}>
                        <Text style={styles.infoTitle}>Informações</Text>
                        <View style={styles.infoRow}>
                            <Feather name="activity" size={16} color={Colors.dark.textSecondary} />
                            <Text style={styles.infoLabel}>Objetivo:</Text>
                            <Text style={styles.infoValue}>
                                {student.fitness_goal === 'lose_weight' ? 'Perder peso' :
                                    student.fitness_goal === 'gain_muscle' ? 'Ganhar massa' :
                                        student.fitness_goal === 'maintain' ? 'Manter forma' : 'Não definido'}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Feather name="trending-up" size={16} color={Colors.dark.textSecondary} />
                            <Text style={styles.infoLabel}>Nível:</Text>
                            <Text style={styles.infoValue}>
                                {student.experience_level === 'beginner' ? 'Iniciante' :
                                    student.experience_level === 'intermediate' ? 'Intermediário' :
                                        student.experience_level === 'advanced' ? 'Avançado' : 'Não definido'}
                            </Text>
                        </View>
                        {student.current_weight && (
                            <View style={styles.infoRow}>
                                <Feather name="minimize-2" size={16} color={Colors.dark.textSecondary} />
                                <Text style={styles.infoLabel}>Peso atual:</Text>
                                <Text style={styles.infoValue}>{student.current_weight}kg</Text>
                            </View>
                        )}
                    </AnimatedCard>
                )}

                {/* Menu */}
                <View style={styles.menu}>
                    {menuItems.map((item, index) => (
                        <AnimatedCard
                            key={item.label}
                            style={styles.menuItem}
                            delay={300 + index * 50}
                            onPress={item.onPress}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                                <Feather name={item.icon as any} size={18} color={item.color} />
                            </View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <View style={styles.menuRight}>
                                {item.badge !== undefined && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{item.badge}</Text>
                                    </View>
                                )}
                                <Feather name="chevron-right" size={18} color={Colors.dark.textSecondary} />
                            </View>
                        </AnimatedCard>
                    ))}
                </View>

                {/* Logout */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <Feather name="log-out" size={18} color="#EF4444" />
                    <Text style={styles.logoutText}>Sair da conta</Text>
                </TouchableOpacity>

                <Text style={styles.version}>Versão 1.0.0</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F59E0B',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000',
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    userEmail: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginTop: 4,
    },
    memberBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderRadius: 12,
    },
    memberText: {
        fontSize: 12,
        color: '#F59E0B',
        fontWeight: '500',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#F59E0B',
    },
    statLabel: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginTop: 4,
    },
    infoCard: {
        padding: 16,
        marginBottom: 20,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    infoLabel: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginLeft: 8,
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.dark.text,
    },
    menu: {
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        marginBottom: 8,
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: Colors.dark.text,
        marginLeft: 12,
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    badge: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#000',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        gap: 8,
        borderWidth: 1,
        borderColor: '#EF444440',
        backgroundColor: Colors.dark.backgroundSecondary,
        borderRadius: 20,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#EF4444',
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginTop: 20,
    },
});

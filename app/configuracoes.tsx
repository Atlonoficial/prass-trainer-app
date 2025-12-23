// app/configuracoes.tsx - Tela de Configurações
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Colors from '@/constants/Colors';

export default function ConfiguracoesScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const [notificacoesPush, setNotificacoesPush] = useState(true);
    const [lembreteTreino, setLembreteTreino] = useState(true);
    const [lembreteAgua, setLembreteAgua] = useState(false);
    const [modoEscuro, setModoEscuro] = useState(true);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const SettingItem = ({
        icon,
        label,
        value,
        onToggle,
        color = Colors.dark.text
    }: {
        icon: string;
        label: string;
        value: boolean;
        onToggle: (v: boolean) => void;
        color?: string;
    }) => (
        <View style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: `${color}20` }]}>
                <Feather name={icon as any} size={18} color={color} />
            </View>
            <Text style={styles.settingLabel}>{label}</Text>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: '#3e3e3e', true: '#F59E0B40' }}
                thumbColor={value ? '#F59E0B' : '#f4f3f4'}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Configurações</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    {/* Notificações */}
                    <Text style={styles.sectionTitle}>Notificações</Text>
                    <AnimatedCard style={styles.settingsCard} delay={100}>
                        <SettingItem
                            icon="bell"
                            label="Notificações Push"
                            value={notificacoesPush}
                            onToggle={setNotificacoesPush}
                            color="#8B5CF6"
                        />
                        <SettingItem
                            icon="activity"
                            label="Lembrete de Treino"
                            value={lembreteTreino}
                            onToggle={setLembreteTreino}
                            color="#22C55E"
                        />
                        <SettingItem
                            icon="droplet"
                            label="Lembrete de Água"
                            value={lembreteAgua}
                            onToggle={setLembreteAgua}
                            color="#3B82F6"
                        />
                    </AnimatedCard>

                    {/* Aparência */}
                    <Text style={styles.sectionTitle}>Aparência</Text>
                    <AnimatedCard style={styles.settingsCard} delay={200}>
                        <SettingItem
                            icon="moon"
                            label="Modo Escuro"
                            value={modoEscuro}
                            onToggle={setModoEscuro}
                            color="#F59E0B"
                        />
                    </AnimatedCard>

                    {/* Sobre */}
                    <Text style={styles.sectionTitle}>Sobre</Text>
                    <AnimatedCard style={styles.settingsCard} delay={300}>
                        <TouchableOpacity style={styles.linkItem}>
                            <Feather name="file-text" size={18} color={Colors.dark.textSecondary} />
                            <Text style={styles.linkLabel}>Termos de Uso</Text>
                            <Feather name="chevron-right" size={18} color={Colors.dark.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.linkItem}>
                            <Feather name="shield" size={18} color={Colors.dark.textSecondary} />
                            <Text style={styles.linkLabel}>Política de Privacidade</Text>
                            <Feather name="chevron-right" size={18} color={Colors.dark.textSecondary} />
                        </TouchableOpacity>
                        <View style={styles.versionItem}>
                            <Feather name="info" size={18} color={Colors.dark.textSecondary} />
                            <Text style={styles.linkLabel}>Versão</Text>
                            <Text style={styles.versionText}>1.0.0</Text>
                        </View>
                    </AnimatedCard>
                </Animated.View>
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
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
        marginTop: 20,
        marginBottom: 12,
    },
    settingsCard: {
        padding: 4,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: Colors.dark.text,
        marginLeft: 12,
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    linkLabel: {
        flex: 1,
        fontSize: 15,
        color: Colors.dark.text,
        marginLeft: 12,
    },
    versionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    versionText: {
        fontSize: 15,
        color: Colors.dark.textSecondary,
    },
});

// app/goals.tsx - Tela de Metas
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGoals, Goal } from '@/hooks/useGoals';
import { AppHeader } from '@/components/ui/AppHeader';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Colors from '@/constants/Colors';

const GOAL_TYPES = [
    { id: 'weight_loss', label: 'Perder Peso', icon: '⚖️', unit: 'kg' },
    { id: 'muscle_gain', label: 'Ganhar Massa', icon: '💪', unit: 'kg' },
    { id: 'strength', label: 'Força', icon: '🏋️', unit: 'kg' },
    { id: 'endurance', label: 'Resistência', icon: '🏃', unit: 'min' },
    { id: 'habit', label: 'Hábito', icon: '✅', unit: 'dias' },
    { id: 'custom', label: 'Personalizado', icon: '🎯', unit: '' },
];

export default function GoalsScreen() {
    const { goals, loading, createGoal, updateProgress, cancelGoal, deleteGoal } = useGoals();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [newGoalType, setNewGoalType] = useState<string>('');
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newGoalTarget, setNewGoalTarget] = useState('');
    const [newGoalDeadline, setNewGoalDeadline] = useState('');
    const [progressValue, setProgressValue] = useState('');

    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');

    const handleCreateGoal = async () => {
        if (!newGoalTitle.trim() || !newGoalTarget) {
            Alert.alert('Erro', 'Preencha título e meta');
            return;
        }

        try {
            await createGoal({
                title: newGoalTitle.trim(),
                description: '',
                type: (newGoalType || 'custom') as Goal['type'],
                target_value: parseFloat(newGoalTarget),
                current_value: 0,
                unit: GOAL_TYPES.find(t => t.id === newGoalType)?.unit || '',
                start_date: new Date().toISOString().split('T')[0],
                target_date: newGoalDeadline || undefined,
                status: 'active',
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowCreateModal(false);
            resetForm();
            Alert.alert('Sucesso', 'Meta criada!');
        } catch (e: any) {
            Alert.alert('Erro', e.message);
        }
    };

    const handleUpdateProgress = async () => {
        if (!selectedGoal || !progressValue) return;

        try {
            await updateProgress(selectedGoal.id, parseFloat(progressValue));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowProgressModal(false);
            setSelectedGoal(null);
            setProgressValue('');
        } catch (e: any) {
            Alert.alert('Erro', e.message);
        }
    };

    const handleDeleteGoal = (goal: Goal) => {
        Alert.alert(
            'Excluir meta?',
            `"${goal.title}" será removida permanentemente.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteGoal(goal.id);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (e: any) {
                            Alert.alert('Erro', e.message);
                        }
                    },
                },
            ]
        );
    };

    const resetForm = () => {
        setNewGoalType('');
        setNewGoalTitle('');
        setNewGoalTarget('');
        setNewGoalDeadline('');
    };

    const getProgressPercentage = (goal: Goal) => {
        if (!goal.target_value) return 0;
        return Math.min(100, Math.round(((goal.current_value || 0) / goal.target_value) * 100));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
        });
    };

    const getGoalIcon = (type: string) => {
        return GOAL_TYPES.find(t => t.id === type)?.icon || '🎯';
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <AppHeader title="Minhas Metas" showBack />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Carregando...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader title="Minhas Metas" showBack />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Metas Ativas */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Metas Ativas</Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setShowCreateModal(true)}
                        >
                            <Ionicons name="add" size={20} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {activeGoals.length === 0 ? (
                        <TouchableOpacity
                            style={styles.emptyCard}
                            onPress={() => setShowCreateModal(true)}
                        >
                            <Text style={styles.emptyIcon}>🎯</Text>
                            <Text style={styles.emptyText}>Crie sua primeira meta!</Text>
                            <Text style={styles.emptySubtext}>Estabeleça objetivos claros</Text>
                        </TouchableOpacity>
                    ) : (
                        activeGoals.map((goal, index) => {
                            const progress = getProgressPercentage(goal);
                            return (
                                <AnimatedCard key={goal.id} delay={index * 50}>
                                    <View style={styles.goalCard}>
                                        <View style={styles.goalHeader}>
                                            <Text style={styles.goalIcon}>{getGoalIcon(goal.type)}</Text>
                                            <View style={styles.goalInfo}>
                                                <Text style={styles.goalTitle}>{goal.title}</Text>
                                                {goal.target_date && (
                                                    <Text style={styles.goalDeadline}>
                                                        até {formatDate(goal.target_date)}
                                                    </Text>
                                                )}
                                            </View>
                                            <TouchableOpacity
                                                style={styles.moreButton}
                                                onPress={() => handleDeleteGoal(goal)}
                                            >
                                                <Ionicons name="trash-outline" size={18} color="#666" />
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.goalProgress}>
                                            <View style={styles.progressBar}>
                                                <View
                                                    style={[
                                                        styles.progressFill,
                                                        { width: `${progress}%` },
                                                        progress >= 100 && styles.progressComplete
                                                    ]}
                                                />
                                            </View>
                                            <Text style={styles.progressText}>
                                                {goal.current_value || 0} / {goal.target_value} ({progress}%)
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            style={styles.updateButton}
                                            onPress={() => {
                                                setSelectedGoal(goal);
                                                setShowProgressModal(true);
                                            }}
                                        >
                                            <Text style={styles.updateButtonText}>Atualizar Progresso</Text>
                                        </TouchableOpacity>
                                    </View>
                                </AnimatedCard>
                            );
                        })
                    )}
                </View>

                {/* Metas Concluídas */}
                {completedGoals.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🏆 Concluídas</Text>
                        {completedGoals.map((goal) => (
                            <View key={goal.id} style={styles.completedCard}>
                                <Text style={styles.goalIcon}>{getGoalIcon(goal.type)}</Text>
                                <View style={styles.goalInfo}>
                                    <Text style={styles.completedTitle}>{goal.title}</Text>
                                    <Text style={styles.completedMeta}>
                                        Meta: {goal.target_value}
                                    </Text>
                                </View>
                                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Modal Criar Meta */}
            <Modal visible={showCreateModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nova Meta</Text>
                            <TouchableOpacity onPress={() => {
                                setShowCreateModal(false);
                                resetForm();
                            }}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Tipo de Meta</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.typeScroll}
                        >
                            {GOAL_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[
                                        styles.typeChip,
                                        newGoalType === type.id && styles.typeChipActive,
                                    ]}
                                    onPress={() => setNewGoalType(type.id)}
                                >
                                    <Text style={styles.typeChipIcon}>{type.icon}</Text>
                                    <Text style={[
                                        styles.typeChipText,
                                        newGoalType === type.id && styles.typeChipTextActive,
                                    ]}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.inputLabel}>Título</Text>
                        <TextInput
                            style={styles.input}
                            value={newGoalTitle}
                            onChangeText={setNewGoalTitle}
                            placeholder="Ex: Perder 5kg"
                            placeholderTextColor="#666"
                        />

                        <Text style={styles.inputLabel}>Meta (valor numérico)</Text>
                        <TextInput
                            style={styles.input}
                            value={newGoalTarget}
                            onChangeText={setNewGoalTarget}
                            placeholder="Ex: 5"
                            placeholderTextColor="#666"
                            keyboardType="decimal-pad"
                        />

                        <Text style={styles.inputLabel}>Prazo (opcional)</Text>
                        <TextInput
                            style={styles.input}
                            value={newGoalDeadline}
                            onChangeText={setNewGoalDeadline}
                            placeholder="DD/MM/AAAA"
                            placeholderTextColor="#666"
                        />

                        <TouchableOpacity
                            style={[styles.createButton, loading && styles.buttonDisabled]}
                            onPress={handleCreateGoal}
                            disabled={loading}
                        >
                            <Text style={styles.createButtonText}>
                                {loading ? 'Criando...' : 'Criar Meta'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal Atualizar Progresso */}
            <Modal visible={showProgressModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContentSmall}>
                        <Text style={styles.modalTitle}>Atualizar Progresso</Text>
                        {selectedGoal && (
                            <>
                                <Text style={styles.modalSubtitle}>{selectedGoal.title}</Text>
                                <Text style={styles.currentProgress}>
                                    Atual: {selectedGoal.current_value || 0} / {selectedGoal.target_value}
                                </Text>
                            </>
                        )}

                        <Text style={styles.inputLabel}>Novo valor</Text>
                        <TextInput
                            style={styles.input}
                            value={progressValue}
                            onChangeText={setProgressValue}
                            placeholder="Digite o valor atual"
                            placeholderTextColor="#666"
                            keyboardType="decimal-pad"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowProgressModal(false);
                                    setSelectedGoal(null);
                                    setProgressValue('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleUpdateProgress}
                            >
                                <Text style={styles.confirmButtonText}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        color: '#fff',
        fontSize: 16,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#333',
        borderStyle: 'dashed',
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: 12,
    },
    emptyText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptySubtext: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    goalCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    goalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    goalIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    goalInfo: {
        flex: 1,
    },
    goalTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    goalDeadline: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    moreButton: {
        padding: 8,
    },
    goalProgress: {
        marginBottom: 12,
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
    progressComplete: {
        backgroundColor: Colors.success,
    },
    progressText: {
        color: '#999',
        fontSize: 12,
        textAlign: 'right',
    },
    updateButton: {
        backgroundColor: '#222',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    updateButtonText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    completedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    completedTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    completedMeta: {
        color: '#666',
        fontSize: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '80%',
    },
    modalContentSmall: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    modalSubtitle: {
        color: '#999',
        fontSize: 14,
        marginTop: 4,
    },
    currentProgress: {
        color: Colors.primary,
        fontSize: 14,
        marginTop: 8,
        marginBottom: 16,
    },
    inputLabel: {
        color: '#999',
        fontSize: 12,
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#222',
        borderRadius: 12,
        padding: 14,
        color: '#fff',
        fontSize: 16,
    },
    typeScroll: {
        marginBottom: 8,
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginRight: 8,
        gap: 6,
    },
    typeChipActive: {
        backgroundColor: Colors.primary,
    },
    typeChipIcon: {
        fontSize: 16,
    },
    typeChipText: {
        color: '#fff',
        fontSize: 14,
    },
    typeChipTextActive: {
        color: '#000',
        fontWeight: '600',
    },
    createButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    createButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#333',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    confirmButton: {
        flex: 1,
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
});

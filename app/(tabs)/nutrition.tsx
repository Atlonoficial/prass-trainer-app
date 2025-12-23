// app/(tabs)/nutrition.tsx - Tela de Nutrição com dados reais
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert, TextInput, Modal } from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNutrition } from '@/hooks/useNutrition';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { AppHeader } from '@/components/ui/AppHeader';
import Colors from '@/constants/Colors';

export default function NutritionScreen() {
    const { currentPlan, mealLogs, todayNutrition, loading, logMeal } = useNutrition();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [showModal, setShowModal] = useState(false);
    const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
    const [mealDescription, setMealDescription] = useState('');
    const [mealCalories, setMealCalories] = useState('');

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleMealPress = (mealType: string, mealLabel: string) => {
        setSelectedMealType(mealType);
        setShowModal(true);
    };

    const handleRegisterMeal = async () => {
        if (!mealDescription.trim()) {
            Alert.alert('Atenção', 'Por favor, descreva sua refeição');
            return;
        }

        try {
            await logMeal({
                meal_type: (selectedMealType || 'snack') as 'breakfast' | 'lunch' | 'dinner' | 'snack',
                description: mealDescription,
                calories: mealCalories ? parseInt(mealCalories) : undefined,
                logged_at: new Date().toISOString(),
            });
            Alert.alert('Sucesso', 'Refeição registrada com sucesso!');
            setShowModal(false);
            setMealDescription('');
            setMealCalories('');
            setSelectedMealType(null);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível registrar a refeição');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.loadingText}>Carregando nutrição...</Text>
            </View>
        );
    }

    const mealTypes = [
        { type: 'breakfast', label: 'Café da manhã', icon: 'coffee', color: '#F59E0B' },
        { type: 'lunch', label: 'Almoço', icon: 'sun', color: '#22C55E' },
        { type: 'dinner', label: 'Jantar', icon: 'moon', color: '#8B5CF6' },
        { type: 'snack', label: 'Lanche', icon: 'heart', color: '#EC4899' },
    ];

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header com Logo */}
                <AppHeader />

                {/* Resumo do Dia */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={styles.sectionTitle}>Resumo do Dia</Text>
                    <AnimatedCard style={styles.summaryCard} delay={100}>
                        <View style={styles.macrosGrid}>
                            <View style={styles.macroItem}>
                                <View style={[styles.macroIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                                    <Feather name="zap" size={20} color="#F59E0B" />
                                </View>
                                <Text style={styles.macroValue}>
                                    {todayNutrition?.totalCalories || 0}
                                </Text>
                                <Text style={styles.macroLabel}>Calorias</Text>
                            </View>

                            <View style={styles.macroItem}>
                                <View style={[styles.macroIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                                    <Feather name="droplet" size={20} color="#EF4444" />
                                </View>
                                <Text style={styles.macroValue}>
                                    {todayNutrition?.totalProtein || 0}g
                                </Text>
                                <Text style={styles.macroLabel}>Proteína</Text>
                            </View>

                            <View style={styles.macroItem}>
                                <View style={[styles.macroIcon, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                                    <Feather name="hexagon" size={20} color="#22C55E" />
                                </View>
                                <Text style={styles.macroValue}>
                                    {todayNutrition?.totalCarbs || 0}g
                                </Text>
                                <Text style={styles.macroLabel}>Carbos</Text>
                            </View>

                            <View style={styles.macroItem}>
                                <View style={[styles.macroIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                                    <Feather name="circle" size={20} color="#3B82F6" />
                                </View>
                                <Text style={styles.macroValue}>
                                    {todayNutrition?.totalFat || 0}g
                                </Text>
                                <Text style={styles.macroLabel}>Gordura</Text>
                            </View>
                        </View>

                        <View style={styles.mealsCount}>
                            <Feather name="check-circle" size={16} color="#22C55E" />
                            <Text style={styles.mealsCountText}>
                                {todayNutrition?.mealsLogged || 0} refeições registradas hoje
                            </Text>
                        </View>
                    </AnimatedCard>
                </Animated.View>

                {/* Plano Alimentar */}
                {currentPlan && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Seu Plano</Text>
                        <AnimatedCard style={styles.planCard} delay={200}>
                            <View style={styles.planHeader}>
                                <View style={styles.planIcon}>
                                    <Feather name="book-open" size={24} color="#F59E0B" />
                                </View>
                                <View style={styles.planInfo}>
                                    <Text style={styles.planName}>{currentPlan.name}</Text>
                                    <Text style={styles.planDesc}>
                                        {currentPlan.description || 'Plano nutricional personalizado'}
                                    </Text>
                                </View>
                            </View>

                            {currentPlan.total_calories && (
                                <View style={styles.planTargets}>
                                    <View style={styles.targetItem}>
                                        <Text style={styles.targetValue}>{currentPlan.total_calories}</Text>
                                        <Text style={styles.targetLabel}>kcal/dia</Text>
                                    </View>
                                    <View style={styles.targetItem}>
                                        <Text style={styles.targetValue}>{currentPlan.total_protein || '--'}g</Text>
                                        <Text style={styles.targetLabel}>proteína</Text>
                                    </View>
                                    <View style={styles.targetItem}>
                                        <Text style={styles.targetValue}>{currentPlan.total_carbs || '--'}g</Text>
                                        <Text style={styles.targetLabel}>carbos</Text>
                                    </View>
                                </View>
                            )}
                        </AnimatedCard>
                    </View>
                )}

                {/* Registrar Refeição */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Registrar Refeição</Text>
                    <View style={styles.mealTypeGrid}>
                        {mealTypes.map((meal, index) => (
                            <AnimatedCard
                                key={meal.type}
                                style={styles.mealTypeCard}
                                delay={300 + index * 50}
                                onPress={() => handleMealPress(meal.type, meal.label)}
                            >
                                <View style={[styles.mealTypeIcon, { backgroundColor: `${meal.color}20` }]}>
                                    <Feather name={meal.icon as any} size={24} color={meal.color} />
                                </View>
                                <Text style={styles.mealTypeLabel}>{meal.label}</Text>
                                <Text style={styles.mealTypeSubtitle}>Registrar</Text>
                            </AnimatedCard>
                        ))}
                    </View>
                </View>

                {/* Refeições de Hoje */}
                {mealLogs.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Hoje</Text>
                        {mealLogs.map((log, index) => (
                            <AnimatedCard key={log.id} style={styles.logCard} delay={400 + index * 50}>
                                <View style={styles.logHeader}>
                                    <View style={styles.logIcon}>
                                        <Feather name="coffee" size={18} color="#F59E0B" />
                                    </View>
                                    <View style={styles.logInfo}>
                                        <Text style={styles.logDesc}>{log.description}</Text>
                                        <Text style={styles.logTime}>
                                            {new Date(log.logged_at).toLocaleTimeString('pt-BR', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                    </View>
                                    {log.calories && (
                                        <Text style={styles.logCalories}>{log.calories} kcal</Text>
                                    )}
                                </View>
                            </AnimatedCard>
                        ))}
                    </View>
                )}

                {/* Dicas */}
                <View style={styles.section}>
                    <AnimatedCard style={styles.tipCard} delay={500}>
                        <View style={styles.tipIcon}>
                            <Feather name="info" size={20} color="#3B82F6" />
                        </View>
                        <View style={styles.tipContent}>
                            <Text style={styles.tipTitle}>Dica do dia</Text>
                            <Text style={styles.tipText}>
                                Mantenha-se hidratado! Beba pelo menos 2 litros de água por dia.
                            </Text>
                        </View>
                    </AnimatedCard>
                </View>
            </ScrollView>

            {/* Modal de Registro de Refeição */}
            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Registrar {mealTypes.find(m => m.type === selectedMealType)?.label}
                            </Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Feather name="x" size={24} color={Colors.dark.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Descrição da refeição</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Ex: Arroz, feijão, frango grelhado..."
                            placeholderTextColor={Colors.dark.textSecondary}
                            value={mealDescription}
                            onChangeText={setMealDescription}
                            multiline
                        />

                        <Text style={styles.inputLabel}>Calorias (opcional)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Ex: 450"
                            placeholderTextColor={Colors.dark.textSecondary}
                            value={mealCalories}
                            onChangeText={setMealCalories}
                            keyboardType="numeric"
                        />

                        <TouchableOpacity style={styles.registerButton} onPress={handleRegisterMeal}>
                            <Text style={styles.registerButtonText}>Registrar Refeição</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: Colors.dark.textSecondary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 16,
    },
    summaryCard: {
        padding: 20,
    },
    macrosGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    macroItem: {
        alignItems: 'center',
    },
    macroIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    macroValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    macroLabel: {
        fontSize: 11,
        color: Colors.dark.textSecondary,
        marginTop: 2,
    },
    mealsCount: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    mealsCountText: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
    },
    planCard: {
        padding: 16,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    planIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    planInfo: {
        flex: 1,
        marginLeft: 12,
    },
    planName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    planDesc: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        marginTop: 2,
    },
    planTargets: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    targetItem: {
        alignItems: 'center',
    },
    targetValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#F59E0B',
    },
    targetLabel: {
        fontSize: 11,
        color: Colors.dark.textSecondary,
        marginTop: 2,
    },
    mealTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    mealTypeCard: {
        width: (Dimensions.get('window').width - 44) / 2, // (tela - padding*2 - gap) / 2
        minWidth: 150,
        padding: 16,
        alignItems: 'flex-start',
    },
    mealTypeIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    mealTypeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 2,
        flexWrap: 'nowrap',
    },
    mealTypeSubtitle: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    logCard: {
        padding: 14,
        marginBottom: 8,
    },
    logHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logInfo: {
        flex: 1,
        marginLeft: 10,
    },
    logDesc: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.dark.text,
    },
    logTime: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginTop: 2,
    },
    logCalories: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F59E0B',
    },
    tipCard: {
        flexDirection: 'row',
        padding: 16,
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
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.dark.backgroundSecondary,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 8,
        marginTop: 16,
    },
    textInput: {
        backgroundColor: Colors.dark.background,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: Colors.dark.text,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        minHeight: 50,
    },
    registerButton: {
        backgroundColor: '#F59E0B',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    registerButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
});

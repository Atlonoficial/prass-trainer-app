// app/meal-register.tsx - Registro de Refeição
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNutrition } from '@/hooks/useNutrition';
import { AppHeader } from '@/components/ui/AppHeader';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Colors from '@/constants/Colors';

const MEAL_TYPES = [
    { id: 'breakfast', label: 'Café da Manhã', icon: '🌅', time: '06:00 - 09:00' },
    { id: 'lunch', label: 'Almoço', icon: '☀️', time: '11:00 - 14:00' },
    { id: 'snack', label: 'Lanche', icon: '🥪', time: '15:00 - 17:00' },
    { id: 'dinner', label: 'Jantar', icon: '🌙', time: '18:00 - 21:00' },
];

const QUICK_FOODS = [
    { name: 'Frango grelhado', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    { name: 'Arroz branco', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    { name: 'Feijão', calories: 47, protein: 3, carbs: 8, fat: 0.5 },
    { name: 'Ovo cozido', calories: 78, protein: 6, carbs: 0.6, fat: 5 },
    { name: 'Batata doce', calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
    { name: 'Salada verde', calories: 15, protein: 1, carbs: 2, fat: 0.2 },
    { name: 'Whey Protein', calories: 120, protein: 24, carbs: 3, fat: 1 },
    { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
];

export default function MealRegisterScreen() {
    const router = useRouter();
    const { logMeal, todayNutrition, currentPlan } = useNutrition();

    const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [saving, setSaving] = useState(false);
    const [showQuickFoods, setShowQuickFoods] = useState(false);

    const handleQuickFood = (food: typeof QUICK_FOODS[0]) => {
        setDescription((prev) => prev ? `${prev}, ${food.name}` : food.name);
        setCalories((prev) => String(Number(prev || 0) + food.calories));
        setProtein((prev) => String(Number(prev || 0) + food.protein));
        setCarbs((prev) => String(Number(prev || 0) + food.carbs));
        setFat((prev) => String((Number(prev || 0) + food.fat).toFixed(1)));
        setShowQuickFoods(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleSave = async () => {
        if (!selectedMealType) {
            Alert.alert('Erro', 'Selecione o tipo de refeição');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Erro', 'Descreva sua refeição');
            return;
        }

        setSaving(true);
        try {
            await logMeal({
                meal_type: selectedMealType as any,
                description: description.trim(),
                calories: calories ? parseInt(calories) : undefined,
                protein: protein ? parseFloat(protein) : undefined,
                carbs: carbs ? parseFloat(carbs) : undefined,
                fat: fat ? parseFloat(fat) : undefined,
                logged_at: new Date().toISOString(),
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Sucesso', 'Refeição registrada!', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (e: any) {
            Alert.alert('Erro', e.message);
        } finally {
            setSaving(false);
        }
    };

    const clearForm = () => {
        setDescription('');
        setCalories('');
        setProtein('');
        setCarbs('');
        setFat('');
    };

    // Calcula metas
    const goals = currentPlan ? {
        calories: currentPlan.total_calories || 2000,
        protein: currentPlan.total_protein || 150,
        carbs: currentPlan.total_carbs || 250,
        fat: currentPlan.total_fat || 70,
    } : { calories: 2000, protein: 150, carbs: 250, fat: 70 };

    const consumed = todayNutrition || { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader title="Registrar Refeição" showBack />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Resumo do Dia */}
                <AnimatedCard delay={0}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Hoje</Text>
                        <View style={styles.macrosRow}>
                            <View style={styles.macroItem}>
                                <Text style={styles.macroValue}>{consumed.totalCalories}</Text>
                                <Text style={styles.macroLabel}>/{goals.calories} kcal</Text>
                            </View>
                            <View style={styles.macroDivider} />
                            <View style={styles.macroItem}>
                                <Text style={[styles.macroValue, { color: '#EF4444' }]}>
                                    {consumed.totalProtein}g
                                </Text>
                                <Text style={styles.macroLabel}>Proteína</Text>
                            </View>
                            <View style={styles.macroDivider} />
                            <View style={styles.macroItem}>
                                <Text style={[styles.macroValue, { color: '#3B82F6' }]}>
                                    {consumed.totalCarbs}g
                                </Text>
                                <Text style={styles.macroLabel}>Carbs</Text>
                            </View>
                            <View style={styles.macroDivider} />
                            <View style={styles.macroItem}>
                                <Text style={[styles.macroValue, { color: '#F59E0B' }]}>
                                    {consumed.totalFat}g
                                </Text>
                                <Text style={styles.macroLabel}>Gordura</Text>
                            </View>
                        </View>
                    </View>
                </AnimatedCard>

                {/* Tipo de Refeição */}
                <Text style={styles.sectionTitle}>Tipo de Refeição</Text>
                <View style={styles.mealTypeGrid}>
                    {MEAL_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            style={[
                                styles.mealTypeCard,
                                selectedMealType === type.id && styles.mealTypeCardActive,
                            ]}
                            onPress={() => {
                                setSelectedMealType(type.id);
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                        >
                            <Text style={styles.mealTypeIcon}>{type.icon}</Text>
                            <Text style={[
                                styles.mealTypeLabel,
                                selectedMealType === type.id && styles.mealTypeLabelActive,
                            ]}>
                                {type.label}
                            </Text>
                            <Text style={styles.mealTypeTime}>{type.time}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Descrição */}
                <AnimatedCard delay={100}>
                    <View style={styles.inputCard}>
                        <View style={styles.inputHeader}>
                            <Text style={styles.inputTitle}>O que você comeu?</Text>
                            <TouchableOpacity
                                style={styles.quickAddButton}
                                onPress={() => setShowQuickFoods(true)}
                            >
                                <Ionicons name="flash" size={16} color={Colors.primary} />
                                <Text style={styles.quickAddText}>Adicionar Rápido</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Ex: 150g frango grelhado, 100g arroz, salada..."
                            placeholderTextColor="#666"
                            multiline
                        />
                    </View>
                </AnimatedCard>

                {/* Macros */}
                <AnimatedCard delay={200}>
                    <View style={styles.inputCard}>
                        <Text style={styles.inputTitle}>Informações Nutricionais</Text>
                        <Text style={styles.inputSubtitle}>Opcional - ajuda no acompanhamento</Text>

                        <View style={styles.macrosInputGrid}>
                            <View style={styles.macroInputItem}>
                                <Text style={styles.macroInputLabel}>Calorias</Text>
                                <TextInput
                                    style={styles.macroInput}
                                    value={calories}
                                    onChangeText={setCalories}
                                    placeholder="0"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                />
                                <Text style={styles.macroInputUnit}>kcal</Text>
                            </View>
                            <View style={styles.macroInputItem}>
                                <Text style={[styles.macroInputLabel, { color: '#EF4444' }]}>Proteína</Text>
                                <TextInput
                                    style={styles.macroInput}
                                    value={protein}
                                    onChangeText={setProtein}
                                    placeholder="0"
                                    placeholderTextColor="#666"
                                    keyboardType="decimal-pad"
                                />
                                <Text style={styles.macroInputUnit}>g</Text>
                            </View>
                            <View style={styles.macroInputItem}>
                                <Text style={[styles.macroInputLabel, { color: '#3B82F6' }]}>Carbs</Text>
                                <TextInput
                                    style={styles.macroInput}
                                    value={carbs}
                                    onChangeText={setCarbs}
                                    placeholder="0"
                                    placeholderTextColor="#666"
                                    keyboardType="decimal-pad"
                                />
                                <Text style={styles.macroInputUnit}>g</Text>
                            </View>
                            <View style={styles.macroInputItem}>
                                <Text style={[styles.macroInputLabel, { color: '#F59E0B' }]}>Gordura</Text>
                                <TextInput
                                    style={styles.macroInput}
                                    value={fat}
                                    onChangeText={setFat}
                                    placeholder="0"
                                    placeholderTextColor="#666"
                                    keyboardType="decimal-pad"
                                />
                                <Text style={styles.macroInputUnit}>g</Text>
                            </View>
                        </View>
                    </View>
                </AnimatedCard>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Botões de Ação */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.clearButton} onPress={clearForm}>
                    <Text style={styles.clearButtonText}>Limpar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={styles.saveButtonText}>
                        {saving ? 'Salvando...' : 'Registrar Refeição'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Modal de Alimentos Rápidos */}
            <Modal
                visible={showQuickFoods}
                transparent
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Adicionar Rápido</Text>
                            <TouchableOpacity onPress={() => setShowQuickFoods(false)}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>
                            Toque para adicionar (porção de 100g)
                        </Text>
                        <ScrollView style={styles.quickFoodsList}>
                            {QUICK_FOODS.map((food, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.quickFoodItem}
                                    onPress={() => handleQuickFood(food)}
                                >
                                    <View>
                                        <Text style={styles.quickFoodName}>{food.name}</Text>
                                        <Text style={styles.quickFoodMacros}>
                                            P: {food.protein}g | C: {food.carbs}g | G: {food.fat}g
                                        </Text>
                                    </View>
                                    <Text style={styles.quickFoodCalories}>
                                        {food.calories} kcal
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
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
    content: {
        flex: 1,
        padding: 16,
    },
    summaryCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    summaryTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    macrosRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    macroItem: {
        flex: 1,
        alignItems: 'center',
    },
    macroValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    macroLabel: {
        color: '#666',
        fontSize: 10,
        marginTop: 2,
    },
    macroDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#333',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    mealTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    mealTypeCard: {
        width: '48%',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    mealTypeCardActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '10',
    },
    mealTypeIcon: {
        fontSize: 28,
        marginBottom: 6,
    },
    mealTypeLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    mealTypeLabelActive: {
        color: Colors.primary,
    },
    mealTypeTime: {
        color: '#666',
        fontSize: 10,
        marginTop: 4,
    },
    inputCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    inputHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    inputTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    inputSubtitle: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
        marginBottom: 16,
    },
    quickAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    quickAddText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#222',
        borderRadius: 10,
        padding: 14,
        color: '#fff',
        fontSize: 16,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    macrosInputGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    macroInputItem: {
        width: '48%',
        backgroundColor: '#222',
        borderRadius: 10,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    macroInputLabel: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
        marginRight: 8,
    },
    macroInput: {
        flex: 1,
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'right',
    },
    macroInputUnit: {
        color: '#666',
        fontSize: 12,
        marginLeft: 4,
    },
    actions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 16,
        paddingBottom: 32,
        backgroundColor: '#000',
        borderTopWidth: 1,
        borderTopColor: '#222',
        gap: 12,
    },
    clearButton: {
        backgroundColor: '#333',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    clearButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    saveButton: {
        flex: 1,
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
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
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    modalSubtitle: {
        color: '#666',
        fontSize: 12,
        marginBottom: 16,
    },
    quickFoodsList: {
        maxHeight: 400,
    },
    quickFoodItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#222',
        borderRadius: 10,
        padding: 14,
        marginBottom: 8,
    },
    quickFoodName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    quickFoodMacros: {
        color: '#666',
        fontSize: 11,
        marginTop: 4,
    },
    quickFoodCalories: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});

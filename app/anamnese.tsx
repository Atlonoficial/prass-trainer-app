// app/anamnese.tsx - Formulário de Anamnese
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAnamnese } from '@/hooks/useAnamnese';
import { AppHeader } from '@/components/ui/AppHeader';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Colors from '@/constants/Colors';

const SECTIONS = [
    { id: 'personal', title: 'Informações Pessoais', icon: 'person' },
    { id: 'medical', title: 'Histórico Médico', icon: 'medkit' },
    { id: 'habits', title: 'Hábitos de Vida', icon: 'fitness' },
    { id: 'goals', title: 'Objetivos', icon: 'flag' },
    { id: 'diet', title: 'Alimentação', icon: 'nutrition' },
];

const GOAL_OPTIONS = [
    'Perder peso',
    'Ganhar massa muscular',
    'Melhorar condicionamento',
    'Mais energia',
    'Saúde geral',
    'Competição',
];

const CONDITION_OPTIONS = [
    'Diabetes',
    'Hipertensão',
    'Cardiopatia',
    'Artrite/Artrose',
    'Asma',
    'Outro',
];

export default function AnamneseScreen() {
    const router = useRouter();
    const { anamnese, loading, saving, saveAnamnese, markAsComplete } = useAnamnese();

    const [currentSection, setCurrentSection] = useState(0);
    const [formData, setFormData] = useState({
        birth_date: '',
        gender: '',
        height: '',
        weight: '',
        occupation: '',
        medical_conditions: [] as string[],
        medications: '',
        surgeries: '',
        allergies: '',
        injuries: '',
        sleep_hours: '',
        smoking: false,
        alcohol: false,
        exercise_frequency: '',
        stress_level: 5,
        main_goals: [] as string[],
        target_weight: '',
        preferred_workout_time: '',
        dietary_restrictions: '',
        meals_per_day: '',
        water_intake: '',
        notes: '',
    });

    useEffect(() => {
        if (anamnese) {
            setFormData({
                birth_date: anamnese.birth_date || '',
                gender: anamnese.gender || '',
                height: anamnese.height?.toString() || '',
                weight: anamnese.weight?.toString() || '',
                occupation: anamnese.occupation || '',
                medical_conditions: anamnese.medical_conditions || [],
                medications: anamnese.medications?.join(', ') || '',
                surgeries: anamnese.surgeries?.join(', ') || '',
                allergies: anamnese.allergies?.join(', ') || '',
                injuries: anamnese.injuries?.join(', ') || '',
                sleep_hours: anamnese.sleep_hours?.toString() || '',
                smoking: anamnese.smoking || false,
                alcohol: anamnese.alcohol || false,
                exercise_frequency: anamnese.exercise_frequency || '',
                stress_level: anamnese.stress_level || 5,
                main_goals: anamnese.main_goals || [],
                target_weight: anamnese.target_weight?.toString() || '',
                preferred_workout_time: anamnese.preferred_workout_time || '',
                dietary_restrictions: anamnese.dietary_restrictions?.join(', ') || '',
                meals_per_day: anamnese.meals_per_day?.toString() || '',
                water_intake: anamnese.water_intake?.toString() || '',
                notes: anamnese.notes || '',
            });
        }
    }, [anamnese]);

    const updateField = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleArrayItem = (field: 'medical_conditions' | 'main_goals', item: string) => {
        setFormData((prev) => {
            const arr = prev[field];
            if (arr.includes(item)) {
                return { ...prev, [field]: arr.filter((i) => i !== item) };
            } else {
                return { ...prev, [field]: [...arr, item] };
            }
        });
    };

    const nextSection = () => {
        if (currentSection < SECTIONS.length - 1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentSection((prev) => prev + 1);
        }
    };

    const prevSection = () => {
        if (currentSection > 0) {
            setCurrentSection((prev) => prev - 1);
        }
    };

    const handleSave = async () => {
        try {
            const dataToSave = {
                birth_date: formData.birth_date || undefined,
                gender: formData.gender || undefined,
                height: formData.height ? parseFloat(formData.height) : undefined,
                weight: formData.weight ? parseFloat(formData.weight) : undefined,
                occupation: formData.occupation || undefined,
                medical_conditions: formData.medical_conditions,
                medications: formData.medications ? formData.medications.split(',').map((s) => s.trim()) : undefined,
                surgeries: formData.surgeries ? formData.surgeries.split(',').map((s) => s.trim()) : undefined,
                allergies: formData.allergies ? formData.allergies.split(',').map((s) => s.trim()) : undefined,
                injuries: formData.injuries ? formData.injuries.split(',').map((s) => s.trim()) : undefined,
                sleep_hours: formData.sleep_hours ? parseInt(formData.sleep_hours) : undefined,
                smoking: formData.smoking,
                alcohol: formData.alcohol,
                exercise_frequency: formData.exercise_frequency || undefined,
                stress_level: formData.stress_level,
                main_goals: formData.main_goals,
                target_weight: formData.target_weight ? parseFloat(formData.target_weight) : undefined,
                preferred_workout_time: formData.preferred_workout_time || undefined,
                dietary_restrictions: formData.dietary_restrictions ? formData.dietary_restrictions.split(',').map((s) => s.trim()) : undefined,
                meals_per_day: formData.meals_per_day ? parseInt(formData.meals_per_day) : undefined,
                water_intake: formData.water_intake ? parseFloat(formData.water_intake) : undefined,
                notes: formData.notes || undefined,
            };

            await saveAnamnese(dataToSave);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Sucesso', 'Anamnese salva com sucesso!');
        } catch (e: any) {
            Alert.alert('Erro', e.message);
        }
    };

    const handleComplete = async () => {
        Alert.alert(
            'Finalizar Anamnese?',
            'Após finalizar, seu professor será notificado.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Finalizar',
                    onPress: async () => {
                        try {
                            await markAsComplete();
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert('Sucesso', 'Anamnese finalizada!', [
                                { text: 'OK', onPress: () => router.back() },
                            ]);
                        } catch (e: any) {
                            Alert.alert('Erro', e.message);
                        }
                    },
                },
            ]
        );
    };

    const renderSection = () => {
        const section = SECTIONS[currentSection];

        switch (section.id) {
            case 'personal':
                return (
                    <View style={styles.sectionContent}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Data de Nascimento</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.birth_date}
                                onChangeText={(v) => updateField('birth_date', v)}
                                placeholder="DD/MM/AAAA"
                                placeholderTextColor="#666"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Gênero</Text>
                            <View style={styles.optionRow}>
                                {['Masculino', 'Feminino', 'Outro'].map((g) => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[
                                            styles.optionButton,
                                            formData.gender === g && styles.optionButtonActive,
                                        ]}
                                        onPress={() => updateField('gender', g)}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                formData.gender === g && styles.optionTextActive,
                                            ]}
                                        >
                                            {g}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Altura (cm)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.height}
                                    onChangeText={(v) => updateField('height', v)}
                                    placeholder="170"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                <Text style={styles.inputLabel}>Peso (kg)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.weight}
                                    onChangeText={(v) => updateField('weight', v)}
                                    placeholder="70"
                                    placeholderTextColor="#666"
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Ocupação</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.occupation}
                                onChangeText={(v) => updateField('occupation', v)}
                                placeholder="Ex: Desenvolvedor"
                                placeholderTextColor="#666"
                            />
                        </View>
                    </View>
                );

            case 'medical':
                return (
                    <View style={styles.sectionContent}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Condições Médicas</Text>
                            <View style={styles.chipContainer}>
                                {CONDITION_OPTIONS.map((cond) => (
                                    <TouchableOpacity
                                        key={cond}
                                        style={[
                                            styles.chip,
                                            formData.medical_conditions.includes(cond) && styles.chipActive,
                                        ]}
                                        onPress={() => toggleArrayItem('medical_conditions', cond)}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                formData.medical_conditions.includes(cond) && styles.chipTextActive,
                                            ]}
                                        >
                                            {cond}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Medicamentos em uso</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.medications}
                                onChangeText={(v) => updateField('medications', v)}
                                placeholder="Separe por vírgula"
                                placeholderTextColor="#666"
                                multiline
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Cirurgias anteriores</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.surgeries}
                                onChangeText={(v) => updateField('surgeries', v)}
                                placeholder="Separe por vírgula"
                                placeholderTextColor="#666"
                                multiline
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Alergias</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.allergies}
                                onChangeText={(v) => updateField('allergies', v)}
                                placeholder="Separe por vírgula"
                                placeholderTextColor="#666"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Lesões ou dores</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.injuries}
                                onChangeText={(v) => updateField('injuries', v)}
                                placeholder="Descreva lesões ou dores frequentes"
                                placeholderTextColor="#666"
                                multiline
                            />
                        </View>
                    </View>
                );

            case 'habits':
                return (
                    <View style={styles.sectionContent}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Horas de sono por noite</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.sleep_hours}
                                onChangeText={(v) => updateField('sleep_hours', v)}
                                placeholder="8"
                                placeholderTextColor="#666"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Fuma?</Text>
                            <Switch
                                value={formData.smoking}
                                onValueChange={(v) => updateField('smoking', v)}
                                trackColor={{ false: '#333', true: Colors.primary }}
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Consome bebidas alcoólicas?</Text>
                            <Switch
                                value={formData.alcohol}
                                onValueChange={(v) => updateField('alcohol', v)}
                                trackColor={{ false: '#333', true: Colors.primary }}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Frequência de exercícios atual</Text>
                            <View style={styles.optionRow}>
                                {['Nunca', '1-2x', '3-4x', '5+'].map((f) => (
                                    <TouchableOpacity
                                        key={f}
                                        style={[
                                            styles.optionButton,
                                            formData.exercise_frequency === f && styles.optionButtonActive,
                                        ]}
                                        onPress={() => updateField('exercise_frequency', f)}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                formData.exercise_frequency === f && styles.optionTextActive,
                                            ]}
                                        >
                                            {f}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>
                                Nível de estresse: {formData.stress_level}/10
                            </Text>
                            <View style={styles.stressRow}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                    <TouchableOpacity
                                        key={n}
                                        style={[
                                            styles.stressButton,
                                            formData.stress_level === n && styles.stressButtonActive,
                                        ]}
                                        onPress={() => updateField('stress_level', n)}
                                    >
                                        <Text
                                            style={[
                                                styles.stressText,
                                                formData.stress_level === n && styles.stressTextActive,
                                            ]}
                                        >
                                            {n}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                );

            case 'goals':
                return (
                    <View style={styles.sectionContent}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Seus objetivos</Text>
                            <View style={styles.chipContainer}>
                                {GOAL_OPTIONS.map((goal) => (
                                    <TouchableOpacity
                                        key={goal}
                                        style={[
                                            styles.chip,
                                            formData.main_goals.includes(goal) && styles.chipActive,
                                        ]}
                                        onPress={() => toggleArrayItem('main_goals', goal)}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                formData.main_goals.includes(goal) && styles.chipTextActive,
                                            ]}
                                        >
                                            {goal}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Peso desejado (kg)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.target_weight}
                                onChangeText={(v) => updateField('target_weight', v)}
                                placeholder="65"
                                placeholderTextColor="#666"
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Horário preferido para treinar</Text>
                            <View style={styles.optionRow}>
                                {['Manhã', 'Tarde', 'Noite'].map((t) => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[
                                            styles.optionButton,
                                            formData.preferred_workout_time === t && styles.optionButtonActive,
                                        ]}
                                        onPress={() => updateField('preferred_workout_time', t)}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                formData.preferred_workout_time === t && styles.optionTextActive,
                                            ]}
                                        >
                                            {t}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                );

            case 'diet':
                return (
                    <View style={styles.sectionContent}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Restrições alimentares</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.dietary_restrictions}
                                onChangeText={(v) => updateField('dietary_restrictions', v)}
                                placeholder="Ex: Vegetariano, Intolerância à lactose..."
                                placeholderTextColor="#666"
                                multiline
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Refeições/dia</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.meals_per_day}
                                    onChangeText={(v) => updateField('meals_per_day', v)}
                                    placeholder="5"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                <Text style={styles.inputLabel}>Água (litros)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.water_intake}
                                    onChangeText={(v) => updateField('water_intake', v)}
                                    placeholder="2"
                                    placeholderTextColor="#666"
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Observações adicionais</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { height: 120 }]}
                                value={formData.notes}
                                onChangeText={(v) => updateField('notes', v)}
                                placeholder="Algo mais que seu treinador deve saber?"
                                placeholderTextColor="#666"
                                multiline
                            />
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Carregando...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader title="Anamnese" showBack />

            {/* Progress Steps */}
            <View style={styles.stepsContainer}>
                {SECTIONS.map((section, index) => (
                    <TouchableOpacity
                        key={section.id}
                        style={[
                            styles.step,
                            index === currentSection && styles.stepActive,
                            index < currentSection && styles.stepCompleted,
                        ]}
                        onPress={() => setCurrentSection(index)}
                    >
                        <Ionicons
                            name={section.icon as any}
                            size={20}
                            color={index <= currentSection ? Colors.primary : '#666'}
                        />
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <AnimatedCard delay={0}>
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>
                            {SECTIONS[currentSection].title}
                        </Text>
                        {renderSection()}
                    </View>
                </AnimatedCard>
            </ScrollView>

            {/* Navigation Buttons */}
            <View style={styles.navigation}>
                {currentSection > 0 && (
                    <TouchableOpacity style={styles.navButton} onPress={prevSection}>
                        <Ionicons name="chevron-back" size={20} color="#fff" />
                        <Text style={styles.navButtonText}>Anterior</Text>
                    </TouchableOpacity>
                )}

                <View style={{ flex: 1 }} />

                {currentSection < SECTIONS.length - 1 ? (
                    <TouchableOpacity style={[styles.navButton, styles.navButtonPrimary]} onPress={nextSection}>
                        <Text style={styles.navButtonTextPrimary}>Próximo</Text>
                        <Ionicons name="chevron-forward" size={20} color="#000" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.finishButtons}>
                        <TouchableOpacity
                            style={[styles.navButton, { marginRight: 8 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            <Text style={styles.navButtonText}>
                                {saving ? 'Salvando...' : 'Salvar'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.navButton, styles.navButtonPrimary]}
                            onPress={handleComplete}
                            disabled={saving}
                        >
                            <Text style={styles.navButtonTextPrimary}>Finalizar</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
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
    stepsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 16,
    },
    step: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepActive: {
        backgroundColor: Colors.primary + '30',
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    stepCompleted: {
        backgroundColor: Colors.primary,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    sectionCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 20,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
    },
    sectionContent: {},
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        color: '#999',
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#222',
        borderRadius: 12,
        padding: 14,
        color: '#fff',
        fontSize: 16,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
    },
    optionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionButton: {
        backgroundColor: '#222',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    optionButtonActive: {
        backgroundColor: Colors.primary,
    },
    optionText: {
        color: '#fff',
        fontSize: 14,
    },
    optionTextActive: {
        color: '#000',
        fontWeight: '600',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        backgroundColor: '#222',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    chipActive: {
        backgroundColor: Colors.primary + '20',
        borderColor: Colors.primary,
    },
    chipText: {
        color: '#999',
        fontSize: 14,
    },
    chipTextActive: {
        color: Colors.primary,
        fontWeight: '500',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#222',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    switchLabel: {
        color: '#fff',
        fontSize: 16,
    },
    stressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    stressButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stressButtonActive: {
        backgroundColor: Colors.primary,
    },
    stressText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    stressTextActive: {
        color: '#000',
    },
    navigation: {
        flexDirection: 'row',
        padding: 16,
        paddingBottom: 24,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    navButtonPrimary: {
        backgroundColor: Colors.primary,
    },
    navButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    navButtonTextPrimary: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
    finishButtons: {
        flexDirection: 'row',
    },
});

// app/physical-assessment.tsx - Avaliações Físicas
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { usePhysicalAssessment } from '@/hooks/usePhysicalAssessment';
import { AppHeader } from '@/components/ui/AppHeader';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Colors from '@/constants/Colors';

const { width } = Dimensions.get('window');

export default function PhysicalAssessmentScreen() {
    const router = useRouter();
    const {
        assessments,
        latestAssessment,
        loading,
        saving,
        saveAssessment,
        getOverallProgress
    } = usePhysicalAssessment();

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        weight: '',
        height: '',
        body_fat_percentage: '',
        chest: '',
        waist: '',
        hip: '',
        left_arm: '',
        right_arm: '',
        left_thigh: '',
        right_thigh: '',
        notes: '',
    });

    const updateField = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.weight) {
            Alert.alert('Erro', 'O peso é obrigatório');
            return;
        }

        try {
            await saveAssessment({
                assessment_date: new Date().toISOString().split('T')[0],
                weight: parseFloat(formData.weight),
                height: formData.height ? parseFloat(formData.height) : undefined,
                body_fat_percentage: formData.body_fat_percentage ? parseFloat(formData.body_fat_percentage) : undefined,
                chest: formData.chest ? parseFloat(formData.chest) : undefined,
                waist: formData.waist ? parseFloat(formData.waist) : undefined,
                hip: formData.hip ? parseFloat(formData.hip) : undefined,
                left_arm: formData.left_arm ? parseFloat(formData.left_arm) : undefined,
                right_arm: formData.right_arm ? parseFloat(formData.right_arm) : undefined,
                left_thigh: formData.left_thigh ? parseFloat(formData.left_thigh) : undefined,
                right_thigh: formData.right_thigh ? parseFloat(formData.right_thigh) : undefined,
                notes: formData.notes || undefined,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Sucesso', 'Avaliação salva com sucesso!');
            setShowForm(false);
            setFormData({
                weight: '',
                height: '',
                body_fat_percentage: '',
                chest: '',
                waist: '',
                hip: '',
                left_arm: '',
                right_arm: '',
                left_thigh: '',
                right_thigh: '',
                notes: '',
            });
        } catch (e: any) {
            Alert.alert('Erro', e.message);
        }
    };

    const progress = getOverallProgress();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getBMICategory = (bmi: number) => {
        if (bmi < 18.5) return { label: 'Abaixo do peso', color: '#3B82F6' };
        if (bmi < 25) return { label: 'Peso normal', color: Colors.success };
        if (bmi < 30) return { label: 'Sobrepeso', color: '#F59E0B' };
        return { label: 'Obesidade', color: '#EF4444' };
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <AppHeader title="Avaliações Físicas" showBack />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Carregando...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader title="Avaliações Físicas" showBack />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Progresso Geral */}
                {progress && (
                    <AnimatedCard delay={0}>
                        <View style={styles.progressCard}>
                            <Text style={styles.progressTitle}>📊 Seu Progresso</Text>
                            <Text style={styles.progressPeriod}>
                                Últimos {progress.periodDays} dias
                            </Text>

                            <View style={styles.progressGrid}>
                                <View style={styles.progressItem}>
                                    <Text style={[
                                        styles.progressValue,
                                        { color: progress.weightChange < 0 ? Colors.success : '#EF4444' }
                                    ]}>
                                        {progress.weightChange > 0 ? '+' : ''}{progress.weightChange} kg
                                    </Text>
                                    <Text style={styles.progressLabel}>Peso</Text>
                                </View>

                                {progress.bodyFatChange !== null && (
                                    <View style={styles.progressItem}>
                                        <Text style={[
                                            styles.progressValue,
                                            { color: progress.bodyFatChange < 0 ? Colors.success : '#EF4444' }
                                        ]}>
                                            {progress.bodyFatChange > 0 ? '+' : ''}{progress.bodyFatChange}%
                                        </Text>
                                        <Text style={styles.progressLabel}>Gordura</Text>
                                    </View>
                                )}

                                {progress.muscleMassChange !== null && (
                                    <View style={styles.progressItem}>
                                        <Text style={[
                                            styles.progressValue,
                                            { color: progress.muscleMassChange > 0 ? Colors.success : '#EF4444' }
                                        ]}>
                                            {progress.muscleMassChange > 0 ? '+' : ''}{progress.muscleMassChange} kg
                                        </Text>
                                        <Text style={styles.progressLabel}>Massa Magra</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </AnimatedCard>
                )}

                {/* Última Avaliação */}
                {latestAssessment && (
                    <AnimatedCard delay={100}>
                        <View style={styles.latestCard}>
                            <View style={styles.latestHeader}>
                                <Text style={styles.latestTitle}>Última Avaliação</Text>
                                <Text style={styles.latestDate}>
                                    {formatDate(latestAssessment.assessment_date)}
                                </Text>
                            </View>

                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{latestAssessment.weight} kg</Text>
                                    <Text style={styles.statLabel}>Peso</Text>
                                </View>

                                {latestAssessment.bmi && (
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{latestAssessment.bmi}</Text>
                                        <Text style={[
                                            styles.statLabel,
                                            { color: getBMICategory(latestAssessment.bmi).color }
                                        ]}>
                                            IMC ({getBMICategory(latestAssessment.bmi).label})
                                        </Text>
                                    </View>
                                )}

                                {latestAssessment.body_fat_percentage && (
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>
                                            {latestAssessment.body_fat_percentage}%
                                        </Text>
                                        <Text style={styles.statLabel}>Gordura</Text>
                                    </View>
                                )}

                                {latestAssessment.waist && (
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>
                                            {latestAssessment.waist} cm
                                        </Text>
                                        <Text style={styles.statLabel}>Cintura</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </AnimatedCard>
                )}

                {/* Formulário de Nova Avaliação */}
                {showForm ? (
                    <AnimatedCard delay={200}>
                        <View style={styles.formCard}>
                            <Text style={styles.formTitle}>Nova Avaliação</Text>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Peso (kg) *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.weight}
                                        onChangeText={(v) => updateField('weight', v)}
                                        placeholder="70.5"
                                        placeholderTextColor="#666"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                    <Text style={styles.inputLabel}>Altura (cm)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.height}
                                        onChangeText={(v) => updateField('height', v)}
                                        placeholder="175"
                                        placeholderTextColor="#666"
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>% Gordura Corporal</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.body_fat_percentage}
                                    onChangeText={(v) => updateField('body_fat_percentage', v)}
                                    placeholder="15.5"
                                    placeholderTextColor="#666"
                                    keyboardType="decimal-pad"
                                />
                            </View>

                            <Text style={styles.sectionLabel}>Circunferências (cm)</Text>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Peitoral</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.chest}
                                        onChangeText={(v) => updateField('chest', v)}
                                        placeholder="100"
                                        placeholderTextColor="#666"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                    <Text style={styles.inputLabel}>Cintura</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.waist}
                                        onChangeText={(v) => updateField('waist', v)}
                                        placeholder="80"
                                        placeholderTextColor="#666"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Quadril</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.hip}
                                        onChangeText={(v) => updateField('hip', v)}
                                        placeholder="95"
                                        placeholderTextColor="#666"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                    <Text style={styles.inputLabel}>Braço E.</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.left_arm}
                                        onChangeText={(v) => updateField('left_arm', v)}
                                        placeholder="35"
                                        placeholderTextColor="#666"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Braço D.</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.right_arm}
                                        onChangeText={(v) => updateField('right_arm', v)}
                                        placeholder="35"
                                        placeholderTextColor="#666"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                    <Text style={styles.inputLabel}>Coxa E.</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.left_thigh}
                                        onChangeText={(v) => updateField('left_thigh', v)}
                                        placeholder="55"
                                        placeholderTextColor="#666"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Observações</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={formData.notes}
                                    onChangeText={(v) => updateField('notes', v)}
                                    placeholder="Notas adicionais..."
                                    placeholderTextColor="#666"
                                    multiline
                                />
                            </View>

                            <View style={styles.formButtons}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setShowForm(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={handleSave}
                                    disabled={saving}
                                >
                                    <Text style={styles.saveButtonText}>
                                        {saving ? 'Salvando...' : 'Salvar'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </AnimatedCard>
                ) : (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setShowForm(true)}
                    >
                        <Ionicons name="add-circle" size={24} color={Colors.primary} />
                        <Text style={styles.addButtonText}>Nova Avaliação</Text>
                    </TouchableOpacity>
                )}

                {/* Histórico */}
                {assessments.length > 1 && (
                    <View style={styles.historySection}>
                        <Text style={styles.historyTitle}>Histórico</Text>
                        {assessments.slice(1).map((assessment, index) => (
                            <View key={assessment.id} style={styles.historyItem}>
                                <View style={styles.historyDate}>
                                    <Text style={styles.historyDateText}>
                                        {formatDate(assessment.assessment_date)}
                                    </Text>
                                </View>
                                <View style={styles.historyStats}>
                                    <Text style={styles.historyStatText}>
                                        {assessment.weight} kg
                                    </Text>
                                    {assessment.body_fat_percentage && (
                                        <Text style={styles.historyStatText}>
                                            {assessment.body_fat_percentage}% gordura
                                        </Text>
                                    )}
                                    {assessment.bmi && (
                                        <Text style={styles.historyStatText}>
                                            IMC: {assessment.bmi}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))}
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
        color: '#fff',
        fontSize: 16,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    progressCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
    },
    progressTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    progressPeriod: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
        marginBottom: 16,
    },
    progressGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    progressItem: {
        alignItems: 'center',
    },
    progressValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    progressLabel: {
        color: '#999',
        fontSize: 12,
        marginTop: 4,
    },
    latestCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
    },
    latestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    latestTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    latestDate: {
        color: '#666',
        fontSize: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    statItem: {
        width: (width - 72) / 2,
        backgroundColor: '#222',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    statValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    statLabel: {
        color: '#999',
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 20,
        gap: 8,
        borderWidth: 2,
        borderColor: Colors.primary + '30',
        borderStyle: 'dashed',
    },
    addButtonText: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    formCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 20,
    },
    formTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        color: '#999',
        fontSize: 12,
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#222',
        borderRadius: 10,
        padding: 12,
        color: '#fff',
        fontSize: 16,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    sectionLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
        marginBottom: 12,
    },
    formButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
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
        fontWeight: '500',
    },
    saveButton: {
        flex: 1,
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
    historySection: {
        marginTop: 20,
    },
    historyTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    historyItem: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyDate: {
        marginRight: 16,
    },
    historyDateText: {
        color: '#999',
        fontSize: 12,
    },
    historyStats: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    historyStatText: {
        color: '#fff',
        fontSize: 14,
    },
});

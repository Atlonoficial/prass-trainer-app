// app/medical-exams.tsx - Exames Médicos
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMedicalExams, MedicalExam } from '@/hooks/useMedicalExams';
import { AppHeader } from '@/components/ui/AppHeader';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Colors from '@/constants/Colors';

const EXAM_TYPES = [
    { id: 'blood_test', label: 'Exame de Sangue', icon: '🩸' },
    { id: 'physical', label: 'Exame Físico', icon: '🩺' },
    { id: 'cardio', label: 'Cardiológico', icon: '❤️' },
    { id: 'imaging', label: 'Imagem', icon: '📷' },
    { id: 'other', label: 'Outro', icon: '📋' },
];

export default function MedicalExamsScreen() {
    const { exams, loading, saving, addExam, deleteExam } = useMedicalExams();

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState<MedicalExam | null>(null);
    const [newExamType, setNewExamType] = useState('');
    const [newExamName, setNewExamName] = useState('');
    const [newExamDate, setNewExamDate] = useState('');
    const [newExamResult, setNewExamResult] = useState('');
    const [newExamNotes, setNewExamNotes] = useState('');

    const handleAddExam = async () => {
        if (!newExamName.trim() || !newExamDate.trim()) {
            Alert.alert('Erro', 'Preencha o nome e a data do exame');
            return;
        }

        try {
            await addExam({
                exam_type: newExamType || 'other',
                exam_name: newExamName.trim(),
                exam_date: newExamDate.trim(),
                result: newExamResult.trim() || undefined,
                notes: newExamNotes.trim() || undefined,
                status: 'normal',
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowAddModal(false);
            resetForm();
            Alert.alert('Sucesso', 'Exame adicionado!');
        } catch (e: any) {
            Alert.alert('Erro', e.message);
        }
    };

    const handleDeleteExam = (exam: MedicalExam) => {
        Alert.alert(
            'Excluir exame?',
            `"${exam.exam_name}" será removido permanentemente.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteExam(exam.id);
                            setSelectedExam(null);
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
        setNewExamType('');
        setNewExamName('');
        setNewExamDate('');
        setNewExamResult('');
        setNewExamNotes('');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getExamIcon = (type: string) => {
        return EXAM_TYPES.find(t => t.id === type)?.icon || '📋';
    };

    // Agrupa exames por ano
    const examsByYear = exams.reduce((acc, exam) => {
        const year = exam.exam_date.substring(0, 4);
        if (!acc[year]) acc[year] = [];
        acc[year].push(exam);
        return acc;
    }, {} as Record<string, MedicalExam[]>);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <AppHeader title="Exames Médicos" showBack />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Carregando...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader title="Exames Médicos" showBack />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Botão Adicionar */}
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddModal(true)}
                >
                    <Ionicons name="add" size={24} color="#000" />
                    <Text style={styles.addButtonText}>Adicionar Exame</Text>
                </TouchableOpacity>

                {/* Lista de Exames */}
                {exams.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={64} color="#333" />
                        <Text style={styles.emptyTitle}>Nenhum exame registrado</Text>
                        <Text style={styles.emptySubtitle}>
                            Adicione seus exames para acompanhamento
                        </Text>
                    </View>
                ) : (
                    Object.entries(examsByYear)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([year, yearExams]) => (
                            <View key={year} style={styles.yearSection}>
                                <Text style={styles.yearTitle}>{year}</Text>
                                {yearExams.map((exam, index) => (
                                    <AnimatedCard key={exam.id} delay={index * 50}>
                                        <TouchableOpacity
                                            style={styles.examCard}
                                            onPress={() => setSelectedExam(exam)}
                                        >
                                            <Text style={styles.examIcon}>{getExamIcon(exam.exam_type)}</Text>
                                            <View style={styles.examInfo}>
                                                <Text style={styles.examName}>{exam.exam_name}</Text>
                                                <Text style={styles.examDate}>
                                                    {formatDate(exam.exam_date)}
                                                </Text>
                                                {exam.result && (
                                                    <View style={styles.resultBadge}>
                                                        <Text style={styles.resultText}>
                                                            {exam.result.length > 30
                                                                ? exam.result.substring(0, 30) + '...'
                                                                : exam.result}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color="#666" />
                                        </TouchableOpacity>
                                    </AnimatedCard>
                                ))}
                            </View>
                        ))
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Modal Adicionar Exame */}
            <Modal visible={showAddModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Novo Exame</Text>
                            <TouchableOpacity onPress={() => {
                                setShowAddModal(false);
                                resetForm();
                            }}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Tipo de Exame</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                            {EXAM_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[
                                        styles.typeChip,
                                        newExamType === type.id && styles.typeChipActive,
                                    ]}
                                    onPress={() => setNewExamType(type.id)}
                                >
                                    <Text style={styles.typeChipIcon}>{type.icon}</Text>
                                    <Text style={[
                                        styles.typeChipText,
                                        newExamType === type.id && styles.typeChipTextActive,
                                    ]}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.inputLabel}>Nome do Exame *</Text>
                        <TextInput
                            style={styles.input}
                            value={newExamName}
                            onChangeText={setNewExamName}
                            placeholder="Ex: Hemograma Completo"
                            placeholderTextColor="#666"
                        />

                        <Text style={styles.inputLabel}>Data *</Text>
                        <TextInput
                            style={styles.input}
                            value={newExamDate}
                            onChangeText={setNewExamDate}
                            placeholder="DD/MM/AAAA"
                            placeholderTextColor="#666"
                        />

                        <Text style={styles.inputLabel}>Resultado</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={newExamResult}
                            onChangeText={setNewExamResult}
                            placeholder="Resultado do exame..."
                            placeholderTextColor="#666"
                            multiline
                        />

                        <Text style={styles.inputLabel}>Observações</Text>
                        <TextInput
                            style={styles.input}
                            value={newExamNotes}
                            onChangeText={setNewExamNotes}
                            placeholder="Notas adicionais..."
                            placeholderTextColor="#666"
                        />

                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.buttonDisabled]}
                            onPress={handleAddExam}
                            disabled={saving}
                        >
                            <Text style={styles.saveButtonText}>
                                {saving ? 'Salvando...' : 'Salvar Exame'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal Detalhes do Exame */}
            <Modal visible={!!selectedExam} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSelectedExam(null)}
                >
                    <View style={styles.detailsContent}>
                        {selectedExam && (
                            <>
                                <Text style={styles.detailsIcon}>{getExamIcon(selectedExam.exam_type)}</Text>
                                <Text style={styles.detailsName}>{selectedExam.exam_name}</Text>
                                <Text style={styles.detailsDate}>{formatDate(selectedExam.exam_date)}</Text>

                                {selectedExam.result && (
                                    <View style={styles.detailsSection}>
                                        <Text style={styles.detailsLabel}>Resultado</Text>
                                        <Text style={styles.detailsValue}>{selectedExam.result}</Text>
                                    </View>
                                )}

                                {selectedExam.notes && (
                                    <View style={styles.detailsSection}>
                                        <Text style={styles.detailsLabel}>Observações</Text>
                                        <Text style={styles.detailsValue}>{selectedExam.notes}</Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDeleteExam(selectedExam)}
                                >
                                    <Ionicons name="trash" size={18} color="#EF4444" />
                                    <Text style={styles.deleteButtonText}>Excluir Exame</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
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
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
        gap: 8,
    },
    addButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
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
    },
    yearSection: {
        marginBottom: 24,
    },
    yearTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    examCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
    },
    examIcon: {
        fontSize: 28,
        marginRight: 14,
    },
    examInfo: {
        flex: 1,
    },
    examName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    examDate: {
        color: '#888',
        fontSize: 12,
        marginTop: 4,
    },
    resultBadge: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.primary + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 8,
    },
    resultText: {
        color: Colors.primary,
        fontSize: 11,
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
        maxHeight: '85%',
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
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    typeScroll: {
        marginBottom: 8,
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
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
        fontSize: 12,
    },
    typeChipTextActive: {
        color: '#000',
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
    detailsContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        margin: 20,
        padding: 24,
        alignItems: 'center',
    },
    detailsIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    detailsName: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
    },
    detailsDate: {
        color: '#888',
        fontSize: 14,
        marginTop: 4,
    },
    detailsSection: {
        width: '100%',
        marginTop: 20,
    },
    detailsLabel: {
        color: '#888',
        fontSize: 12,
        marginBottom: 6,
    },
    detailsValue: {
        color: '#fff',
        fontSize: 14,
        backgroundColor: '#222',
        padding: 12,
        borderRadius: 10,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#EF4444',
        gap: 8,
    },
    deleteButtonText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '500',
    },
});

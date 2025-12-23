// app/editar-perfil.tsx - Tela de Editar Perfil
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Colors from '@/constants/Colors';

export default function EditarPerfilScreen() {
    const { student, updateProfile, loading } = useStudentProfile();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const [fullName, setFullName] = useState(student?.full_name || '');
    const [phone, setPhone] = useState(student?.phone || '');
    const [height, setHeight] = useState(student?.height?.toString() || '');
    const [currentWeight, setCurrentWeight] = useState(student?.current_weight?.toString() || '');
    const [goalWeight, setGoalWeight] = useState(student?.goal_weight?.toString() || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    useEffect(() => {
        if (student) {
            setFullName(student.full_name || '');
            setPhone(student.phone || '');
            setHeight(student.height?.toString() || '');
            setCurrentWeight(student.current_weight?.toString() || '');
            setGoalWeight(student.goal_weight?.toString() || '');
        }
    }, [student]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfile({
                full_name: fullName,
                phone,
                height: height ? parseFloat(height) : undefined,
                current_weight: currentWeight ? parseFloat(currentWeight) : undefined,
                goal_weight: goalWeight ? parseFloat(goalWeight) : undefined,
            });
            Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
            router.back();
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editar Perfil</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    <AnimatedCard style={styles.formCard} delay={100}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nome completo</Text>
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Seu nome"
                                placeholderTextColor={Colors.dark.textSecondary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Telefone</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="(00) 00000-0000"
                                placeholderTextColor={Colors.dark.textSecondary}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Altura (cm)</Text>
                            <TextInput
                                style={styles.input}
                                value={height}
                                onChangeText={setHeight}
                                placeholder="170"
                                placeholderTextColor={Colors.dark.textSecondary}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Peso atual (kg)</Text>
                            <TextInput
                                style={styles.input}
                                value={currentWeight}
                                onChangeText={setCurrentWeight}
                                placeholder="70"
                                placeholderTextColor={Colors.dark.textSecondary}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Meta de peso (kg)</Text>
                            <TextInput
                                style={styles.input}
                                value={goalWeight}
                                onChangeText={setGoalWeight}
                                placeholder="65"
                                placeholderTextColor={Colors.dark.textSecondary}
                                keyboardType="numeric"
                            />
                        </View>
                    </AnimatedCard>

                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <Feather name="check" size={20} color="#000" />
                        <Text style={styles.saveButtonText}>
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </Text>
                    </TouchableOpacity>
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
    formCard: {
        padding: 20,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.dark.backgroundSecondary,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: Colors.dark.text,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F59E0B',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
});

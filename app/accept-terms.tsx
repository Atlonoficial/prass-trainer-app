// app/accept-terms.tsx - Aceitar Termos de Uso
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';

export default function AcceptTermsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [accepting, setAccepting] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    const handleAccept = async () => {
        if (!termsAccepted || !privacyAccepted) {
            Alert.alert('Atenção', 'Você precisa aceitar os termos e a política de privacidade para continuar.');
            return;
        }

        if (!user?.id) {
            Alert.alert('Erro', 'Usuário não autenticado');
            return;
        }

        setAccepting(true);
        try {
            // Atualiza o perfil do estudante com os termos aceitos
            const { error } = await supabase
                .from('students')
                .update({
                    terms_accepted: true,
                    terms_accepted_at: new Date().toISOString(),
                    privacy_accepted: true,
                    privacy_accepted_at: new Date().toISOString(),
                })
                .eq('user_id', user.id);

            if (error) throw error;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(tabs)');
        } catch (e: any) {
            Alert.alert('Erro', e.message);
        } finally {
            setAccepting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="document-text" size={40} color={Colors.primary} />
                </View>
                <Text style={styles.title}>Termos e Condições</Text>
                <Text style={styles.subtitle}>
                    Antes de continuar, leia e aceite nossos termos de uso
                </Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Termos de Uso */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📜 Termos de Uso</Text>
                    <ScrollView style={styles.termsBox} nestedScrollEnabled>
                        <Text style={styles.termsText}>
                            <Text style={styles.termsBold}>1. Aceitação dos Termos{'\n'}</Text>
                            Ao utilizar o aplicativo Prass Trainer, você concorda com estes termos de uso.
                            {'\n\n'}
                            <Text style={styles.termsBold}>2. Uso do Serviço{'\n'}</Text>
                            O aplicativo é destinado exclusivamente para fins de acompanhamento de treinos
                            e nutrição com orientação profissional.
                            {'\n\n'}
                            <Text style={styles.termsBold}>3. Conta do Usuário{'\n'}</Text>
                            Você é responsável por manter a confidencialidade de suas credenciais de acesso.
                            {'\n\n'}
                            <Text style={styles.termsBold}>4. Conteúdo{'\n'}</Text>
                            Os planos de treino e nutrição são personalizados e não devem ser compartilhados.
                            {'\n\n'}
                            <Text style={styles.termsBold}>5. Saúde e Segurança{'\n'}</Text>
                            Consulte sempre um médico antes de iniciar qualquer programa de exercícios.
                            O aplicativo não substitui orientação médica profissional.
                            {'\n\n'}
                            <Text style={styles.termsBold}>6. Modificações{'\n'}</Text>
                            Reservamos o direito de modificar estes termos a qualquer momento.
                        </Text>
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => {
                            setTermsAccepted(!termsAccepted);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    >
                        <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                            {termsAccepted && <Ionicons name="checkmark" size={16} color="#000" />}
                        </View>
                        <Text style={styles.checkboxLabel}>Li e aceito os Termos de Uso</Text>
                    </TouchableOpacity>
                </View>

                {/* Política de Privacidade */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔒 Política de Privacidade</Text>
                    <ScrollView style={styles.termsBox} nestedScrollEnabled>
                        <Text style={styles.termsText}>
                            <Text style={styles.termsBold}>Coleta de Dados{'\n'}</Text>
                            Coletamos informações como nome, email, dados de treino, medidas corporais
                            e fotos de progresso para fornecer nossos serviços.
                            {'\n\n'}
                            <Text style={styles.termsBold}>Uso dos Dados{'\n'}</Text>
                            Seus dados são utilizados para personalizar sua experiência,
                            gerar relatórios de progresso e melhorar nossos serviços.
                            {'\n\n'}
                            <Text style={styles.termsBold}>Compartilhamento{'\n'}</Text>
                            Seus dados são compartilhados apenas com seu treinador designado.
                            Não vendemos ou compartilhamos dados com terceiros.
                            {'\n\n'}
                            <Text style={styles.termsBold}>Segurança{'\n'}</Text>
                            Utilizamos criptografia e práticas de segurança para proteger seus dados.
                            {'\n\n'}
                            <Text style={styles.termsBold}>Seus Direitos{'\n'}</Text>
                            Você pode solicitar a exclusão de seus dados a qualquer momento.
                        </Text>
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => {
                            setPrivacyAccepted(!privacyAccepted);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    >
                        <View style={[styles.checkbox, privacyAccepted && styles.checkboxChecked]}>
                            {privacyAccepted && <Ionicons name="checkmark" size={16} color="#000" />}
                        </View>
                        <Text style={styles.checkboxLabel}>Li e aceito a Política de Privacidade</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Botão Aceitar */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.acceptButton,
                        (!termsAccepted || !privacyAccepted || accepting) && styles.buttonDisabled,
                    ]}
                    onPress={handleAccept}
                    disabled={!termsAccepted || !privacyAccepted || accepting}
                >
                    <Text style={styles.acceptButtonText}>
                        {accepting ? 'Processando...' : 'Aceitar e Continuar'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        color: '#999',
        fontSize: 14,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    termsBox: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        maxHeight: 200,
    },
    termsText: {
        color: '#ccc',
        fontSize: 13,
        lineHeight: 20,
    },
    termsBold: {
        fontWeight: '700',
        color: '#fff',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    checkboxLabel: {
        color: '#fff',
        fontSize: 14,
        flex: 1,
    },
    footer: {
        padding: 20,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    acceptButton: {
        backgroundColor: Colors.primary,
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    acceptButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
});

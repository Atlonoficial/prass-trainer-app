// app/(auth)/register.tsx
import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signUp } = useAuth();

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erro', 'As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Criar conta no Supabase Auth
            const result = await signUp(email.trim(), password, {
                full_name: name.trim(),
                user_type: 'student',
            });

            if (!result || !result.user) {
                throw new Error('Erro ao criar conta');
            }

            const userId = result.user.id;

            if (userId) {
                // 2. Verificar se professor já cadastrou este email
                const { data: existingStudent } = await supabase
                    .from('students')
                    .select('*')
                    .eq('email', email.trim().toLowerCase())
                    .is('user_id', null)
                    .maybeSingle();

                if (existingStudent) {
                    // 3A. Professor já cadastrou - vincular user_id ao registro existente
                    console.log('📎 Vinculando aluno ao registro do professor:', existingStudent.id);
                    await supabase
                        .from('students')
                        .update({ user_id: userId })
                        .eq('id', existingStudent.id);

                    Alert.alert(
                        'Sucesso!',
                        'Conta criada e vinculada ao seu professor. Verifique seu e-mail para confirmar.',
                        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
                    );
                } else {
                    // 3B. Criar novo registro com plano gratuito
                    console.log('🆕 Criando novo aluno com plano gratuito');
                    const { error: insertError } = await supabase
                        .from('students')
                        .insert({
                            user_id: userId,
                            name: name.trim(),
                            email: email.trim().toLowerCase(),
                            active_plan: 'free',
                            membership_status: 'active',
                            mode: 'Online',
                            goals: ['ficar_em_forma']
                        });

                    if (insertError) {
                        console.warn('Aviso ao criar registro de aluno:', insertError);
                        // Não bloquear - o trigger no banco pode ter criado
                    }

                    Alert.alert(
                        'Sucesso!',
                        'Conta criada com sucesso. Verifique seu e-mail para confirmar o cadastro.',
                        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
                    );
                }
            } else {
                Alert.alert(
                    'Sucesso!',
                    'Conta criada com sucesso. Verifique seu e-mail para confirmar o cadastro.',
                    [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
                );
            }
        } catch (error: any) {
            console.error('Erro no cadastro:', error);
            Alert.alert(
                'Erro no cadastro',
                error.message || 'Não foi possível criar a conta. Tente novamente.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>Criar Conta</Text>
                        <Text style={styles.subtitle}>
                            Junte-se ao Prass Trainer e comece sua jornada fitness
                        </Text>
                    </View>

                    {/* Formulário */}
                    <View style={styles.formContainer}>
                        <Text style={styles.label}>Nome completo</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Seu nome"
                            placeholderTextColor={Colors.dark.textSecondary}
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />

                        <Text style={styles.label}>E-mail</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="seu@email.com"
                            placeholderTextColor={Colors.dark.textSecondary}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Text style={styles.label}>Senha</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Mínimo 6 caracteres"
                            placeholderTextColor={Colors.dark.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <Text style={styles.label}>Confirmar senha</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Digite a senha novamente"
                            placeholderTextColor={Colors.dark.textSecondary}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Criar conta</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Link para login */}
                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>Já tem uma conta? </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.loginLink}>Entrar</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    headerContainer: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.dark.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
    },
    formContainer: {
        marginBottom: 32,
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
        padding: 16,
        marginBottom: 16,
        fontSize: 16,
        color: Colors.dark.text,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    button: {
        backgroundColor: Colors.dark.tint,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loginText: {
        color: Colors.dark.textSecondary,
        fontSize: 14,
    },
    loginLink: {
        color: Colors.dark.tint,
        fontSize: 14,
        fontWeight: '600',
    },
});

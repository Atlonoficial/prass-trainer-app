// app/(auth)/login.tsx
import { useState, useRef, useEffect } from 'react';
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
    Animated,
    Image,
    Dimensions,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import Colors from '@/constants/Colors';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuth();

    // Animações
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const logoRotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        setIsLoading(true);
        try {
            await signIn(email.trim(), password);
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Erro no login:', error);
            Alert.alert(
                'Erro no login',
                error.message || 'Verifique suas credenciais e tente novamente.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#0A0A0A', '#111111', '#0A0A0A']}
            style={styles.gradient}
        >
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Logo Oficial - Centralizado no Topo */}
                        <Animated.View
                            style={[
                                styles.logoContainer,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ scale: logoScale }]
                                }
                            ]}
                        >
                            <View style={styles.logoWrapper}>
                                <Image
                                    source={require('../../assets/logo.png')}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>

                            {/* Tagline */}
                            <Text style={styles.tagline}>
                                Transforme sua vida com musculação especializada
                            </Text>
                        </Animated.View>

                        {/* Formulário */}
                        <Animated.View
                            style={[
                                styles.formContainer,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                        >
                            {/* Título */}
                            <Text style={styles.formTitle}>Acesse sua conta</Text>

                            {/* Campo Email */}
                            <View style={styles.inputContainer}>
                                <View style={styles.inputIcon}>
                                    <Feather name="mail" size={20} color={Colors.dark.textSecondary} />
                                </View>
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
                            </View>

                            {/* Campo Senha */}
                            <View style={styles.inputContainer}>
                                <View style={styles.inputIcon}>
                                    <Feather name="lock" size={20} color={Colors.dark.textSecondary} />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Sua senha"
                                    placeholderTextColor={Colors.dark.textSecondary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            <Link href="/(auth)/forgot-password" asChild>
                                <TouchableOpacity style={styles.forgotPassword}>
                                    <Text style={styles.forgotPasswordText}>
                                        Esqueceu a senha?
                                    </Text>
                                </TouchableOpacity>
                            </Link>

                            {/* Botão de Login */}
                            <TouchableOpacity
                                style={[styles.button, isLoading && styles.buttonDisabled]}
                                onPress={handleLogin}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#F59E0B', '#D97706', '#B45309']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.buttonGradient}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Feather name="log-in" size={20} color="#FFFFFF" />
                                            <Text style={styles.buttonText}>Entrar</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Divisor */}
                        <Animated.View style={[styles.dividerContainer, { opacity: fadeAnim }]}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>ou</Text>
                            <View style={styles.dividerLine} />
                        </Animated.View>

                        {/* Link para registro */}
                        <Animated.View
                            style={[
                                styles.registerContainer,
                                { opacity: fadeAnim }
                            ]}
                        >
                            <Text style={styles.registerText}>Não tem uma conta? </Text>
                            <Link href="/(auth)/register" asChild>
                                <TouchableOpacity style={styles.registerButton}>
                                    <Feather name="user-plus" size={16} color={Colors.dark.tint} />
                                    <Text style={styles.registerLink}>Cadastre-se grátis</Text>
                                </TouchableOpacity>
                            </Link>
                        </Animated.View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                Desenvolvido com ❤️ para atletas
                            </Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
        paddingTop: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoWrapper: {
        width: width * 0.65,
        height: width * 0.55,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    tagline: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    formContainer: {
        marginBottom: 24,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.dark.text,
        textAlign: 'center',
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.backgroundSecondary,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: Colors.dark.border,
        overflow: 'hidden',
    },
    inputIcon: {
        paddingLeft: 18,
        paddingRight: 14,
    },
    input: {
        flex: 1,
        paddingVertical: 18,
        paddingRight: 18,
        fontSize: 16,
        color: Colors.dark.text,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: Colors.dark.tint,
        fontSize: 14,
        fontWeight: '600',
    },
    button: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        gap: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.dark.border,
    },
    dividerText: {
        color: Colors.dark.textSecondary,
        fontSize: 13,
        marginHorizontal: 16,
        fontWeight: '500',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    registerText: {
        color: Colors.dark.textSecondary,
        fontSize: 15,
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    registerLink: {
        color: Colors.dark.tint,
        fontSize: 15,
        fontWeight: '700',
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        color: Colors.dark.textSecondary,
        fontSize: 12,
        opacity: 0.7,
    },
});

// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        session: null,
        isLoading: true,
        isAuthenticated: false,
    });

    useEffect(() => {
        // Obter sessão atual
        const getSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                setAuthState({
                    user: session?.user ?? null,
                    session,
                    isLoading: false,
                    isAuthenticated: !!session,
                });
            } catch (error) {
                console.error('Erro ao obter sessão:', error);
                setAuthState(prev => ({ ...prev, isLoading: false }));
            }
        };

        getSession();

        // Listener para mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);
                setAuthState({
                    user: session?.user ?? null,
                    session,
                    isLoading: false,
                    isAuthenticated: !!session,
                });
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    }, []);

    const signUp = useCallback(async (email: string, password: string, metadata?: object) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
            },
        });
        if (error) throw error;
        return data;
    }, []);

    const signOut = useCallback(async () => {
        console.log('🔓 Iniciando signOut...');
        try {
            // 1. PRIMEIRO: Limpar tokens do storage ANTES do signOut
            // Isso garante que mesmo se signOut falhar, o storage está limpo
            try {
                const { Platform } = await import('react-native');
                if (Platform.OS === 'web') {
                    // Limpar localStorage no web
                    const keysToRemove = Object.keys(localStorage).filter(key =>
                        key.includes('supabase') || key.includes('sb-')
                    );
                    keysToRemove.forEach(key => localStorage.removeItem(key));
                    console.log(`🗑️ Limpas ${keysToRemove.length} chaves do localStorage`);
                } else {
                    // Limpar SecureStore no mobile
                    const SecureStore = await import('expo-secure-store');
                    const keysToTry = [
                        'supabase-auth-token',
                        'sb-auth-token',
                        'supabase.auth.token',
                        'sb-vrzmfhwzoeutokzyypwv-auth-token',
                        // Adicionar mais chaves possíveis
                        'supabase.auth.refreshToken',
                        'supabase.auth.accessToken'
                    ];
                    for (const key of keysToTry) {
                        try {
                            await SecureStore.deleteItemAsync(key);
                        } catch (e) {
                            // Ignora se a chave não existir
                        }
                    }
                    console.log('🗑️ SecureStore limpo');
                }
            } catch (storageError) {
                console.warn('⚠️ Erro ao limpar storage:', storageError);
            }

            // 2. Remover canais de realtime ativos
            try {
                const channels = supabase.getChannels();
                for (const channel of channels) {
                    await supabase.removeChannel(channel);
                }
                console.log(`📡 Removidos ${channels.length} canais realtime`);
            } catch (channelError) {
                console.warn('⚠️ Erro ao remover canais:', channelError);
            }

            // 3. Fazer signOut no Supabase com scope LOCAL (mais confiável)
            try {
                const { error } = await supabase.auth.signOut({ scope: 'local' });
                if (error) {
                    console.error('Erro no signOut Supabase:', error);
                }
            } catch (signOutError) {
                console.warn('⚠️ Erro no signOut Supabase:', signOutError);
            }

            // 4. Resetar o estado local
            setAuthState({
                user: null,
                session: null,
                isLoading: false,
                isAuthenticated: false,
            });

            console.log('✅ SignOut completado com sucesso');

            // 5. Forçar reload do app para garantir estado limpo (em produção)
            try {
                const { Platform } = await import('react-native');
                if (Platform.OS !== 'web') {
                    const Updates = await import('expo-updates');
                    if (Updates.reloadAsync) {
                        console.log('🔄 Forçando reload do app...');
                        // Aguardar um pouco para o navegação ter tempo de processar
                        setTimeout(async () => {
                            try {
                                await Updates.reloadAsync();
                            } catch (e) {
                                console.log('⚠️ Reload não disponível em dev');
                            }
                        }, 300);
                    }
                }
            } catch (e) {
                // Expo Updates pode não estar disponível em desenvolvimento
                console.log('⚠️ Expo Updates não disponível');
            }

        } catch (error) {
            console.error('❌ Erro no signOut:', error);
            // Mesmo com erro, garantir estado como deslogado
            setAuthState({
                user: null,
                session: null,
                isLoading: false,
                isAuthenticated: false,
            });
        }
    }, []);

    const resetPassword = useCallback(async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
    }, []);

    return {
        ...authState,
        signIn,
        signUp,
        signOut,
        resetPassword,
    };
}

export default useAuth;

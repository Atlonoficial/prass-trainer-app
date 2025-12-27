// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';

interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
    signIn: (email: string, password: string) => Promise<any>;
    signUp: (email: string, password: string, metadata?: object) => Promise<any>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
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
                console.log('🔐 Auth state changed:', event, session ? 'com sessão' : 'sem sessão');
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
        console.log('🔓 Iniciando signOut no AuthContext...');
        try {
            // 1. Limpar tokens do storage ANTES do signOut
            try {
                if (Platform.OS === 'web') {
                    const keysToRemove = Object.keys(localStorage).filter(key =>
                        key.includes('supabase') || key.includes('sb-')
                    );
                    keysToRemove.forEach(key => localStorage.removeItem(key));
                    console.log(`🗑️ Limpas ${keysToRemove.length} chaves do localStorage`);
                } else {
                    const SecureStore = await import('expo-secure-store');
                    const keysToTry = [
                        'supabase-auth-token',
                        'sb-auth-token',
                        'supabase.auth.token',
                        'sb-vrzmfhwzoeutokzyypwv-auth-token',
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

            // 2. Remover canais de realtime
            try {
                const channels = supabase.getChannels();
                for (const channel of channels) {
                    await supabase.removeChannel(channel);
                }
                console.log(`📡 Removidos ${channels.length} canais realtime`);
            } catch (e) {
                console.warn('⚠️ Erro ao remover canais:', e);
            }

            // 3. Fazer signOut no Supabase
            try {
                await supabase.auth.signOut({ scope: 'local' });
            } catch (e) {
                console.warn('⚠️ Erro no signOut:', e);
            }

            // 4. FORÇAR o estado como deslogado IMEDIATAMENTE
            console.log('🔄 Forçando estado como deslogado...');
            setAuthState({
                user: null,
                session: null,
                isLoading: false,
                isAuthenticated: false,
            });

            console.log('✅ SignOut completado com sucesso');
        } catch (error) {
            console.error('❌ Erro no signOut:', error);
            // Mesmo com erro, forçar estado como deslogado
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

    const value: AuthContextType = {
        ...authState,
        signIn,
        signUp,
        signOut,
        resetPassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default useAuth;

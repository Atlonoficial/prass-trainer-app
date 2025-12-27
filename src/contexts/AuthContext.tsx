// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

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

        // 1. FORÇAR o estado como deslogado IMEDIATAMENTE (antes de tudo!)
        console.log('🔄 Forçando estado como deslogado...');
        setAuthState({
            user: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
        });

        // 2. Usar a função centralizada de limpeza do storage
        const { clearAuthStorage } = await import('@/lib/supabase');
        await clearAuthStorage();

        // 3. Remover canais de realtime
        try {
            const channels = supabase.getChannels();
            for (const channel of channels) {
                await supabase.removeChannel(channel);
            }
            console.log(`📡 Removidos ${channels.length} canais realtime`);
        } catch (e) {
            console.warn('⚠️ Erro ao remover canais:', e);
        }

        // 4. Fazer signOut no Supabase (pode falhar, mas o storage já foi limpo)
        try {
            await supabase.auth.signOut({ scope: 'local' });
            console.log('✅ SignOut Supabase completado');
        } catch (e) {
            console.warn('⚠️ Erro no signOut Supabase (ignorando):', e);
        }

        console.log('✅ SignOut completado com sucesso');
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

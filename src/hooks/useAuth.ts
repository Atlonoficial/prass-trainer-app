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
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
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

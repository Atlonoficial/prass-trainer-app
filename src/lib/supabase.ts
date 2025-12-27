// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// A chave de armazenamento que o Supabase usa (derivada do URL do projeto)
const SUPABASE_AUTH_KEY = 'sb-vrzmfhwzoeutokzyypwv-auth-token';

// Armazenamento seguro para tokens
const ExpoSecureStoreAdapter = {
    getItem: async (key: string): Promise<string | null> => {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
            return;
        }
        await SecureStore.setItemAsync(key, value);
    },
    removeItem: async (key: string): Promise<void> => {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }
        await SecureStore.deleteItemAsync(key);
    },
};

// Credenciais do Supabase
const supabaseUrl = 'https://vrzmfhwzoeutokzyypwv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyem1maHd6b2V1dG9renl5cHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjI3OTQsImV4cCI6MjA4MDc5ODc5NH0.L78vTTlLx4mqcx4qzc3wbfUUprrWb9BFkX2yUbAJ5Ro';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Função para limpar completamente o storage de autenticação
export const clearAuthStorage = async (): Promise<void> => {
    console.log('🗑️ Limpando storage de autenticação...');
    try {
        if (Platform.OS === 'web') {
            // Limpar todas as chaves relacionadas ao Supabase no localStorage
            const keysToRemove = Object.keys(localStorage).filter(key =>
                key.includes('supabase') || key.includes('sb-')
            );
            keysToRemove.forEach(key => {
                console.log(`  Removendo: ${key}`);
                localStorage.removeItem(key);
            });
            console.log(`🗑️ Removidas ${keysToRemove.length} chaves do localStorage`);
        } else {
            // Limpar SecureStore no mobile
            try {
                await SecureStore.deleteItemAsync(SUPABASE_AUTH_KEY);
                console.log(`🗑️ Removida chave: ${SUPABASE_AUTH_KEY}`);
            } catch (e) {
                console.log(`⚠️ Chave não encontrada: ${SUPABASE_AUTH_KEY}`);
            }

            // Tentar limpar outras chaves possíveis
            const extraKeys = [
                'supabase-auth-token',
                'supabase.auth.token',
                'sb-auth-token'
            ];
            for (const key of extraKeys) {
                try {
                    await SecureStore.deleteItemAsync(key);
                    console.log(`🗑️ Removida chave extra: ${key}`);
                } catch (e) {
                    // Ignora se não existir
                }
            }
        }
        console.log('✅ Storage de autenticação limpo!');
    } catch (error) {
        console.error('❌ Erro ao limpar storage:', error);
    }
};

export default supabase;


// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/contexts/AuthContext';

// Manter splash screen visível enquanto carrega
SplashScreen.preventAutoHideAsync();

// Criar cliente React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutos
            gcTime: 1000 * 60 * 30, // 30 minutos
            retry: 2,
        },
    },
});

export default function RootLayout() {
    const colorScheme = useColorScheme();

    useEffect(() => {
        // Esconder splash screen após inicialização
        const hideSplash = async () => {
            await SplashScreen.hideAsync();
        };
        hideSplash();
    }, []);

    return (
        <AuthProvider>
            <QueryClientProvider client={queryClient}>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        animation: 'slide_from_right',
                    }}
                >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                </Stack>
            </QueryClientProvider>
        </AuthProvider>
    );
}


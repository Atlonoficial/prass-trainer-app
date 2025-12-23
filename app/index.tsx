// app/index.tsx
import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import Colors from '@/constants/Colors';

export default function Index() {
    const { isLoading, isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                router.replace('/(tabs)');
            } else {
                router.replace('/(auth)/login');
            }
        }
    }, [isLoading, isAuthenticated]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={Colors.dark.tint} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.dark.background,
    },
});

// src/components/ui/GradientCard.tsx
import { useRef, useEffect } from 'react';
import { Animated, StyleSheet, View, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';

interface GradientCardProps {
    children: React.ReactNode;
    colors?: [string, string, ...string[]];
    style?: ViewStyle;
    delay?: number;
    onPress?: () => void;
}

export function GradientCard({
    children,
    colors = ['#F59E0B', '#D97706'] as [string, string],
    style,
    delay = 0,
    onPress
}: GradientCardProps) {
    const translateY = useRef(new Animated.Value(30)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 500,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 400,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [delay]);

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const CardContent = (
        <Animated.View
            style={[
                styles.cardContainer,
                style,
                {
                    transform: [{ translateY }, { scale }],
                    opacity,
                },
            ]}
        >
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {children}
            </LinearGradient>
        </Animated.View>
    );

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                {CardContent}
            </Pressable>
        );
    }

    return CardContent;
}

const styles = StyleSheet.create({
    cardContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    gradient: {
        padding: 16,
        borderRadius: 20,
    },
});

export default GradientCard;

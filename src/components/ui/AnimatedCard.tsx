// src/components/ui/AnimatedCard.tsx
import { useRef, useEffect } from 'react';
import { Animated, StyleSheet, ViewStyle, Pressable, StyleProp } from 'react-native';
import Colors from '@/constants/Colors';

interface AnimatedCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    delay?: number;
    onPress?: () => void;
}

export function AnimatedCard({ children, style, delay = 0, onPress }: AnimatedCardProps) {
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
                styles.card,
                style,
                {
                    transform: [{ translateY }, { scale }],
                    opacity,
                },
            ]}
        >
            {children}
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
    card: {
        backgroundColor: Colors.dark.backgroundSecondary,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        // Sombra para efeito flutuante
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
});

export default AnimatedCard;

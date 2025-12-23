// src/components/ui/AppHeader.tsx - Header reutilizável com logo
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

interface AppHeaderProps {
    title?: string;
    subtitle?: string;
    showLogo?: boolean;
    showBack?: boolean;
    rightElement?: React.ReactNode;
}

export function AppHeader({ title, subtitle, showLogo = false, showBack = false, rightElement }: AppHeaderProps) {
    const router = useRouter();

    // Se showBack está habilitado, usa layout horizontal
    if (showBack || rightElement) {
        return (
            <View style={styles.horizontalContainer}>
                {showBack ? (
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.placeholder} />
                )}

                <View style={styles.centerContent}>
                    {showLogo && (
                        <Image
                            source={require('../../../assets/logo.png')}
                            style={styles.smallLogo}
                            resizeMode="contain"
                        />
                    )}
                    {title && <Text style={styles.horizontalTitle}>{title}</Text>}
                </View>

                {rightElement ? (
                    <View style={styles.rightElement}>{rightElement}</View>
                ) : (
                    <View style={styles.placeholder} />
                )}
            </View>
        );
    }

    // Layout centralizado tradicional
    return (
        <View style={styles.container}>
            {showLogo && (
                <View style={styles.logoWrapper}>
                    <Image
                        source={require('../../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
            )}
            {title && (
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingTop: 8,
    },
    horizontalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholder: {
        width: 40,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
    },
    smallLogo: {
        width: 100,
        height: 35,
    },
    horizontalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    rightElement: {
        minWidth: 40,
        alignItems: 'flex-end',
    },
    logoWrapper: {
        marginBottom: 8,
    },
    logo: {
        width: 140,
        height: 50,
    },
    textContainer: {
        alignItems: 'center',
        marginTop: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
    },
    subtitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#F59E0B',
        marginTop: 4,
    },
});

export default AppHeader;

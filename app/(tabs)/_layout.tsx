// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.dark.tint,
                tabBarInactiveTintColor: Colors.dark.tabIconDefault,
                tabBarStyle: {
                    backgroundColor: Colors.dark.backgroundSecondary,
                    borderTopColor: Colors.dark.border,
                    borderTopWidth: 1,
                    height: 70,
                    paddingBottom: 12,
                    paddingTop: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 4,
                },
                headerStyle: {
                    backgroundColor: Colors.dark.background,
                    shadowColor: 'transparent',
                    elevation: 0,
                },
                headerTintColor: Colors.dark.text,
                headerTitleStyle: {
                    fontWeight: '700',
                    fontSize: 18,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Início',
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIconContainer : undefined}>
                            <Feather name="home" size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="workouts"
                options={{
                    title: 'Treinos',
                    headerTitle: 'Meus Treinos',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIconContainer : undefined}>
                            <Feather name="activity" size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="nutrition"
                options={{
                    title: 'Dieta',
                    headerTitle: 'Dieta',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIconContainer : undefined}>
                            <Feather name="heart" size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="progress"
                options={{
                    title: 'Membros',
                    headerTitle: 'Membros',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIconContainer : undefined}>
                            <Feather name="users" size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    headerTitle: 'Meu Perfil',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIconContainer : undefined}>
                            <Feather name="user" size={22} color={color} />
                        </View>
                    ),
                }}
            />
            {/* Chat oculto da tab bar - acessível via botões */}
            <Tabs.Screen
                name="chat"
                options={{
                    href: null,
                    headerShown: false,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    activeIconContainer: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderRadius: 10,
        padding: 6,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
});

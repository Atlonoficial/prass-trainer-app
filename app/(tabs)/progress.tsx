// app/(tabs)/progress.tsx - Tela de Membros/Cursos com dados reais
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useCourses, Course } from '@/hooks/useCourses';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { AppHeader } from '@/components/ui/AppHeader';
import Colors from '@/constants/Colors';

function CourseCard({ course, delay, hasAccess }: { course: Course; delay: number; hasAccess: boolean }) {
    return (
        <AnimatedCard style={styles.courseCard} delay={delay} onPress={() => { }}>
            <View style={styles.courseImageContainer}>
                {course.thumbnail ? (
                    <Image source={{ uri: course.thumbnail }} style={styles.courseThumbnail} />
                ) : (
                    <View style={styles.courseImagePlaceholder}>
                        <Feather name="play-circle" size={40} color="rgba(255,255,255,0.8)" />
                    </View>
                )}
                <View style={styles.courseBadge}>
                    <Text style={styles.courseBadgeText}>Curso</Text>
                </View>
                <TouchableOpacity style={styles.playButton}>
                    <Feather name="play" size={20} color="#000" />
                </TouchableOpacity>
            </View>
            <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseSubtitle} numberOfLines={2}>
                    {course.description || 'Curso completo'}
                </Text>
                <View style={styles.statusBadge}>
                    <View style={[styles.statusDot, { backgroundColor: hasAccess ? '#22C55E' : '#F59E0B' }]} />
                    <Text style={[styles.statusText, { color: hasAccess ? '#22C55E' : '#F59E0B' }]}>
                        {hasAccess ? 'Disponível' : 'Em breve'}
                    </Text>
                </View>
            </View>
        </AnimatedCard>
    );
}

export default function MembersScreen() {
    const { courses, loading, hasAccess } = useCourses();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.loadingText}>Carregando cursos...</Text>
            </View>
        );
    }

    const hasCourses = courses.length > 0;

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header com Logo */}
                <AppHeader title="Bem-vindo à" subtitle="Área de Membros" />

                {/* Cursos Disponíveis */}
                {hasCourses ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Cursos Disponíveis</Text>
                        {courses.map((course, index) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                delay={100 + index * 100}
                                hasAccess={hasAccess(course)}
                            />
                        ))}
                    </View>
                ) : (
                    <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
                        <View style={styles.emptyIconContainer}>
                            <Feather name="book-open" size={48} color="#F59E0B" />
                        </View>
                        <Text style={styles.emptyTitle}>Nenhum curso disponível</Text>
                        <Text style={styles.emptyDescription}>
                            Novos cursos serão adicionados em breve. Fique atento às novidades!
                        </Text>
                    </Animated.View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: Colors.dark.textSecondary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingTop: 16,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    headerLogo: {
        width: 160,
        height: 70,
    },
    welcomeContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
    },
    welcomeSubtitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#F59E0B',
        marginTop: 4,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 16,
    },
    courseCard: {
        marginBottom: 16,
        padding: 0,
        overflow: 'hidden',
    },
    courseImageContainer: {
        height: 160,
        backgroundColor: '#1F1F1F',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    courseThumbnail: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    courseImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#252525',
    },
    courseBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#F59E0B',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
    },
    courseBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#000',
    },
    playButton: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    courseInfo: {
        padding: 16,
    },
    courseTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 4,
    },
    courseSubtitle: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 32,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 15,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
});

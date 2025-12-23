// app/courses.tsx - Cursos e Aulas (simplificado)
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCourses, Course } from '@/hooks/useCourses';
import { AppHeader } from '@/components/ui/AppHeader';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Colors from '@/constants/Colors';

export default function CoursesScreen() {
    const { courses, loading, error, hasAccess } = useCourses();
    const [refreshing, setRefreshing] = useState(false);
    const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const handleCoursePress = (course: Course) => {
        setExpandedCourse(expandedCourse === course.id ? null : course.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const getModulesCount = (course: Course): number => {
        if (!course.modules) return 0;
        if (Array.isArray(course.modules)) return course.modules.length;
        if (typeof course.modules === 'object') return Object.keys(course.modules).length;
        return 0;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <AppHeader title="Cursos" showBack />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Carregando cursos...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader title="Cursos" showBack />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
            >
                {courses.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="school-outline" size={64} color="#333" />
                        <Text style={styles.emptyTitle}>Nenhum curso disponível</Text>
                        <Text style={styles.emptySubtitle}>
                            Novos cursos serão disponibilizados em breve!
                        </Text>
                    </View>
                ) : (
                    courses.map((course, index) => {
                        const isExpanded = expandedCourse === course.id;
                        const modulesCount = getModulesCount(course);
                        const canAccess = hasAccess(course);

                        return (
                            <AnimatedCard key={course.id} delay={index * 100}>
                                <TouchableOpacity
                                    style={styles.courseCard}
                                    onPress={() => handleCoursePress(course)}
                                    activeOpacity={0.8}
                                >
                                    {/* Thumbnail */}
                                    {course.thumbnail ? (
                                        <Image
                                            source={{ uri: course.thumbnail }}
                                            style={styles.courseThumbnail}
                                        />
                                    ) : (
                                        <View style={[styles.courseThumbnail, styles.thumbnailPlaceholder]}>
                                            <Ionicons name="school" size={40} color={Colors.primary} />
                                        </View>
                                    )}

                                    {/* Course Info */}
                                    <View style={styles.courseInfo}>
                                        <View style={styles.courseHeader}>
                                            <Text style={styles.courseTitle} numberOfLines={2}>
                                                {course.title}
                                            </Text>
                                            {!canAccess && (
                                                <View style={styles.premiumBadge}>
                                                    <Ionicons name="lock-closed" size={12} color="#000" />
                                                    <Text style={styles.premiumText}>Premium</Text>
                                                </View>
                                            )}
                                        </View>

                                        <Text style={styles.courseDescription} numberOfLines={isExpanded ? 10 : 2}>
                                            {course.description}
                                        </Text>

                                        <View style={styles.courseStats}>
                                            {modulesCount > 0 && (
                                                <View style={styles.statBadge}>
                                                    <Ionicons name="layers" size={14} color="#999" />
                                                    <Text style={styles.statText}>
                                                        {modulesCount} módulos
                                                    </Text>
                                                </View>
                                            )}
                                            {course.duration && (
                                                <View style={styles.statBadge}>
                                                    <Ionicons name="time" size={14} color="#999" />
                                                    <Text style={styles.statText}>
                                                        {course.duration} min
                                                    </Text>
                                                </View>
                                            )}
                                            {course.category && (
                                                <View style={styles.categoryBadge}>
                                                    <Text style={styles.categoryText}>{course.category}</Text>
                                                </View>
                                            )}
                                        </View>

                                        {isExpanded && canAccess && (
                                            <TouchableOpacity style={styles.startButton}>
                                                <Ionicons name="play" size={18} color="#000" />
                                                <Text style={styles.startButtonText}>Iniciar Curso</Text>
                                            </TouchableOpacity>
                                        )}

                                        {isExpanded && !canAccess && (
                                            <View style={styles.lockedMessage}>
                                                <Ionicons name="lock-closed" size={16} color={Colors.warning} />
                                                <Text style={styles.lockedText}>
                                                    Este curso requer assinatura premium
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            </AnimatedCard>
                        );
                    })
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#999',
        marginTop: 12,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtitle: {
        color: '#666',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    courseCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
    },
    courseThumbnail: {
        width: '100%',
        height: 140,
    },
    thumbnailPlaceholder: {
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    courseInfo: {
        padding: 16,
    },
    courseHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    courseTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        marginRight: 10,
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    premiumText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '600',
    },
    courseDescription: {
        color: '#888',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    courseStats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        color: '#999',
        fontSize: 12,
    },
    categoryBadge: {
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        color: '#aaa',
        fontSize: 11,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        marginTop: 16,
        gap: 8,
    },
    startButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
    lockedMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.warning + '15',
        borderRadius: 10,
        padding: 12,
        marginTop: 16,
        gap: 8,
    },
    lockedText: {
        color: Colors.warning,
        fontSize: 12,
        flex: 1,
    },
});

// app/photos-progress.tsx - Fotos de Progresso
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useProgressPhotos, ProgressPhoto } from '@/hooks/useProgressPhotos';
import { AppHeader } from '@/components/ui/AppHeader';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import Colors from '@/constants/Colors';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48) / 3;

const PHOTO_TYPES = [
    { id: 'front', label: 'Frente', icon: 'body' },
    { id: 'side', label: 'Lateral', icon: 'person' },
    { id: 'back', label: 'Costas', icon: 'body-outline' },
];

export default function PhotosProgressScreen() {
    const {
        photos,
        photosByMonth,
        loading,
        uploading,
        pickImage,
        takePhoto,
        uploadPhoto,
        deletePhoto
    } = useProgressPhotos();

    const [selectedType, setSelectedType] = useState<ProgressPhoto['photo_type']>('front');
    const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);

    const handleAddPhoto = async (useCamera: boolean) => {
        try {
            const uri = useCamera ? await takePhoto() : await pickImage();
            if (!uri) return;

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            await uploadPhoto(uri, selectedType, {
                isPrivate: true,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Sucesso', 'Foto adicionada!');
        } catch (e: any) {
            Alert.alert('Erro', e.message);
        }
    };

    const handleDeletePhoto = (photo: ProgressPhoto) => {
        Alert.alert(
            'Excluir foto?',
            'Esta ação não pode ser desfeita.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deletePhoto(photo.id);
                            setSelectedPhoto(null);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (e: any) {
                            Alert.alert('Erro', e.message);
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatMonth = (monthKey: string) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <AppHeader title="Fotos de Progresso" showBack />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Carregando fotos...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader title="Fotos de Progresso" showBack />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Tipo de Foto */}
                <View style={styles.typeSelector}>
                    {PHOTO_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            style={[
                                styles.typeButton,
                                selectedType === type.id && styles.typeButtonActive,
                            ]}
                            onPress={() => setSelectedType(type.id as any)}
                        >
                            <Ionicons
                                name={type.icon as any}
                                size={20}
                                color={selectedType === type.id ? '#000' : '#fff'}
                            />
                            <Text style={[
                                styles.typeLabel,
                                selectedType === type.id && styles.typeLabelActive,
                            ]}>
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Adicionar Foto */}
                <AnimatedCard delay={0}>
                    <View style={styles.addSection}>
                        <Text style={styles.addTitle}>Adicionar Foto</Text>
                        <View style={styles.addButtons}>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => handleAddPhoto(true)}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                ) : (
                                    <>
                                        <Ionicons name="camera" size={28} color={Colors.primary} />
                                        <Text style={styles.addButtonText}>Câmera</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => handleAddPhoto(false)}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                ) : (
                                    <>
                                        <Ionicons name="images" size={28} color={Colors.primary} />
                                        <Text style={styles.addButtonText}>Galeria</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </AnimatedCard>

                {/* Fotos por Mês */}
                {Object.keys(photosByMonth).length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="camera-outline" size={64} color="#333" />
                        <Text style={styles.emptyTitle}>Nenhuma foto ainda</Text>
                        <Text style={styles.emptySubtitle}>
                            Tire fotos periódicas para acompanhar sua evolução
                        </Text>
                    </View>
                ) : (
                    Object.entries(photosByMonth)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([month, monthPhotos]) => (
                            <View key={month} style={styles.monthSection}>
                                <Text style={styles.monthTitle}>{formatMonth(month)}</Text>
                                <View style={styles.photoGrid}>
                                    {monthPhotos.map((photo) => (
                                        <TouchableOpacity
                                            key={photo.id}
                                            style={styles.photoCard}
                                            onPress={() => setSelectedPhoto(photo)}
                                        >
                                            <Image
                                                source={{ uri: photo.photo_url }}
                                                style={styles.photoImage}
                                            />
                                            <View style={styles.photoOverlay}>
                                                <View style={styles.photoTypeBadge}>
                                                    <Text style={styles.photoTypeBadgeText}>
                                                        {photo.photo_type}
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Modal de Foto Selecionada */}
            {selectedPhoto && (
                <TouchableOpacity
                    style={styles.photoModal}
                    activeOpacity={1}
                    onPress={() => setSelectedPhoto(null)}
                >
                    <View style={styles.photoModalContent}>
                        <Image
                            source={{ uri: selectedPhoto.photo_url }}
                            style={styles.photoModalImage}
                            resizeMode="contain"
                        />
                        <View style={styles.photoModalInfo}>
                            <Text style={styles.photoModalDate}>
                                {formatDate(selectedPhoto.taken_at)}
                            </Text>
                            {selectedPhoto.weight && (
                                <Text style={styles.photoModalWeight}>
                                    Peso: {selectedPhoto.weight} kg
                                </Text>
                            )}
                            {selectedPhoto.caption && (
                                <Text style={styles.photoModalCaption}>
                                    {selectedPhoto.caption}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeletePhoto(selectedPhoto)}
                        >
                            <Ionicons name="trash" size={20} color="#EF4444" />
                            <Text style={styles.deleteButtonText}>Excluir</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            )}
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
    typeSelector: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        paddingVertical: 12,
        gap: 6,
    },
    typeButtonActive: {
        backgroundColor: Colors.primary,
    },
    typeLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    typeLabelActive: {
        color: '#000',
    },
    addSection: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    addTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    addButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    addButton: {
        flex: 1,
        backgroundColor: '#222',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
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
        textAlign: 'center',
        marginTop: 8,
    },
    monthSection: {
        marginBottom: 24,
    },
    monthTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'capitalize',
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    photoCard: {
        width: PHOTO_SIZE,
        height: PHOTO_SIZE * 1.3,
        borderRadius: 12,
        overflow: 'hidden',
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    photoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    photoTypeBadge: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    photoTypeBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    photoModal: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    photoModalContent: {
        width: '100%',
        alignItems: 'center',
    },
    photoModalImage: {
        width: '100%',
        height: width * 1.3,
        borderRadius: 16,
    },
    photoModalInfo: {
        marginTop: 20,
        alignItems: 'center',
    },
    photoModalDate: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    photoModalWeight: {
        color: Colors.primary,
        fontSize: 14,
        marginTop: 4,
    },
    photoModalCaption: {
        color: '#999',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 30,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#EF4444',
        gap: 8,
    },
    deleteButtonText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '500',
    },
});

// src/hooks/useProgressPhotos.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export interface ProgressPhoto {
    id: string;
    student_id: string;
    photo_url: string;
    photo_type: 'front' | 'side' | 'back' | 'other';
    caption?: string;
    weight?: number;
    is_private: boolean;
    taken_at: string;
    created_at: string;
}

export function useProgressPhotos() {
    const { user } = useAuth();
    const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) {
            setPhotos([]);
            setLoading(false);
            return;
        }

        const fetchPhotos = async () => {
            setLoading(true);
            try {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (!studentData?.id) {
                    setLoading(false);
                    return;
                }

                const { data, error: fetchError } = await supabase
                    .from('progress_photos')
                    .select('*')
                    .eq('student_id', studentData.id)
                    .order('taken_at', { ascending: false });

                if (fetchError) throw fetchError;
                setPhotos(data || []);
            } catch (e: any) {
                console.error('Error fetching progress photos:', e);
                setError(e?.message || 'Erro ao carregar fotos');
            } finally {
                setLoading(false);
            }
        };

        fetchPhotos();
    }, [user?.id]);

    // Pede permissão e seleciona foto
    const pickImage = useCallback(async (): Promise<string | null> => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Permissão para acessar fotos necessária');
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                return result.assets[0].uri;
            }
            return null;
        } catch (e: any) {
            console.error('Error picking image:', e);
            throw e;
        }
    }, []);

    // Tira foto com a câmera
    const takePhoto = useCallback(async (): Promise<string | null> => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Permissão para usar câmera necessária');
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                return result.assets[0].uri;
            }
            return null;
        } catch (e: any) {
            console.error('Error taking photo:', e);
            throw e;
        }
    }, []);

    // Upload da foto para o Supabase Storage
    const uploadPhoto = useCallback(
        async (
            imageUri: string,
            photoType: ProgressPhoto['photo_type'],
            options?: {
                caption?: string;
                weight?: number;
                isPrivate?: boolean;
            }
        ): Promise<ProgressPhoto> => {
            if (!user?.id) throw new Error('User not authenticated');
            setUploading(true);

            try {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (!studentData) {
                    throw new Error('Student not found');
                }

                // Lê o arquivo como base64
                const base64 = await FileSystem.readAsStringAsync(imageUri, {
                    encoding: 'base64',
                });

                // Gera nome único para o arquivo
                const fileName = `${studentData.id}/${Date.now()}_${photoType}.jpg`;

                // Faz upload para o Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from('progress-photos')
                    .upload(fileName, Buffer.from(base64, 'base64'), {
                        contentType: 'image/jpeg',
                        upsert: false,
                    });

                if (uploadError) throw uploadError;

                // Obtém URL pública
                const { data: urlData } = supabase.storage
                    .from('progress-photos')
                    .getPublicUrl(fileName);

                // Salva registro no banco
                const { data: photoRecord, error: insertError } = await supabase
                    .from('progress_photos')
                    .insert({
                        student_id: studentData.id,
                        photo_url: urlData.publicUrl,
                        photo_type: photoType,
                        caption: options?.caption,
                        weight: options?.weight,
                        is_private: options?.isPrivate ?? true,
                        taken_at: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                setPhotos((prev) => [photoRecord, ...prev]);
                return photoRecord;
            } catch (e: any) {
                console.error('Error uploading photo:', e);
                throw e;
            } finally {
                setUploading(false);
            }
        },
        [user?.id]
    );

    // Deleta uma foto
    const deletePhoto = useCallback(async (photoId: string) => {
        try {
            const photo = photos.find((p) => p.id === photoId);
            if (!photo) throw new Error('Foto não encontrada');

            // Extrai o path do arquivo da URL
            const urlParts = photo.photo_url.split('/');
            const filePath = urlParts.slice(-2).join('/');

            // Remove do Storage
            await supabase.storage.from('progress-photos').remove([filePath]);

            // Remove do banco
            const { error: deleteError } = await supabase
                .from('progress_photos')
                .delete()
                .eq('id', photoId);

            if (deleteError) throw deleteError;

            setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        } catch (e: any) {
            console.error('Error deleting photo:', e);
            throw e;
        }
    }, [photos]);

    // Agrupa fotos por mês
    const photosByMonth = photos.reduce((acc, photo) => {
        const month = photo.taken_at.substring(0, 7); // YYYY-MM
        if (!acc[month]) acc[month] = [];
        acc[month].push(photo);
        return acc;
    }, {} as Record<string, ProgressPhoto[]>);

    return {
        photos,
        photosByMonth,
        loading,
        uploading,
        error,
        pickImage,
        takePhoto,
        uploadPhoto,
        deletePhoto,
    };
}

export default useProgressPhotos;

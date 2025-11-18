// lib/supabaseStorage.ts
import { supabase } from "./supabaseClient";

export interface UploadPhotoResult {
  success: boolean;
  photoUrl?: string;
  error?: string;
}

/**
 * Upload une photo vers Supabase Storage et retourne l'URL publique
 * @param file - Le fichier image à uploader
 * @param userId - L'ID de l'utilisateur
 * @returns URL publique de la photo ou erreur
 */
export async function uploadPhotoToStorage(
  file: File,
  userId: string
): Promise<UploadPhotoResult> {
  try {
    // Valider que c'est une image
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "Le fichier doit être une image" };
    }

    // Limite de taille : 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: "L'image doit faire moins de 5MB",
      };
    }

    // Créer un nom de fichier unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split(".").pop();
    const fileName = `${userId}/${timestamp}-${randomString}.${fileExtension}`;

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from("avatars") // Nom du bucket
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Erreur upload:", error);
      return { success: false, error: error.message };
    }

    // Générer l'URL publique
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(data.path);

    return { success: true, photoUrl: publicUrl };
  } catch (err: any) {
    console.error("Erreur unexpected:", err);
    return { success: false, error: err.message || "Erreur lors de l'upload" };
  }
}

/**
 * Uploader plusieurs photos et sauvegarder dans la table avatars
 * @param files - Array de fichiers
 * @param userId - ID de l'utilisateur
 * @param isPrimaryIndex - Index de la photo principale (optionnel)
 */
export async function uploadMultiplePhotos(
  files: File[],
  userId: string,
  isPrimaryIndex: number = 0
): Promise<{
  success: boolean;
  uploadedPhotos?: Array<{ url: string; isPrimary: boolean }>;
  error?: string;
}> {
  try {
    const uploadResults = [];

    // Uploader chaque photo
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadPhotoToStorage(file, userId);

      if (!result.success) {
        console.warn(`Photo ${i} : ${result.error}`);
        continue;
      }

      uploadResults.push({
        url: result.photoUrl!,
        isPrimary: i === isPrimaryIndex,
      });
    }

    if (uploadResults.length === 0) {
      return { success: false, error: "Aucune photo n'a pu être uploadée" };
    }

    // Sauvegarder dans la table avatars
    const photosToInsert = uploadResults.map((photo, index) => ({
      user_id: userId,
      photo_url: photo.url,
      is_primary: photo.isPrimary,
      photo_order: index,
    }));

    const { error: insertError } = await supabase
      .from("avatars")
      .insert(photosToInsert);

    if (insertError) {
      return {
        success: false,
        error: `Photos uploadées mais erreur DB: ${insertError.message}`,
      };
    }

    return {
      success: true,
      uploadedPhotos: uploadResults,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Récupérer les photos d'un utilisateur
 */
export async function getUserPhotos(userId: string) {
  const { data, error } = await supabase
    .from("avatars")
    .select("*")
    .eq("user_id", userId)
    .order("photo_order", { ascending: true });

  if (error) {
    console.error("Erreur récupération photos:", error);
    return [];
  }

  return data || [];
}

/**
 * Supprimer une photo
 */
export async function deletePhoto(photoId: string, photoUrl: string) {
  try {
    // Supprimer du storage
    const fileUrl = new URL(photoUrl);
    const filePath = fileUrl.pathname.split("/storage/v1/object/public/avatars/")[1];

    if (filePath) {
      await supabase.storage.from("avatars").remove([filePath]);
    }

    // Supprimer de la table
    const { error } = await supabase
      .from("avatars")
      .delete()
      .eq("id", photoId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
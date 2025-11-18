// lib/imageCompression.ts

/**
 * Compresse une image en réduisant sa taille et sa qualité
 * @param file - Le fichier image original
 * @param maxWidth - Largeur maximale (défaut: 1920px)
 * @param quality - Qualité JPEG (0-1, défaut: 0.8)
 * @returns Promise<File> - Le fichier compressé
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Vérifier que c'est une image
    if (!file.type.startsWith("image/")) {
      reject(new Error("Le fichier n'est pas une image"));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculer les nouvelles dimensions
        let width = img.width;
        let height = img.height;

        // Réduire si trop large
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        // Créer un canvas pour redimensionner
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Impossible de créer le contexte canvas"));
          return;
        }

        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en blob avec compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Erreur lors de la compression"));
              return;
            }

            // Créer un nouveau fichier avec le blob compressé
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, ".jpg"), // Convertir en .jpg
              {
                type: "image/jpeg",
                lastModified: Date.now(),
              }
            );

            console.log(`Compression: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Erreur lors du chargement de l'image"));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Erreur lors de la lecture du fichier"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Compresse plusieurs images en parallèle
 * @param files - Array de fichiers
 * @param maxWidth - Largeur maximale
 * @param quality - Qualité JPEG
 * @returns Promise<File[]> - Les fichiers compressés
 */
export async function compressMultipleImages(
  files: File[],
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File[]> {
  const compressionPromises = files.map((file) =>
    compressImage(file, maxWidth, quality)
  );

  try {
    return await Promise.all(compressionPromises);
  } catch (error) {
    console.error("Erreur lors de la compression multiple:", error);
    throw error;
  }
}

/**
 * Compresse une image de manière adaptative selon sa taille
 * - Si < 2MB : qualité 0.9
 * - Si 2-5MB : qualité 0.8
 * - Si > 5MB : qualité 0.7
 */
export async function smartCompress(file: File): Promise<File> {
  const sizeMB = file.size / 1024 / 1024;

  let quality = 0.8;
  let maxWidth = 1920;

  if (sizeMB < 2) {
    quality = 0.9;
  } else if (sizeMB < 5) {
    quality = 0.8;
  } else if (sizeMB < 10) {
    quality = 0.7;
  } else {
    // Très grosse image
    quality = 0.6;
    maxWidth = 1600;
  }

  return compressImage(file, maxWidth, quality);
}
"use client";


import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { uploadMultiplePhotos, getUserPhotos, deletePhoto } from "@/lib/supabaseStorage";
import { smartCompress } from "@/lib/imageCompression";
import { Camera, X, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

interface UserPhoto {
  id: string;
  photo_url: string;
  is_primary: boolean;
  photo_order: number;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Form states (ÉDITABLES uniquement)
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  
  // Infos NON éditables (juste pour affichage)
  const [fullName, setFullName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [zodiacSign, setZodiacSign] = useState("");
  
  // Photos states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<UserPhoto[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  
  // Feedback
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    checkUserAndLoadProfile();
  }, []);

  async function checkUserAndLoadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth/login");
        return;
      }

      setCurrentUser(user);

      // Récupérer le profil existant
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        // Champs éditables
        setUsername(profile.username || "");
        setGender(profile.gender || "");
        setBio(profile.bio || "");
        setCity(profile.city || "");
        
        // Champs non éditables (affichage seulement)
        setFullName(profile.full_name || "");
        setBirthdate(profile.birthdate || "");
        setZodiacSign(profile.zodiac_sign || "");
      }

      // Récupérer les photos
      if (user.id) {
        const photos = await getUserPhotos(user.id);
        setUploadedPhotos(photos);
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Erreur:", err);
      setErrorMsg("Erreur lors du chargement du profil");
      setIsLoading(false);
    }
  }

  // Gestion des fichiers sélectionnés avec compression automatique
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    
    // Limiter à 6 photos max
    if (files.length + uploadedPhotos.length > 6) {
      setErrorMsg("Maximum 6 photos");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    // Afficher un message de compression en cours
    setSuccessMsg("Compression des images en cours...");

    try {
      // Compresser toutes les images
      const compressedFiles = await Promise.all(
        files.map(file => smartCompress(file))
      );

      setSelectedFiles(prev => [...prev, ...compressedFiles]);
      
      // Créer les previews
      compressedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreviewUrls(prev => [...prev, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });

      setSuccessMsg(`${compressedFiles.length} image(s) compressée(s) et prête(s) ✓`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error("Erreur compression:", error);
      setErrorMsg("Erreur lors de la compression des images");
      setTimeout(() => setErrorMsg(""), 3000);
    }
  }

  // Supprimer une preview
  function removePreview(index: number) {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }

  // Supprimer une photo uploadée
  async function removeUploadedPhoto(photo: UserPhoto) {
    try {
      const result = await deletePhoto(photo.id, photo.photo_url);
      if (result.success) {
        setUploadedPhotos(prev => prev.filter(p => p.id !== photo.id));
        setSuccessMsg("Photo supprimée ✓");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(result.error);
        setTimeout(() => setErrorMsg(""), 3000);
      }
    } catch (err) {
      setErrorMsg("Erreur lors de la suppression");
      setTimeout(() => setErrorMsg(""), 3000);
    }
  }

  // Upload les photos sélectionnées
  async function handleUploadPhotos() {
    if (selectedFiles.length === 0) {
      setErrorMsg("Aucune photo sélectionnée");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    if (!currentUser?.id) {
      setErrorMsg("Utilisateur non identifié");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    setIsUploadingPhotos(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const result = await uploadMultiplePhotos(selectedFiles, currentUser.id);
      
      if (result.success) {
        setSuccessMsg(`${result.uploadedPhotos?.length || 0} photo(s) uploadée(s) ✓`);
        setSelectedFiles([]);
        setPreviewUrls([]);
        
        // Recharger les photos
        const photos = await getUserPhotos(currentUser.id);
        setUploadedPhotos(photos);
        
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(result.error || "Erreur lors de l'upload");
        setTimeout(() => setErrorMsg(""), 3000);
      }
    } catch (err) {
      setErrorMsg("Erreur lors de l'upload");
      setTimeout(() => setErrorMsg(""), 3000);
    } finally {
      setIsUploadingPhotos(false);
    }
  }

  // Définir une photo comme principale
  async function setPrimaryPhoto(photoId: string) {
    if (!currentUser?.id) return;

    try {
      // D'abord, remettre toutes les photos à is_primary = false
      await supabase
        .from("user_photos")
        .update({ is_primary: false })
        .eq("user_id", currentUser.id);

      // Puis définir celle-ci comme principale
      const { error } = await supabase
        .from("user_photos")
        .update({ is_primary: true })
        .eq("id", photoId);

      if (!error) {
        // Recharger les photos
        const photos = await getUserPhotos(currentUser.id);
        setUploadedPhotos(photos);
        
        // Mettre à jour l'avatar_url dans profiles
        const primaryPhoto = photos.find(p => p.id === photoId);
        if (primaryPhoto) {
          await supabase
            .from("profiles")
            .update({ avatar_url: primaryPhoto.photo_url })
            .eq("id", currentUser.id);
        }

        setSuccessMsg("Photo principale définie ✓");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      setErrorMsg("Erreur lors de la mise à jour");
      setTimeout(() => setErrorMsg(""), 3000);
    }
  }

  // Sauvegarder les modifications du profil
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSaving(true);

    if (!currentUser?.id) {
      setErrorMsg("Utilisateur non identifié");
      setIsSaving(false);
      return;
    }

    try {
      // Mettre à jour le profil (UNIQUEMENT les champs éditables)
      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          gender,
          bio,
          city,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentUser.id);

      if (error) {
        setErrorMsg(error.message);
        setIsSaving(false);
        return;
      }

      setSuccessMsg("Profil mis à jour avec succès ! 🎉");
      
      // Redirection après 1.5 secondes
      setTimeout(() => {
        router.push(`/profil/${currentUser.id}`);
      }, 1500);
    } catch (err) {
      setErrorMsg("Erreur lors de la sauvegarde");
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Chargement...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] py-8 px-4 pb-32">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/profil/${currentUser?.id}`)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour au profil</span>
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">✏️</span>
            <h1 className="text-3xl font-bold text-slate-50">Modifier mon profil</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Mets à jour tes infos et tes photos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Messages de feedback */}
          {errorMsg && (
            <div className="p-4 bg-red-900/30 border border-red-700/40 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-900/30 border border-emerald-700/40 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-300 text-sm">{successMsg}</p>
            </div>
          )}

          {/* Infos NON modifiables (affichage seulement) */}
          <div className="bg-slate-950/80 border border-violet-700/60 rounded-2xl shadow-[0_0_40px_rgba(88,28,135,0.65)] p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-50">Informations fixes</h2>
            <p className="text-slate-400 text-sm">Ces informations ne peuvent pas être modifiées</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Nom complet</label>
                <div className="px-4 py-3 bg-slate-900/30 border border-slate-700/40 rounded-lg text-slate-400">
                  {fullName || "Non renseigné"}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Date de naissance</label>
                <div className="px-4 py-3 bg-slate-900/30 border border-slate-700/40 rounded-lg text-slate-400">
                  {birthdate ? new Date(birthdate).toLocaleDateString('fr-FR') : "Non renseignée"}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Signe zodiacal</label>
                <div className="px-4 py-3 bg-slate-900/30 border border-slate-700/40 rounded-lg text-slate-400">
                  {zodiacSign || "Non calculé"}
                </div>
              </div>
            </div>
          </div>

          {/* Infos modifiables */}
          <div className="bg-slate-950/80 border border-violet-700/60 rounded-2xl shadow-[0_0_40px_rgba(88,28,135,0.65)] p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-50">Informations modifiables</h2>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ton username unique"
                className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Genre</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value="">Pas de sélection</option>
                <option value="Femme">Femme</option>
                <option value="Homme">Homme</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Ville/Région</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Où tu habites ?"
                className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Parle un peu de toi... (250 caractères max)"
                maxLength={250}
                rows={4}
                className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">{bio.length}/250</p>
            </div>
          </div>

          {/* Photos */}
          <div className="bg-slate-950/80 border border-violet-700/60 rounded-2xl shadow-[0_0_40px_rgba(88,28,135,0.65)] p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-50">Tes photos</h2>
            <p className="text-slate-400 text-sm">Clique sur une photo pour la définir comme principale</p>

            {/* Photos déjà uploadées */}
            {uploadedPhotos.length > 0 && (
              <div>
                <p className="text-slate-400 text-sm mb-3">Photos uploadées ({uploadedPhotos.length}/6)</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {uploadedPhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.photo_url}
                        alt="Photo de profil"
                        className={`w-full h-40 object-cover rounded-lg border-2 cursor-pointer transition-all ${
                          photo.is_primary 
                            ? 'border-violet-500 ring-2 ring-violet-500/50' 
                            : 'border-violet-600/40 hover:border-violet-500'
                        }`}
                        onClick={() => setPrimaryPhoto(photo.id)}
                      />
                      {photo.is_primary && (
                        <div className="absolute top-2 left-2 bg-violet-600 text-white text-xs px-2 py-1 rounded font-semibold">
                          ⭐ Principale
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeUploadedPhoto(photo);
                        }}
                        className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sélectionner des photos */}
            {uploadedPhotos.length < 6 && (
              <div>
                <label className="block text-slate-400 text-sm mb-3">
                  Ajouter des photos ({previewUrls.length} sélectionnée(s))
                </label>
                <label className="block">
                  <div className="border-2 border-dashed border-violet-600/40 rounded-lg p-8 text-center cursor-pointer hover:border-violet-500 hover:bg-violet-600/5 transition">
                    <Camera className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Clique pour sélectionner des images</p>
                    <p className="text-slate-500 text-xs mt-1">JPG, PNG (max 5MB par photo)</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Previews des photos sélectionnées */}
            {previewUrls.length > 0 && (
              <div>
                <p className="text-slate-400 text-sm mb-3">Aperçu des sélections</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index}`}
                        className="w-full h-40 object-cover rounded-lg border border-violet-600/40"
                      />
                      <button
                        type="button"
                        onClick={() => removePreview(index)}
                        className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleUploadPhotos}
                  disabled={isUploadingPhotos}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingPhotos ? "Upload en cours..." : `Uploader ${selectedFiles.length} photo(s)`}
                </button>
              </div>
            )}
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push(`/profil/${currentUser?.id}`)}
              className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isSaving ? "Sauvegarde..." : "💾 Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
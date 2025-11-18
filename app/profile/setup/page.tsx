"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { uploadMultiplePhotos, getUserPhotos, deletePhoto } from "@/lib/supabaseStorage";
import { Camera, X, AlertCircle, CheckCircle } from "lucide-react";

interface UserPhoto {
  id: string;
  photo_url: string;
  is_primary: boolean;
  photo_order: number;
}

const ZODIAC_SIGNS = [
  "Bélier", "Taureau", "Gémeaux", "Cancer",
  "Lion", "Vierge", "Balance", "Scorpion",
  "Sagittaire", "Capricorne", "Verseau", "Poissons"
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Form states
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
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

      console.log("User from auth:", user); // Debug
      setCurrentUser(user);

      // Récupérer le profil existant
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
        setUsername(profile.username || "");
        setBirthdate(profile.birthdate || "");
        setGender(profile.gender || "");
        setBio(profile.bio || "");
        setCity(profile.city || "");
        setZodiacSign(profile.zodiac_sign || "");
      }

      // Récupérer les photos (FIX: vérifier que user.id existe)
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

  // Calculer le signe zodiacal depuis la date de naissance
  function calculateZodiacSign(date: string) {
    if (!date) return;
    
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();

    const zodiacDates = [
      { sign: "Capricorne", startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
      { sign: "Verseau", startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
      { sign: "Poissons", startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
      { sign: "Bélier", startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
      { sign: "Taureau", startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
      { sign: "Gémeaux", startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
      { sign: "Cancer", startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
      { sign: "Lion", startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
      { sign: "Vierge", startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
      { sign: "Balance", startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
      { sign: "Scorpion", startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
      { sign: "Sagittaire", startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
    ];

    const sign = zodiacDates.find(z => {
      if (z.startMonth === z.endMonth) {
        return month === z.startMonth && day >= z.startDay && day <= z.endDay;
      }
      return (
        (month === z.startMonth && day >= z.startDay) ||
        (month === z.endMonth && day <= z.endDay)
      );
    });

    if (sign) {
      setZodiacSign(sign.sign);
    }
  }

  // Gestion des fichiers sélectionnés
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    
    // Limiter à 6 photos max
    if (files.length + uploadedPhotos.length > 6) {
      setErrorMsg("Maximum 6 photos");
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);
    
    // Créer les previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrls(prev => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
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
        setSuccessMsg("Photo supprimée");
      } else {
        setErrorMsg(result.error);
      }
    } catch (err) {
      setErrorMsg("Erreur lors de la suppression");
    }
  }

  // Upload les photos sélectionnées
  async function handleUploadPhotos() {
    if (selectedFiles.length === 0) {
      setErrorMsg("Aucune photo sélectionnée");
      return;
    }

    if (!currentUser?.id) {
      setErrorMsg("Utilisateur non identifié");
      return;
    }

    setIsUploadingPhotos(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const result = await uploadMultiplePhotos(selectedFiles, currentUser.id);
      
      if (result.success) {
        setSuccessMsg(`${result.uploadedPhotos?.length || 0} photo(s) uploadée(s)`);
        setSelectedFiles([]);
        setPreviewUrls([]);
        
        // Recharger les photos
        const photos = await getUserPhotos(currentUser.id);
        setUploadedPhotos(photos);
      } else {
        setErrorMsg(result.error || "Erreur lors de l'upload");
      }
    } catch (err) {
      setErrorMsg("Erreur lors de l'upload");
    } finally {
      setIsUploadingPhotos(false);
    }
  }

  // Sauvegarder le profil
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!fullName || !username || !birthdate) {
      setErrorMsg("Remplis au moins : nom, pseudo et date de naissance");
      return;
    }

    if (!currentUser?.id) {
      setErrorMsg("Utilisateur non identifié");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          username: username,
          birthdate: birthdate,
          gender: gender || null,
          bio: bio || null,
          city: city || null,
          zodiac_sign: zodiacSign || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentUser.id);

      if (error) {
        setErrorMsg(error.message);
        setIsSaving(false);
        return;
      }

      setSuccessMsg("Profil sauvegardé ! Redirection...");
      
      // Attendre 1s puis rediriger
      setTimeout(() => {
        router.push("/home");
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la sauvegarde");
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center">
        <p className="text-slate-200">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-50 mb-2">Crée ton profil ✨</h1>
          <p className="text-slate-400">Complète tes infos et ajoute tes photos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Messages */}
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

          {/* Infos de base */}
          <div className="bg-slate-950/80 border border-violet-700/60 rounded-2xl shadow-[0_0_40px_rgba(88,28,135,0.65)] p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-50">Infos de base</h2>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Prénom ou pseudo *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ton prénom ou pseudo"
                className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Username *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username unique"
                className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Date de naissance *</label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => {
                  setBirthdate(e.target.value);
                  calculateZodiacSign(e.target.value);
                }}
                className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Signe zodiacal (auto)</label>
              <input
                type="text"
                value={zodiacSign}
                readOnly
                placeholder="S'affichera automatiquement"
                className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-400 cursor-not-allowed opacity-60"
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

            {/* Photos déjà uploadées */}
            {uploadedPhotos.length > 0 && (
              <div>
                <p className="text-slate-400 text-sm mb-3">Photos uploadées ({uploadedPhotos.length}/6)</p>
                <div className="grid grid-cols-3 gap-3">
                  {uploadedPhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.photo_url}
                        alt="Uploadée"
                        className="w-full h-32 object-cover rounded-lg border border-violet-600/40"
                      />
                      {photo.is_primary && (
                        <div className="absolute top-1 left-1 bg-violet-600 text-white text-xs px-2 py-1 rounded">
                          Principale
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeUploadedPhoto(photo)}
                        className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                    <p className="text-slate-400 text-sm">Clique ou drag des images ici</p>
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
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index}`}
                        className="w-full h-32 object-cover rounded-lg border border-violet-600/40"
                      />
                      <button
                        type="button"
                        onClick={() => removePreview(index)}
                        className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                  className="w-full py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingPhotos ? "Upload en cours..." : "Uploader les photos"}
                </button>
              </div>
            )}
          </div>

          {/* Bouton submit */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {isSaving ? "Sauvegarde..." : "Sauvegarder et continuer"}
          </button>
        </form>
      </div>
    </main>
  );
}
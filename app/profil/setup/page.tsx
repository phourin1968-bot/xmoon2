"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { smartCompress } from "../../../lib/imageCompression";
import { uploadMultiplePhotos, getUserPhotos, deletePhoto } from "@/lib/supabaseStorage";
import { Camera, X, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface UserPhoto {
  id: string;
  photo_url: string;
  is_primary: boolean;
  photo_order: number;
}

const INTERESTS = [
  { emoji: "🏃", label: "Sport & Fitness" },
  { emoji: "✈️", label: "Voyages" },
  { emoji: "🎵", label: "Musique" },
  { emoji: "🎨", label: "Art & Créativité" },
  { emoji: "📚", label: "Lecture" },
  { emoji: "🍳", label: "Cuisine & Gastronomie" },
  { emoji: "🌿", label: "Nature & Randonnée" },
  { emoji: "💻", label: "Technologie" },
  { emoji: "🎮", label: "Jeux vidéo" },
  { emoji: "🎬", label: "Cinéma & Séries" },
  { emoji: "🍷", label: "Sorties & Soirées" },
  { emoji: "🧘", label: "Yoga & Méditation" },
  { emoji: "📸", label: "Photographie" },
  { emoji: "🐕", label: "Animaux" },
  { emoji: "🎭", label: "Spectacles & Culture" },
  { emoji: "🛋️", label: "Chill (canapé)" },
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Étape 1 : Infos de base
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [zodiacSign, setZodiacSign] = useState("");
  
  // Étape 2 : Localisation & Bio
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  
  // Étape 3 : Préférences de recherche
  const [lookingFor, setLookingFor] = useState("");
  const [genderPreference, setGenderPreference] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [maxDistance, setMaxDistance] = useState("");
  
  // Étape 4 : Intérêts
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  // Étape 5 : Lifestyle
  const [smoking, setSmoking] = useState("");
  const [drinking, setDrinking] = useState("");
  const [pets, setPets] = useState("");
  const [children, setChildren] = useState("");
  const [profession, setProfession] = useState("");
  
  // Étape 6 : Photos (en dernier !)
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
        setFullName(profile.full_name || "");
        setUsername(profile.username || "");
        setPhone(profile.phone || "");
        setBirthdate(profile.birthdate || "");
        setGender(profile.gender || "");
        setZodiacSign(profile.zodiac_sign || "");
        setCity(profile.city || "");
        setBio(profile.bio || "");
        setLookingFor(profile.looking_for || "");
        setGenderPreference(profile.gender_preference || "");
        setAgeRange(profile.age_range || "");
        setMaxDistance(profile.max_distance || "");
        setSmoking(profile.smoking || "");
        setDrinking(profile.drinking || "");
        setPets(profile.pets || "");
        setChildren(profile.children || "");
        setProfession(profile.profession || "");
        
        if (profile.interests) {
          setSelectedInterests(profile.interests);
        }
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

  // Calculer le signe zodiacal
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

  // Gestion des photos
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    
    if (files.length + uploadedPhotos.length > 6) {
      setErrorMsg("Maximum 6 photos");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    setSuccessMsg("Compression des images en cours...");

    try {
      const compressedFiles = await Promise.all(
        files.map(file => smartCompress(file))
      );

      setSelectedFiles(prev => [...prev, ...compressedFiles]);
      
      compressedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreviewUrls(prev => [...prev, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });

      setSuccessMsg(`${compressedFiles.length} image(s) prête(s) ✓`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error("Erreur compression:", error);
      setErrorMsg("Erreur lors de la compression");
      setTimeout(() => setErrorMsg(""), 3000);
    }
  }

  function removePreview(index: number) {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }

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

  async function handleUploadPhotos() {
    if (selectedFiles.length === 0) return;
    if (!currentUser?.id) return;

    setIsUploadingPhotos(true);

    try {
      const result = await uploadMultiplePhotos(selectedFiles, currentUser.id);
      
      if (result.success) {
        setSuccessMsg(`${result.uploadedPhotos?.length || 0} photo(s) uploadée(s)`);
        setSelectedFiles([]);
        setPreviewUrls([]);
        
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

  // Toggle intérêt
  function toggleInterest(interest: string) {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  }

  // Validation par étape
  function validateStep(step: number): boolean {
    switch (step) {
      case 1:
        if (!fullName.trim() || !username.trim() || !phone.trim() || !birthdate || !gender) {
          setErrorMsg("Tous les champs de cette étape sont obligatoires");
          return false;
        }
        return true;
      case 2:
        if (!city.trim() || !bio.trim()) {
          setErrorMsg("Ville et bio sont obligatoires");
          return false;
        }
        return true;
      case 3:
        if (!lookingFor || !genderPreference || !ageRange || !maxDistance) {
          setErrorMsg("Tous les champs de préférence sont obligatoires");
          return false;
        }
        return true;
      case 4:
        if (selectedInterests.length === 0) {
          setErrorMsg("Sélectionne au moins 1 intérêt");
          return false;
        }
        return true;
      case 5:
        // Lifestyle optionnel
        return true;
      case 6:
        if (uploadedPhotos.length === 0) {
          setErrorMsg("Ajoute au moins 1 photo");
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  // Navigation
  function handleNext() {
    setErrorMsg("");
    
    if (!validateStep(currentStep)) {
      return;
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  }

  function handlePrevious() {
    setErrorMsg("");
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  }

  // Sauvegarder le profil final
  async function handleFinalSubmit() {
    setErrorMsg("");
    setSuccessMsg("");
    setIsSaving(true);

    if (!currentUser?.id) {
      setErrorMsg("Utilisateur non identifié");
      setIsSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          username,
          phone,
          birthdate,
          zodiac_sign: zodiacSign,
          gender,
          city,
          bio,
          looking_for: lookingFor,
          gender_preference: genderPreference,
          age_range: ageRange,
          max_distance: maxDistance,
          interests: selectedInterests,
          smoking,
          drinking,
          pets,
          children,
          profession,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentUser.id);

      if (error) {
        setErrorMsg(error.message);
        setIsSaving(false);
        return;
      }

      // Animation de confettis !
      setShowConfetti(true);
      
      // Redirection après 3 secondes
      setTimeout(() => {
        router.push("/home");
      }, 3000);
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

  // Écran de félicitations avec confettis
  if (showConfetti) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center px-4 relative overflow-hidden">
        {/* Confettis animés */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            >
              <span className="text-2xl">
                {['🎉', '✨', '🌟', '💫', '🎊', '🌙', '⭐', '💖'][Math.floor(Math.random() * 8)]}
              </span>
            </div>
          ))}
        </div>

        {/* Message de félicitations */}
        <div className="text-center z-10">
          <div className="mb-6 animate-pulse">
            <Sparkles className="w-24 h-24 text-violet-400 mx-auto" />
          </div>
          
          <h1 className="text-5xl font-bold text-slate-50 mb-4 animate-bounce">
            🎉 Bravo ! 🎉
          </h1>
          
          <p className="text-2xl text-violet-300 mb-3">
            Ton profil est complet !
          </p>
          
          <p className="text-lg text-slate-400 mb-8">
            Prêt(e) à trouver ta moitié cosmique ? 🌙✨
          </p>

          <div className="animate-pulse">
            <p className="text-slate-500 text-sm">
              Redirection vers ton espace en cours...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] py-8 px-4 pb-32">
      <div className="max-w-2xl mx-auto">
        {/* Header avec barre de progression */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-50">Configure ton profil</h1>
            <span className="text-slate-400 text-sm">Étape {currentStep}/{totalSteps}</span>
          </div>
          
          {/* Barre de progression */}
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Messages de feedback */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700/40 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-900/30 border border-emerald-700/40 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-300 text-sm">{successMsg}</p>
          </div>
        )}

        {/* Contenu des étapes */}
        <div className="bg-slate-950/80 border border-violet-700/60 rounded-2xl shadow-[0_0_40px_rgba(88,28,135,0.65)] p-6">
          
          {/* ÉTAPE 1 : Infos de base */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">📝</span>
                <h2 className="text-2xl font-bold text-slate-50">Infos de base</h2>
              </div>

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
                <label className="block text-slate-300 text-sm mb-2">Numéro de téléphone *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Pour les alertes de sécurité et crisis_alert
                </p>
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

              {zodiacSign && (
                <div className="p-3 bg-violet-900/20 border border-violet-700/40 rounded-lg">
                  <p className="text-slate-300 text-sm">
                    Ton signe zodiacal : <span className="text-violet-400 font-semibold">{zodiacSign}</span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-slate-300 text-sm mb-2">Genre *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="">Sélectionne ton genre</option>
                  <option value="Femme">Femme</option>
                  <option value="Homme">Homme</option>
                  <option value="Non-binaire">Non-binaire</option>
                  <option value="Autre">Autre</option>
                  <option value="Shilling">Shilling</option>
                </select>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : Localisation & Bio */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">📍</span>
                <h2 className="text-2xl font-bold text-slate-50">Localisation & Bio</h2>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Ville/Région *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Où tu habites ?"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Bio *</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Parle un peu de toi... (250 caractères max)"
                  maxLength={250}
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">{bio.length}/250</p>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : Préférences de recherche */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">❤️</span>
                <h2 className="text-2xl font-bold text-slate-50">Tes préférences</h2>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Tu recherches *</label>
                <select
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="">Sélectionne</option>
                  <option value="Relation sérieuse">Relation sérieuse</option>
                  <option value="Amitié">Amitié</option>
                  <option value="Rencontres sans prise de tête">Rencontres sans prise de tête</option>
                  <option value="Je ne sais pas encore">Je ne sais pas encore</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Genre recherché *</label>
                <select
                  value={genderPreference}
                  onChange={(e) => setGenderPreference(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="">Sélectionne</option>
                  <option value="Femmes">Femmes</option>
                  <option value="Hommes">Hommes</option>
                  <option value="Non-binaires">Non-binaires</option>
                  <option value="Tout le monde">Tout le monde</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Tranche d'âge *</label>
                <select
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="">Sélectionne</option>
                  <option value="18-25">18-25 ans</option>
                  <option value="26-35">26-35 ans</option>
                  <option value="36-45">36-45 ans</option>
                  <option value="46+">46+ ans</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Distance maximale *</label>
                <select
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="">Sélectionne</option>
                  <option value="10km">10 km</option>
                  <option value="25km">25 km</option>
                  <option value="50km">50 km</option>
                  <option value="100km">100 km</option>
                  <option value="Partout">Partout dans le monde</option>
                </select>
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : Intérêts */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">✨</span>
                <h2 className="text-2xl font-bold text-slate-50">Tes intérêts</h2>
              </div>

              <p className="text-slate-400 text-sm mb-4">
                Sélectionne au moins 1 intérêt ({selectedInterests.length} sélectionné{selectedInterests.length > 1 ? 's' : ''})
              </p>

              <div className="grid grid-cols-2 gap-3">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest.label}
                    type="button"
                    onClick={() => toggleInterest(interest.label)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedInterests.includes(interest.label)
                        ? 'border-violet-500 bg-violet-600/20'
                        : 'border-violet-600/40 bg-slate-900/50 hover:border-violet-500/60'
                    }`}
                  >
                    <span className="text-2xl mr-2">{interest.emoji}</span>
                    <span className="text-slate-200 text-sm">{interest.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 5 : Lifestyle */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🌟</span>
                <h2 className="text-2xl font-bold text-slate-50">Lifestyle</h2>
              </div>

              <p className="text-slate-400 text-sm mb-4">
                Ces informations sont optionnelles mais aident à mieux te matcher
              </p>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Fumeur</label>
                <select
                  value={smoking}
                  onChange={(e) => setSmoking(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="">Pas de réponse</option>
                  <option value="Oui">Oui</option>
                  <option value="Non">Non</option>
                  <option value="Occasionnellement">Occasionnellement</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Alcool</label>
                <select
                  value={drinking}
                  onChange={(e) => setDrinking(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="">Pas de réponse</option>
                  <option value="Jamais">Jamais</option>
                  <option value="Socialement">Socialement</option>
                  <option value="Régulièrement">Régulièrement</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Animaux</label>
                <select
                  value={pets}
                  onChange={(e) => setPets(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="">Pas de réponse</option>
                  <option value="J'en ai">J'en ai</option>
                  <option value="J'en veux">J'en veux</option>
                  <option value="Pas pour moi">Pas pour moi</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Enfants</label>
                <select
                  value={children}
                  onChange={(e) => setChildren(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="">Pas de réponse</option>
                  <option value="J'en ai">J'en ai</option>
                  <option value="J'en veux">J'en veux</option>
                  <option value="Je n'en veux pas">Je n'en veux pas</option>
                  <option value="On verra">On verra</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Situation</label>
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="">Pas de réponse</option>
                  <option value="Études">Études</option>
                  <option value="En poste">En poste</option>
                  <option value="Entrepreneur">Entrepreneur</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>
          )}

          {/* ÉTAPE 6 : Photos (EN DERNIER !) */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">📸</span>
                <h2 className="text-2xl font-bold text-slate-50">Tes photos</h2>
              </div>

              <p className="text-slate-400 text-sm mb-4">
                Dernière étape ! Ajoute au moins 1 photo pour compléter ton profil
              </p>

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

              {uploadedPhotos.length < 6 && (
                <div>
                  <label className="block text-slate-400 text-sm mb-3">
                    Ajouter des photos ({previewUrls.length} sélectionnée(s))
                  </label>
                  <label className="block">
                    <div className="border-2 border-dashed border-violet-600/40 rounded-lg p-8 text-center cursor-pointer hover:border-violet-500 hover:bg-violet-600/5 transition">
                      <Camera className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">Clique ou drag des images ici</p>
                      <p className="text-slate-500 text-xs mt-1">JPG, PNG - Compression auto ✨</p>
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
                    className="w-full py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    {isUploadingPhotos ? "Upload en cours..." : "Uploader les photos"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Boutons de navigation */}
        <div className="mt-8 flex gap-4">
          {currentStep > 1 && (
            <button
              onClick={handlePrevious}
              className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Précédent
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              Suivant
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              disabled={isSaving}
              className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isSaving ? "Sauvegarde..." : "Terminer 🎉"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

// Fonction pour calculer le signe du zodiaque
function getZodiacSign(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Bélier";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taureau";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gémeaux";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Lion";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Vierge";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Balance";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpion";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittaire";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorne";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Verseau";
  return "Poissons";
}

// Composant de confettis
function Confetti() {
  const confettiCount = 50;
  const colors = ["#a855f7", "#ec4899", "#f97316", "#eab308", "#3b82f6"];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: confettiCount }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 3;
        const duration = 3 + Math.random() * 2;
        const color = colors[Math.floor(Math.random() * colors.length)];

        return (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-fall"
            style={{
              left: `${left}%`,
              top: "-10px",
              backgroundColor: color,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
}

// Liste des intérêts
const INTERESTS = [
  { emoji: "🎮", label: "Gaming" },
  { emoji: "💕", label: "Romance & Dating" },
  { emoji: "🍳", label: "Cook & Meal" },
  { emoji: "✈️", label: "Traveling" },
  { emoji: "🎵", label: "Music" },
  { emoji: "📚", label: "Reading" },
  { emoji: "🎬", label: "Movies & TV" },
  { emoji: "🏃", label: "Sport & Fitness" },
  { emoji: "🎨", label: "Art" },
  { emoji: "🧘", label: "Yoga" },
  { emoji: "🔮", label: "Astrologie" },
  { emoji: "👗", label: "Mode" },
  { emoji: "🛋️", label: "Chilling" },
  { emoji: "🐾", label: "Animals" },
  { emoji: "💃", label: "Dancing" },
  { emoji: "📷", label: "Photography" },
];

export default function ProfileMultiStep() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Step 1: Infos de base
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [gender, setGender] = useState<"homme" | "femme" | "non-binaire">("homme");
  const [lookingFor, setLookingFor] = useState<"homme" | "femme" | "tous">("tous");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(99);
  const [bio, setBio] = useState("");

  // Step 2: Photos
  const [photos, setPhotos] = useState<string[]>(["", "", "", ""]);

  // Step 3: Intérêts
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Step 4: Type de relation
  const [relationshipType, setRelationshipType] = useState<string>("love");

  // Confettis
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email || "");

      // Vérifier si le profil existe
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
        setUsername(profile.username || "");
        setBirthdate(profile.birthdate || "");
        setBirthPlace(profile.birth_place || "");
        setGender(profile.gender || "homme");
        setLookingFor(profile.looking_for || "tous");
        setBio(profile.bio || "");
        setCity(profile.city || "");
        setAgeMin(profile.age_min || 18);
        setAgeMax(profile.age_max || 99);
      }

      setLoading(false);
    }
    loadProfile();
  }, [router]);

  function toggleInterest(interest: string) {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  }

  async function handlePhotoUpload(index: number, file: File) {
    // Simuler l'upload - à remplacer par Supabase Storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const newPhotos = [...photos];
      newPhotos[index] = reader.result as string;
      setPhotos(newPhotos);
    };
    reader.readAsDataURL(file);
  }

  function canGoNext() {
    if (currentStep === 1) {
      return fullName && username && birthdate && phone && gender && lookingFor;
    }
    if (currentStep === 2) {
      return photos.filter((p) => p !== "").length >= 1;
    }
    if (currentStep === 3) {
      return selectedInterests.length >= 3;
    }
    return true;
  }

  async function handleNext() {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Sauvegarder le profil
      await handleSubmit();
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  async function handleSubmit() {
    setSaving(true);
    setMessage("");

    if (!userId) return;

    const zodiacSign = birthdate ? getZodiacSign(new Date(birthdate)) : null;

    const profileData = {
      id: userId,
      email: userEmail,
      full_name: fullName,
      username: username,
      birthdate: birthdate || null,
      birth_place: birthPlace || null,
      gender: gender,
      looking_for: lookingFor,
      bio: bio || null,
      city: city || null,
      age_min: ageMin,
      age_max: ageMax,
      zodiac_sign: zodiacSign,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(profileData);

    if (error) {
      setMessage("❌ Erreur : " + error.message);
      setSaving(false);
    } else {
      // Afficher l'écran de congratulations
      setCurrentStep(5);
      setShowConfetti(true);

      // Rediriger après 4 secondes
      setTimeout(() => {
        router.push("/home");
      }, 4000);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center">
        <p className="text-slate-200 text-sm">Chargement...</p>
      </main>
    );
  }

  // Écran de congratulations
  if (currentStep === 5) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center px-4 relative">
        {showConfetti && <Confetti />}
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-lg border border-violet-500/30 rounded-3xl shadow-2xl p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-4xl">👤</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Congratulations!</h1>
          <p className="text-slate-300 mb-6">
            Your account is ready to use. You will be redirected to the Home page in a few
            seconds.
          </p>
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
            <div
              className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-1/4 h-1 rounded-full mx-1 ${
                  step <= currentStep ? "bg-violet-500" : "bg-slate-700"
                }`}
              />
            ))}
          </div>
          <p className="text-slate-400 text-sm text-center">
            Étape {currentStep} sur 4
          </p>
        </div>

        <div className="bg-slate-950/80 border border-violet-700/60 rounded-2xl shadow-[0_0_40px_rgba(88,28,135,0.65)] p-6">
          {/* Step 1: Infos de base */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-50 mb-4">📝 Tes informations</h2>

              <div>
                <label className="block text-slate-300 text-sm mb-1">
                  Nom complet <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Marie Dupont"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-1">
                  Pseudo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="marie_moon"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-1">
                  Date de naissance <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
                />
                {birthdate && (
                  <p className="text-violet-400 text-xs mt-1">
                    ✨ Signe : {getZodiacSign(new Date(birthdate))}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-1">
                  Numéro de téléphone <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  🔒 Ton numéro restera privé et ne sera jamais partagé
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">
                    Genre <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
                  >
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                    <option value="non-binaire">Non-binaire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-1">
                    Je recherche <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={lookingFor}
                    onChange={(e) => setLookingFor(e.target.value as any)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 focus:outline-none focus:border-violet-500"
                  >
                    <option value="homme">Un homme</option>
                    <option value="femme">Une femme</option>
                    <option value="tous">Les deux</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-1">Ville actuelle</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Paris"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-1">Bio (optionnel)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Parle un peu de toi... ✨"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Photos */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-50 mb-2">📸 Tes meilleures photos</h2>
              <p className="text-slate-400 text-sm mb-4">
                Ajoute au moins 1 photo (4 recommandées)
              </p>

              <div className="grid grid-cols-2 gap-4">
                {photos.map((photo, index) => (
                  <label
                    key={index}
                    className="aspect-square border-2 border-dashed border-violet-600/40 rounded-xl flex items-center justify-center cursor-pointer hover:border-violet-500 transition-colors overflow-hidden bg-slate-900/30"
                  >
                    {photo ? (
                      <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <span className="text-3xl text-violet-400">➕</span>
                        <p className="text-xs text-slate-400 mt-1">Ajouter</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handlePhotoUpload(index, e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Intérêts */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-50 mb-2">💫 Tes intérêts</h2>
              <p className="text-slate-400 text-sm mb-4">
                Sélectionne au moins 3 intérêts
              </p>

              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest.label}
                    type="button"
                    onClick={() => toggleInterest(interest.label)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedInterests.includes(interest.label)
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                        : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
                    }`}
                  >
                    {interest.emoji} {interest.label}
                  </button>
                ))}
              </div>

              <p className="text-violet-400 text-sm">
                {selectedInterests.length} intérêt{selectedInterests.length > 1 ? "s" : ""}{" "}
                sélectionné{selectedInterests.length > 1 ? "s" : ""}
              </p>
            </div>
          )}

          {/* Step 4: Type de relation */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-50 mb-2">❤️ Ce que tu recherches</h2>
              <p className="text-slate-400 text-sm mb-4">
                Quel type de relation cherches-tu ?
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "love", emoji: "❤️", label: "Love" },
                  { value: "friends", emoji: "👥", label: "Friends" },
                  { value: "music", emoji: "🎵", label: "Music" },
                  { value: "business", emoji: "💼", label: "Business" },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setRelationshipType(type.value)}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      relationshipType === type.value
                        ? "border-violet-500 bg-violet-500/20"
                        : "border-slate-700 bg-slate-900/30 hover:border-violet-600/50"
                    }`}
                  >
                    <div className="text-4xl mb-2">{type.emoji}</div>
                    <div className="text-slate-200 font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all"
              >
                Retour
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext() || saving}
              className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? "Enregistrement..."
                : currentStep === 4
                ? "Terminer"
                : "Continuer"}
            </button>
          </div>

          {message && (
            <div className="mt-4 p-3 rounded-lg text-sm bg-red-900/30 text-red-300">
              {message}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
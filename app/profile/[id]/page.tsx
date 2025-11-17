"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import { Heart, X, Star } from "lucide-react";

interface ProfileData {
  id: string;
  full_name: string;
  username: string;
  birthdate: string;
  zodiac_sign: string;
  bio: string;
  city: string;
  avatar_url?: string;
  gender: string;
}

// Fonction simple de compatibilité (à améliorer plus tard avec de vraies règles astro)
function calculateCompatibility(userSign: string, targetSign: string): number {
  // Pour l'instant, compatibilité aléatoire entre 60-95%
  const signs = ["Bélier", "Taureau", "Gémeaux", "Cancer", "Lion", "Vierge", "Balance", "Scorpion", "Sagittaire", "Capricorne", "Verseau", "Poissons"];
  const userIndex = signs.indexOf(userSign);
  const targetIndex = signs.indexOf(targetSign);
  
  if (userIndex === -1 || targetIndex === -1) return 75;
  
  const diff = Math.abs(userIndex - targetIndex);
  return 95 - (diff * 3);
}

function getCompatibilityMessage(score: number): string {
  if (score >= 90) return "Connexion cosmique exceptionnelle ! Les astres s'alignent parfaitement pour vous deux. ✨";
  if (score >= 80) return "Excellente compatibilité ! Vos énergies se complètent à merveille. 💫";
  if (score >= 70) return "Belle harmonie astrologique. Beaucoup de potentiel ! 🌟";
  return "Compatibilité intéressante. Les différences peuvent créer une belle dynamique ! 💕";
}

export default function ProfileDetailPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params?.id as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userSign, setUserSign] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [compatibility, setCompatibility] = useState(0);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Charger le signe de l'utilisateur connecté
      const { data: userData } = await supabase
        .from("profiles")
        .select("zodiac_sign")
        .eq("id", user.id)
        .single();

      if (userData) {
        setUserSign(userData.zodiac_sign);
      }

      // Charger le profil à afficher
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      if (profileData) {
        setProfile(profileData);
        
        // Calculer la compatibilité
        if (userData?.zodiac_sign && profileData.zodiac_sign) {
          const score = calculateCompatibility(userData.zodiac_sign, profileData.zodiac_sign);
          setCompatibility(score);
        }
      }

      setLoading(false);
    }

    if (profileId) {
      loadProfile();
    }
  }, [profileId, router]);

  async function handleAction(action: "wave" | "like" | "superlike") {
    setActionLoading(true);

    // TODO: Implémenter la logique de sauvegarde dans la table user_interactions
    // Pour l'instant, juste un feedback visuel

    console.log(`Action: ${action} sur profil ${profileId}`);

    // Simuler un délai
    await new Promise((resolve) => setTimeout(resolve, 500));

    setActionLoading(false);

    // Retour à la home ou au profil suivant
    router.push("/home");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center">
        <p className="text-slate-200 text-sm">Chargement...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-300 mb-4">Profil introuvable</p>
          <button
            onClick={() => router.push("/home")}
            className="text-violet-400 hover:text-violet-300"
          >
            ← Retour à l'accueil
          </button>
        </div>
      </main>
    );
  }

  const age = profile.birthdate
    ? new Date().getFullYear() - new Date(profile.birthdate).getFullYear()
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] pb-32">
      <div className="max-w-2xl mx-auto">
        {/* Bouton retour */}
        <div className="p-4">
          <button
            onClick={() => router.push("/home")}
            className="text-slate-400 hover:text-white flex items-center gap-2"
          >
            <span>←</span>
            <span>Retour</span>
          </button>
        </div>

        {/* Photo principale */}
        <div className="relative aspect-[3/4] w-full">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <span className="text-9xl">👤</span>
            </div>
          )}

          {/* Gradient overlay en bas */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Boutons d'action en overlay sur la photo */}
          <div className="absolute bottom-6 left-0 right-0 px-6">
            <div className="flex justify-center gap-6">
              <button
                onClick={() => router.push("/discover")}
                className="w-16 h-16 bg-red-500/30 hover:bg-red-500/40 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-red-400/70 transition-all hover:scale-110 shadow-xl"
              >
                <X className="w-8 h-8 text-red-400" />
              </button>

              <button
                onClick={() => handleAction("superlike")}
                disabled={actionLoading}
                className="w-16 h-16 bg-blue-500/30 hover:bg-blue-500/40 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-blue-400/70 transition-all hover:scale-110 shadow-xl disabled:opacity-50"
              >
                <Star className="w-7 h-7 text-blue-400" />
              </button>

              <button
                onClick={() => handleAction("like")}
                disabled={actionLoading}
                className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-pink-500/60 transition-all hover:scale-110 border-2 border-white/30 disabled:opacity-50"
              >
                <Heart className="w-8 h-8 text-white fill-white" />
              </button>
            </div>
          </div>

          {/* Infos sur la photo */}
          <div className="absolute bottom-24 left-0 right-0 p-6 text-white">
            <h1 className="text-4xl font-bold mb-2">
              {profile.username || profile.full_name}
              {age && <span className="text-3xl font-normal">, {age}</span>}
            </h1>
            <div className="flex items-center gap-3 text-lg">
              <span>{profile.zodiac_sign}</span>
              <span>•</span>
              <span>{profile.city}</span>
            </div>
          </div>
        </div>

        {/* Compatibilité astro */}
        <div className="px-6 py-4 bg-gradient-to-r from-violet-900/40 to-fuchsia-900/40 border-y border-violet-600/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 text-sm font-medium">
              Compatibilité astrologique
            </span>
            <span className="text-2xl font-bold text-violet-400">{compatibility}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${compatibility}%` }}
            />
          </div>
          <p className="text-slate-400 text-xs">
            {getCompatibilityMessage(compatibility)}
          </p>
        </div>

        {/* Bio */}
        <div className="px-6 py-6">
          <h2 className="text-xl font-semibold text-slate-50 mb-3">À propos</h2>
          <p className="text-slate-300 leading-relaxed">
            {profile.bio || "Aucune bio pour le moment."}
          </p>
        </div>

        {/* Infos supplémentaires */}
        <div className="px-6 pb-6">
          <h2 className="text-xl font-semibold text-slate-50 mb-3">Infos</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-300">
              <span>✨</span>
              <span>Signe : {profile.zodiac_sign}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span>📍</span>
              <span>Ville : {profile.city}</span>
            </div>
            {profile.gender && (
              <div className="flex items-center gap-2 text-slate-300">
                <span>👤</span>
                <span>Genre : {profile.gender}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
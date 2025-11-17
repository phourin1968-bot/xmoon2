"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, MessageCircle, Star, Sparkles } from "lucide-react";

interface ProfileData {
  id: string;
  full_name: string;
  username: string;
  zodiac_sign: string;
  birthdate: string;
  bio?: string;
  interests?: string[];
  age?: number;
}

export default function ProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [compatibility, setCompatibility] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    loadCurrentUser();
  }, [params.id]);

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setCurrentUser(userData);
    }
  }

  async function loadProfile() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", params.id)
      .single();

    if (data) {
      // Calculer l'âge si birthdate existe
      if (data.birthdate) {
        const age = new Date().getFullYear() - new Date(data.birthdate).getFullYear();
        data.age = age;
      }
      setProfile(data);
      calculateCompatibility(data.zodiac_sign);
    }
    setIsLoading(false);
  }

  function calculateCompatibility(theirSign: string) {
    // Logique simple de compatibilité astrologique
    const compatibilityMap: { [key: string]: { [key: string]: number } } = {
      "Bélier": { "Lion": 95, "Sagittaire": 90, "Gémeaux": 85, "Verseau": 80 },
      "Taureau": { "Vierge": 95, "Capricorne": 90, "Cancer": 85, "Poissons": 80 },
      "Gémeaux": { "Balance": 95, "Verseau": 90, "Bélier": 85, "Lion": 80 },
      "Cancer": { "Scorpion": 95, "Poissons": 90, "Taureau": 85, "Vierge": 80 },
      "Lion": { "Bélier": 95, "Sagittaire": 90, "Gémeaux": 85, "Balance": 80 },
      "Vierge": { "Taureau": 95, "Capricorne": 90, "Cancer": 85, "Scorpion": 80 },
      "Balance": { "Gémeaux": 95, "Verseau": 90, "Lion": 85, "Sagittaire": 80 },
      "Scorpion": { "Cancer": 95, "Poissons": 90, "Vierge": 85, "Capricorne": 80 },
      "Sagittaire": { "Bélier": 95, "Lion": 90, "Balance": 85, "Verseau": 80 },
      "Capricorne": { "Taureau": 95, "Vierge": 90, "Scorpion": 85, "Poissons": 80 },
      "Verseau": { "Gémeaux": 95, "Balance": 90, "Bélier": 85, "Sagittaire": 80 },
      "Poissons": { "Cancer": 95, "Scorpion": 90, "Taureau": 85, "Capricorne": 80 },
    };

    if (currentUser?.zodiac_sign && theirSign) {
      const score = compatibilityMap[currentUser.zodiac_sign]?.[theirSign] || 65;
      setCompatibility(score);
    } else {
      setCompatibility(75); // Score par défaut
    }
  }

  async function handleLike() {
    if (!currentUser) return;

    const { error } = await supabase.from("likes").insert({
      from_user_id: currentUser.id,
      to_user_id: params.id,
    });

    if (!error) {
      alert("💜 Like envoyé !");
    }
  }

  async function handleMessage() {
    // Rediriger vers la page de messages avec ce profil
    router.push(`/messages/${params.id}`);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f4d] to-[#2a1b3d] flex items-center justify-center">
        <div className="text-white text-xl">Chargement... ✨</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f4d] to-[#2a1b3d] flex items-center justify-center">
        <div className="text-white text-xl">Profil introuvable 😢</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f4d] to-[#2a1b3d] pb-20">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-lg border-b border-white/10 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Profil</h1>
        </div>
      </div>

      {/* Contenu du profil */}
      <div className="max-w-4xl mx-auto p-4 space-y-6 mt-6">
        {/* Card principale */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Avatar */}
            <div className="w-32 h-32 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-2xl">
              {profile.full_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase() || "?"}
            </div>

            {/* Nom et âge */}
            <div>
              <h2 className="text-3xl font-bold text-white">
                {profile.full_name || profile.username}
                {profile.age && <span className="text-white/70 text-2xl ml-2">{profile.age}</span>}
              </h2>
            </div>

            {/* Signe astrologique */}
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold text-lg">{profile.zodiac_sign}</span>
            </div>

            {/* Compatibilité */}
            {currentUser && (
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-4 w-full border border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="text-white/80 text-sm">Compatibilité avec toi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {compatibility}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mt-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${compatibility}%` }}
                  />
                </div>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-white/80 text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Intérêts */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="w-full">
                <h3 className="text-white/70 text-sm font-semibold mb-3">Centres d'intérêt</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="bg-white/10 px-3 py-1 rounded-full text-white/80 text-sm border border-white/20"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-4">
          <button
            onClick={handleLike}
            className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-pink-500/30 transition-all hover:-translate-y-0.5"
          >
            <Heart className="w-5 h-5" />
            J'aime
          </button>
          <button
            onClick={handleMessage}
            className="flex-1 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-0.5"
          >
            <MessageCircle className="w-5 h-5" />
            Message
          </button>
        </div>
      </div>
    </main>
  );
}

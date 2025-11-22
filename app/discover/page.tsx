"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import SwipeCard from "@/app/components/SwipeCard";
import Header from "@/app/components/Header";
import { User } from "@supabase/supabase-js";
import { Heart, X, Star } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  age?: number;
  bio?: string;
  city?: string;
  zodiac_sign?: string;
}

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    if (user) {
      fetchProfiles(user.id);
    }
  };

  // 🔥 Récupérer les profils depuis Supabase (exclure les profils déjà likés)
  const fetchProfiles = async (userId: string) => {
    try {
      // 1. Récupérer les IDs des profils déjà vus
      const { data: alreadySeenData } = await supabase
        .from("likes")
        .select("liked_user_id")
        .eq("user_id", userId);

      const seenIds = alreadySeenData?.map(like => like.liked_user_id) || [];

      // 2. Récupérer les profils non vus (et pas soi-même)
      let query = supabase
        .from("profiles")
        .select("id, username, age, bio, city, zodiac_sign")
        .neq("id", userId)
        .limit(20);

      // Si on a des profils déjà vus, les exclure
      if (seenIds.length > 0) {
        query = query.not("id", "in", `(${seenIds.join(",")})`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("❌ Erreur récupération profils:", error);
      } else {
        console.log("✅ Profils chargés:", data?.length);
        setProfiles(data || []);
      }
    } catch (err) {
      console.error("❌ Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  // 💾 Enregistrer le like dans la base
  const saveLike = async (likedUserId: string, isLike: boolean, isSuperLike: boolean = false) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from("likes")
        .insert({
          user_id: currentUser.id,
          liked_user_id: likedUserId,
          is_like: isLike,
          is_super_like: isSuperLike
        });

      if (error) {
        console.error("❌ Erreur enregistrement like:", error);
      } else {
        console.log(`✅ ${isSuperLike ? "Super Like" : isLike ? "Like" : "Pass"} enregistré`);
        
        if (isLike) {
          await checkForMatch(likedUserId);
        }
      }
    } catch (err) {
      console.error("❌ Erreur:", err);
    }
  };

  // 🔥 Vérifier s'il y a match mutuel
  const checkForMatch = async (likedUserId: string) => {
    if (!currentUser) return;

    try {
      console.log(`🔍 Vérification match entre ${currentUser.id} et ${likedUserId}`);
      
      const { data, error } = await supabase
        .from("likes")
        .select("*")
        .eq("user_id", likedUserId)
        .eq("liked_user_id", currentUser.id)
        .eq("is_like", true)
        .maybeSingle();

      if (error) {
        console.error("❌ Erreur vérification match:", error);
        return;
      }

      if (data) {
        console.log("🎉 MATCH DÉTECTÉ !");
        await createMatch(likedUserId);
      } else {
        console.log("Pas de match (normal)");
      }
    } catch (err) {
      console.error("❌ Erreur:", err);
    }
  };

  // 💕 Créer un match dans la base
const createMatch = async (matchedUserId: string) => {
  if (!currentUser) return;

  try {
    const { data: existingMatch } = await supabase
      .from("matches")
      .select("*")
      .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${matchedUserId}),and(user1_id.eq.${matchedUserId},user2_id.eq.${currentUser.id})`)
      .maybeSingle();

    if (existingMatch) {
      console.log("Match déjà existant");
      return;
    }

    const { error } = await supabase
      .from("matches")
      .insert({
        user1_id: currentUser.id,
        user2_id: matchedUserId,
        status: "pending"
      });

    if (error) {
      console.error("❌ Erreur création match:", error);
    } else {
      console.log("✅ Match créé dans la base !");
      alert("🎉 C'est un match !");
    }
  } catch (err) {
    console.error("❌ Erreur:", err);
  }
};
  // 👆 Gestion du swipe
  const handleSwipe = async (direction: "left" | "right" | "superlike") => {
    const currentProfile = profiles[currentIndex];
    
    if (direction === "superlike") {
      await saveLike(currentProfile.id, true, true);
    } else if (direction === "right") {
      await saveLike(currentProfile.id, true, false);
    }
    // Si direction === "left", on ne fait RIEN, juste passer au suivant
    
    // Passer au profil suivant
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <p className="text-white text-xl">Chargement des profils...</p>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <p className="text-white text-2xl mb-4">Aucun profil disponible 😢</p>
            <p className="text-white/70 text-sm">Reviens plus tard pour découvrir de nouveaux profils !</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <p className="text-white text-2xl mb-4">🎉 Tu as tout vu !</p>
            <button
              onClick={() => {
                setCurrentIndex(0);
                if (currentUser) fetchProfiles(currentUser.id);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full transition"
            >
              Actualiser
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <Header />
      
      <div className="flex items-center justify-center px-4 py-8 min-h-[calc(100vh-80px)]">
        <div className="relative w-full max-w-md">
          {/* Carte de profil */}
          <SwipeCard
            key={`${profiles[currentIndex].id}-${currentIndex}`}
            profile={profiles[currentIndex]}
            onSwipe={handleSwipe}
          />

          {/* 🔘 Boutons de contrôle - 3 boutons */}
          <div className="flex justify-center gap-6 mt-8">
            <button
              onClick={() => handleSwipe("left")}
              className="w-16 h-16 bg-gray-500/30 hover:bg-gray-500/40 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-gray-400/70 transition-all hover:scale-110 shadow-xl"
              aria-label="Passer"
            >
              <X className="w-8 h-8 text-gray-400" />
            </button>

            <button
              onClick={() => handleSwipe("superlike")}
              className="w-16 h-16 bg-blue-500/30 hover:bg-blue-500/40 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-blue-400/70 transition-all hover:scale-110 shadow-xl"
              aria-label="Super Like"
            >
              <Star className="w-7 h-7 text-blue-400" />
            </button>
            
            <button
              onClick={() => handleSwipe("right")}
              className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-pink-500/60 transition-all hover:scale-110 border-2 border-white/30"
              aria-label="Like"
            >
              <Heart className="w-8 h-8 text-white fill-white" />
            </button>
          </div>

          {/* Compteur de profils */}
          <p className="text-center text-white/60 mt-4 text-sm">
            {currentIndex + 1} / {profiles.length}
          </p>
        </div>
      </div>
    </div>
  );
}
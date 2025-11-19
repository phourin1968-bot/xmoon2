"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import SwipeCard from "@/app/components/SwipeCard";
import Header from "@/app/components/Header";
import { User } from "@supabase/supabase-js";

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

  // 🔥 Récupérer les profils depuis Supabase (exclure les profils déjà likés/dislikés)
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
        .neq("id", userId) // Exclure son propre profil
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

  // 💾 Enregistrer le like/dislike dans la base
  const saveLike = async (likedUserId: string, isLike: boolean) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from("likes")
        .insert({
          user_id: currentUser.id,
          liked_user_id: likedUserId,
          is_like: isLike
        });

      if (error) {
        console.error("❌ Erreur enregistrement like:", error);
      } else {
        console.log(`✅ ${isLike ? "Like" : "Dislike"} enregistré`);
        
        // Si c'est un like, vérifier s'il y a match
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
      
      // Vérifier si l'autre personne a aussi liké
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
        // Créer le match dans la table matches
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
      // Vérifier si le match existe déjà
      const { data: existingMatch } = await supabase
        .from("matches")
        .select("*")
        .or(`and(user1.eq.${currentUser.id},user2.eq.${matchedUserId}),and(user1.eq.${matchedUserId},user2.eq.${currentUser.id})`)
        .maybeSingle();

      if (existingMatch) {
        console.log("Match déjà existant");
        return;
      }

      // Créer le nouveau match
      const { error } = await supabase
        .from("matches")
        .insert({
          user1: currentUser.id,
          user2: matchedUserId,
          status: "pending"
        });

      if (error) {
        console.error("❌ Erreur création match:", error);
      } else {
        console.log("✅ Match créé dans la base !");
        // TODO: Afficher animation de match (Étape 3)
        alert("🎉 C'est un match !"); // Temporaire
      }
    } catch (err) {
      console.error("❌ Erreur:", err);
    }
  };

  // 👆 Gestion du swipe
  const handleSwipe = async (direction: "left" | "right") => {
    const currentProfile = profiles[currentIndex];
    console.log(`Swipe ${direction} sur ${currentProfile?.username}`);
    
    // Enregistrer le like/dislike
    await saveLike(currentProfile.id, direction === "right");
    
    // Passer au profil suivant
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      console.log("🎉 Plus de profils à afficher !");
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

          {/* 🔘 Boutons de contrôle */}
          <div className="flex justify-center gap-6 mt-8">
            <button
              onClick={() => handleSwipe("left")}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
              aria-label="Dislike"
            >
              <span className="text-white text-3xl">✖</span>
            </button>
            
            <button
              onClick={() => handleSwipe("right")}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
              aria-label="Like"
            >
              <span className="text-white text-3xl">♥</span>
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
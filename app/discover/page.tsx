"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import SwipeCard from "@/app/components/SwipeCard";

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

  // 📥 Récupérer les profils depuis Supabase
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, age, bio, city, zodiac_sign")
          .limit(20);

        if (error) {
          console.error("❌ Erreur récupération profils:", error);
        } else {
          console.log("✅ Profils chargés:", data);
          setProfiles(data || []);
        }
      } catch (err) {
        console.error("❌ Erreur:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  // 👆 Gestion du swipe
  const handleSwipe = (direction: "left" | "right") => {
    console.log(`Swipe ${direction} sur ${profiles[currentIndex]?.username}`);
    
    // TODO: Enregistrer le like/pass dans Supabase
    
    // Passer au profil suivant
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      console.log("🎉 Plus de profils à afficher !");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <p className="text-white text-xl">Chargement des profils...</p>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <p className="text-white text-xl">Aucun profil disponible 😢</p>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-2xl mb-4">🎉 Tu as tout vu !</p>
          <button
            onClick={() => setCurrentIndex(0)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full"
          >
            Recommencer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md h-[600px]">
        {/* Affiche seulement la carte actuelle */}
        <SwipeCard
        key={`${profiles[currentIndex].id}-${currentIndex}`}
        profile={profiles[currentIndex]}
        onSwipe={handleSwipe}
        />
      </div>

      {/* 🔘 Boutons de contrôle (optionnel) */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-6">
        <button
          onClick={() => handleSwipe("left")}
          className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition"
        >
          <span className="text-white text-2xl">✕</span>
        </button>
        <button
          onClick={() => handleSwipe("right")}
          className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition"
        >
          <span className="text-white text-2xl">♥</span>
        </button>
      </div>
    </div>
  );
}
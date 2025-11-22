"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Heart, Star, XIcon } from "lucide-react";
import MatchModal from "./MatchModal";

interface Profile {
  id: string;
  username: string;
  full_name?: string;
  zodiac_sign?: string;
  avatar_url?: string;
  city?: string;
  age?: number;
  bio?: string;
}

interface ProfileSwipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfiles: Profile[];
  initialIndex: number;
  currentUserId: string;
}

export default function ProfileSwipeModal({
  isOpen,
  onClose,
  initialProfiles,
  initialIndex,
  currentUserId,
}: ProfileSwipeModalProps) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  
  // États pour le MatchModal
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<Profile | null>(null);
  const [matchId, setMatchId] = useState<string>("");

  useEffect(() => {
    setProfiles(initialProfiles);
    setCurrentIndex(initialIndex);
  }, [initialProfiles, initialIndex]);

  if (!isOpen || profiles.length === 0) return null;

  const currentProfile = profiles[currentIndex];

  // 💾 Enregistrer le like
  const saveLike = async (likedUserId: string, isLike: boolean, isSuperLike: boolean = false) => {
    try {
      const { error } = await supabase
        .from("likes")
        .insert({
          user_id: currentUserId,
          liked_user_id: likedUserId,
          is_like: isLike,
          is_super_like: isSuperLike
        });

      if (error) {
        console.error("❌ Erreur like:", error);
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

  // 🔥 Vérifier match
  const checkForMatch = async (likedUserId: string) => {
    try {
      const { data, error } = await supabase
        .from("likes")
        .select("*")
        .eq("user_id", likedUserId)
        .eq("liked_user_id", currentUserId)
        .eq("is_like", true);

      if (error) {
        console.error("❌ Erreur vérification match:", error);
        return;
      }

      if (data && data.length > 0) {
        console.log("🎉 MATCH !");
        await createMatch(likedUserId);
      }
    } catch (err) {
      console.error("❌ Erreur:", err);
    }
  };

  // 💕 Créer match
  const createMatch = async (matchedUserId: string) => {
    try {
      const { data: existingMatch } = await supabase
        .from("matches")
        .select("*")
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${matchedUserId}),and(user1_id.eq.${matchedUserId},user2_id.eq.${currentUserId})`)
        .maybeSingle();

      if (existingMatch) {
        setMatchId(existingMatch.id);
        showMatchModalForUser(matchedUserId);
        return;
      }

      const { data: newMatch, error } = await supabase
        .from("matches")
        .insert({
          user1_id: currentUserId,
          user2_id: matchedUserId,
          status: "pending"
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur création match:", error);
      } else {
        setMatchId(newMatch.id);
        showMatchModalForUser(matchedUserId);
      }
    } catch (err) {
      console.error("❌ Erreur:", err);
    }
  };

  const showMatchModalForUser = async (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    if (profile) {
      setMatchedUser(profile);
      setShowMatchModal(true);
    }
  };

  // 👆 Gestion du swipe
  const handleSwipe = async (direction: "left" | "right" | "superlike") => {
    setSwipeDirection(direction);
    
    if (direction === "superlike") {
      await saveLike(currentProfile.id, true, true);
    } else if (direction === "right") {
      await saveLike(currentProfile.id, true, false);
    }
    
    // Animation puis passer au suivant
    setTimeout(() => {
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Plus de profils
        onClose();
      }
      setSwipeDirection(null);
    }, 300);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 animate-fadeIn">
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Compteur */}
        <div className="absolute top-4 right-4 z-10 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm">
          {currentIndex + 1} / {profiles.length}
        </div>

        {/* Carte de profil */}
        <div className="h-full flex items-center justify-center px-4">
          <div
            className={`w-full max-w-md transition-all duration-300 ${
              swipeDirection === "left"
                ? "translate-x-[-120%] rotate-[-30deg] opacity-0"
                : swipeDirection === "right"
                ? "translate-x-[120%] rotate-[30deg] opacity-0"
                : swipeDirection === "superlike"
                ? "translate-y-[-120%] scale-110 opacity-0"
                : ""
            }`}
          >
            {/* Image principale */}
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl">
              {currentProfile.avatar_url ? (
                <img
                  src={currentProfile.avatar_url}
                  alt={currentProfile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-9xl">
                  👤
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Infos du profil */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h2 className="text-3xl font-bold mb-2">
                  {currentProfile.username || currentProfile.full_name}
                  {currentProfile.age && `, ${currentProfile.age}`}
                </h2>
                {currentProfile.city && (
                  <p className="text-lg opacity-90 mb-2">📍 {currentProfile.city}</p>
                )}
                {currentProfile.zodiac_sign && (
                  <p className="text-lg opacity-90 mb-3">♈ {currentProfile.zodiac_sign}</p>
                )}
                {currentProfile.bio && (
                  <p className="text-sm opacity-80 line-clamp-2">{currentProfile.bio}</p>
                )}
              </div>

              {/* Badge signe en haut */}
              {currentProfile.zodiac_sign && (
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                  <span className="text-white font-semibold">{currentProfile.zodiac_sign}</span>
                </div>
              )}
            </div>

            {/* Compatibilité astrologique */}
            <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Compatibilité astrologique</span>
                <span className="text-2xl font-bold text-white">92%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-pink-500 to-violet-500" style={{ width: "92%" }} />
              </div>
              <p className="text-white/70 text-xs mt-2">
                Connexion cosmique exceptionnelle ! Les astres s'alignent parfaitement pour vous deux. ✨
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-center gap-6 mt-6">
              <button
                onClick={() => handleSwipe("left")}
                className="w-16 h-16 bg-gray-500/30 hover:bg-gray-500/40 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-gray-400/70 transition-all hover:scale-110 shadow-xl"
              >
                <XIcon className="w-8 h-8 text-gray-400" />
              </button>

              <button
                onClick={() => handleSwipe("superlike")}
                className="w-16 h-16 bg-blue-500/30 hover:bg-blue-500/40 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-blue-400/70 transition-all hover:scale-110 shadow-xl"
              >
                <Star className="w-7 h-7 text-blue-400" />
              </button>

              <button
                onClick={() => handleSwipe("right")}
                className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-pink-500/60 transition-all hover:scale-110 border-2 border-white/30"
              >
                <Heart className="w-8 h-8 text-white fill-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MatchModal */}
      {matchedUser && (
        <MatchModal
          isOpen={showMatchModal}
          onClose={() => {
            setShowMatchModal(false);
            // Continuer au profil suivant
            if (currentIndex < profiles.length - 1) {
              setCurrentIndex(currentIndex + 1);
            } else {
              onClose();
            }
          }}
          matchedUser={matchedUser}
          matchId={matchId}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
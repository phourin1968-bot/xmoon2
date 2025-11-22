"use client";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

interface Profile {
  id: string;
  username: string;
  age?: number;
  bio?: string;
  city?: string;
  zodiac_sign?: string;
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: "left" | "right") => void;
}

// ✨ Composant Particule d'étoile
const StarParticle = ({ delay }: { delay: number }) => {
  const randomX = Math.random() * 400 - 200;
  const randomY = Math.random() * 400 - 200;
  const randomRotate = Math.random() * 360;
  const randomScale = 0.5 + Math.random() * 1;

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 text-yellow-300 text-2xl"
      initial={{ 
        opacity: 1, 
        scale: 0,
        x: 0,
        y: 0,
        rotate: 0
      }}
      animate={{
        opacity: 0,
        scale: randomScale,
        x: randomX,
        y: randomY,
        rotate: randomRotate,
      }}
      transition={{
        duration: 2.5,
        delay,
        ease: "easeOut"
      }}
    >
      ✨
    </motion.div>
  );
};

// 💕 Pop-up "It's a Match!"
const MatchPopup = ({ matchedProfile, onClose }: { matchedProfile: Profile; onClose: () => void }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gradient-to-br from-purple-900 via-pink-800 to-purple-900 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-pink-500"
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0.5, rotate: 10 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        {/* Titre */}
        <motion.h2
          className="text-5xl font-bold text-center text-white mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          💕 It's a Match! 💕
        </motion.h2>

        {/* Message */}
        <motion.p
          className="text-center text-pink-200 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Vous avez matché avec <span className="font-bold text-white">{matchedProfile.username}</span> !
        </motion.p>

        {/* Particules d'étoiles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <StarParticle key={i} delay={i * 0.02} />
          ))}
        </div>

        {/* Boutons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-full transition"
          >
            Continuer à swiper
          </button>
          <button
            onClick={() => {
              // TODO: Navigation vers le chat ou la page matches
              onClose();
            }}
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:brightness-110 text-white font-medium py-3 rounded-full transition"
          >
            Envoyer un message
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function SwipeCard({ profile, onSwipe }: SwipeCardProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exitX, setExitX] = useState(0);
  const [showStars, setShowStars] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 🎨 Motion values pour le drag
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  // 🔐 Récupérer l'utilisateur connecté
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    fetchCurrentUser();
  }, []);

  // 📸 Récupérer les photos du profil
  useEffect(() => {
    setLoading(true);
    setPhotos([]);
    setCurrentPhotoIndex(0);

    const fetchPhotos = async () => {
      try {
        const { data, error } = await supabase
          .from("user_photos")
          .select("photo_url")
          .eq("user_id", profile.id)
          .order("photo_order", { ascending: true });

        if (error) {
          console.error("Erreur récupération photos:", error);
          setPhotos([]);
        } else if (data && data.length > 0) {
          console.log("✅ Photos chargées:", data.length);
          setPhotos(data.map((p) => p.photo_url));
        } else {
          console.log("⚠️ Aucune photo trouvée");
          setPhotos([]);
        }
      } catch (err) {
        console.error("Erreur:", err);
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [profile.id]);

  // 🎵 Pré-chargement des sons
const [sounds] = useState(() => {
  if (typeof window !== 'undefined') {
    return {
      swipe: new Audio('/sounds/swipe.mp3'),  // ← Change .wav en .mp3
      like: new Audio('/sounds/like.mp3'),    // ← Change .wav en .mp3
      skip: new Audio('/sounds/skip.mp3')     // ← Change .wav en .mp3
    };
  }
  return null;
});

// Configurer les volumes au montage
useEffect(() => {
  if (sounds) {
    sounds.swipe.volume = 0.3;
    sounds.like.volume = 0.5;
    sounds.skip.volume = 0.4;
    
    // Pré-charger les sons
    sounds.swipe.load();
    sounds.like.load();
    sounds.skip.load();
  }
}, [sounds]);

// 🎵 Son de swipe (glissement)
const playSwipeSound = () => {
  if (sounds?.swipe) {
    sounds.swipe.currentTime = 0; // Reset pour pouvoir rejouer
    sounds.swipe.play().catch(err => console.log("Erreur son swipe:", err));
  }
};

// 🎵 Son de like
const playLikeSound = () => {
  if (sounds?.like) {
    sounds.like.currentTime = 0;
    sounds.like.play().catch(err => console.log("Erreur son like:", err));
  }
};

// 🎵 Son de skip
const playSkipSound = () => {
  if (sounds?.skip) {
    sounds.skip.currentTime = 0;
    sounds.skip.play().catch(err => console.log("Erreur son skip:", err));
  }
}; 

  // 💾 Enregistrer le like et vérifier le match
  const handleLike = async () => {
    if (!currentUserId) {
      console.error("Utilisateur non connecté");
      return;
    }

    try {
      // Enregistrer le like dans la table likes
      const { error: likeError } = await supabase
        .from('likes')
        .insert({
          user_id: currentUserId,
          liked_user_id: profile.id,
          is_like: true
        });

      if (likeError) {
        console.error("Erreur lors de l'enregistrement du like:", likeError);
        return;
      }

      console.log("✅ Like enregistré");

      // Vérifier si un match a été créé (le trigger fait le travail)
      // On attend un peu que le trigger s'exécute
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${currentUserId})`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (matchError) {
        console.error("Erreur vérification match:", matchError);
      } else if (matchData && matchData.length > 0) {
        console.log("🎉 Match détecté !", matchData);
        setMatchedProfile(profile);
      }
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  // 🎯 Gestion du début du drag
  const handleDragStart = () => {
    playSwipeSound();
  };

  // 🎯 Gestion de la fin du swipe
  const handleDragEnd = (_e: any, info: any) => {
    const threshold = 100;

    if (info.offset.x > threshold) {
      // LIKE (droite)
      setExitX(1000);
      playLikeSound();
      setShowStars(true);
      handleLike(); // Enregistrer le like
      setTimeout(() => {
        onSwipe("right");
        setShowStars(false);
      }, 300);
    } else if (info.offset.x < -threshold) {
      // SKIP (gauche)
      setExitX(-1000);
      playSkipSound();
      setTimeout(() => onSwipe("left"), 200);
    }
  };

  // 🖱️ Navigation entre photos
  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[600px] bg-gray-800 rounded-2xl flex items-center justify-center">
        <p className="text-white">Chargement...</p>
      </div>
    );
  }

  const currentPhoto = photos[currentPhotoIndex] || "https://via.placeholder.com/400x600?text=No+Photo";

  return (
    <>
      <div className="relative">
        <motion.div
          className="w-full h-[600px] bg-gradient-to-b from-transparent to-black rounded-2xl overflow-hidden shadow-2xl relative cursor-grab active:cursor-grabbing"
          style={{
            x,
            rotate,
            opacity,
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          animate={exitX !== 0 ? { x: exitX } : {}}
          transition={{ duration: 0.3 }}
        >
          {/* 📸 Image principale */}
          <img
            src={currentPhoto}
            alt={profile.username}
            className="w-full h-full object-cover pointer-events-none"
          />

          {/* 💚 Indicateur LIKE */}
          <motion.div
            className="absolute top-20 right-10 text-6xl font-bold text-green-500 border-4 border-green-500 px-6 py-2 rotate-12 z-30"
            style={{ opacity: likeOpacity }}
          >
            LIKE
          </motion.div>

          {/* ❌ Indicateur NOPE */}
          <motion.div
            className="absolute top-20 left-10 text-6xl font-bold text-red-500 border-4 border-red-500 px-6 py-2 -rotate-12 z-30"
            style={{ opacity: nopeOpacity }}
          >
            NOPE
          </motion.div>

          {/* 🖱️ Boutons de navigation entre photos */}
          {photos.length > 1 && (
            <>
              {currentPhotoIndex > 0 && (
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full z-20 hover:bg-black/70"
                >
                  ←
                </button>
              )}
              {currentPhotoIndex < photos.length - 1 && (
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full z-20 hover:bg-black/70"
                >
                  →
                </button>
              )}
            </>
          )}

          {/* 🔵 Indicateurs de photos (dots) */}
          {photos.length > 1 && (
            <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 z-20">
              {photos.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all ${
                    index === currentPhotoIndex
                      ? "w-8 bg-white"
                      : "w-1 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}

          {/* 📝 Informations du profil */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
            <h2 className="text-3xl font-bold mb-2">
              {profile.username}
              {profile.age && `, ${profile.age}`}
            </h2>
            {profile.zodiac_sign && (
              <p className="text-lg mb-2">♈ {profile.zodiac_sign}</p>
            )}
            {profile.city && (
              <p className="text-sm opacity-90">📍 {profile.city}</p>
            )}
            {profile.bio && (
              <p className="mt-3 text-sm opacity-80 line-clamp-2">{profile.bio}</p>
            )}
          </div>
        </motion.div>

        {/* ✨ Effet particules d'étoiles pour le LIKE */}
        <AnimatePresence>
          {showStars && (
            <div className="absolute inset-0 pointer-events-none z-40">
              {[...Array(20)].map((_, i) => (
                <StarParticle key={i} delay={i * 0.03} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 💕 Pop-up "It's a Match!" */}
      <AnimatePresence>
        {matchedProfile && (
          <MatchPopup
            matchedProfile={matchedProfile}
            onClose={() => setMatchedProfile(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
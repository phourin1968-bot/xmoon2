"use client";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
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

export default function SwipeCard({ profile, onSwipe }: SwipeCardProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exitX, setExitX] = useState(0);

  // 🎨 Motion values pour le drag
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

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

  // 🎵 Jouer un son - NOUVEAU : recréer l'Audio à chaque fois
  const playSound = (type: "like" | "dislike") => {
    try {
      const soundPath = type === "like" ? '/sounds/like.mp3' : '/sounds/dislike.mp3';
      const sound = new Audio(soundPath);
      sound.volume = 0.5;
      sound.play().catch(err => console.log("Erreur lecture son:", err));
    } catch (err) {
      console.log("Son désactivé");
    }
  };

  // 🎯 Gestion du swipe
  const handleDragEnd = (_e: any, info: any) => {
    const threshold = 100;

    if (info.offset.x > threshold) {
      setExitX(1000);
      playSound("like");
      setTimeout(() => onSwipe("right"), 200);
    } else if (info.offset.x < -threshold) {
      setExitX(-1000);
      playSound("dislike");
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
    <motion.div
      className="w-full h-[600px] bg-gradient-to-b from-transparent to-black rounded-2xl overflow-hidden shadow-2xl relative cursor-grab active:cursor-grabbing"
      style={{
        x,
        rotate,
        opacity,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
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
  );
}
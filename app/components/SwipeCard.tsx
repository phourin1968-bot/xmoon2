"use client";

import { useState, useEffect } from "react";
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

  // 🖱️ Navigation entre photos
  const nextPhoto = () => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
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
    <div className="w-full h-[600px] bg-gradient-to-b from-transparent to-black rounded-2xl overflow-hidden shadow-2xl relative">
      
      {/* 📸 Image principale */}
      <img
        src={currentPhoto}
        alt={profile.username}
        className="w-full h-full object-cover"
      />

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
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20 bg-gradient-to-t from-black/80 to-transparent">
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
    </div>
  );
}
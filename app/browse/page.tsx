'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  full_name: string;
  username: string;
  birthdate: string;
  zodiac_sign: string;
  avatar_url: string;
}

export default function BrowsePage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    try {
      setLoading(true);
      
      // Attendre un peu pour que Supabase s'initialise
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Erreur auth:', userError);
      }
      
      if (!user) {
        console.log('Pas d\'utilisateur connecté, redirection...');
        router.push('/auth/login');
        return;
      }
      
      console.log('Utilisateur connecté:', user.id);
      setCurrentUser(user);

      // Récupérer tous les profils sauf le sien
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          zodiac_sign,
          avatar_url,
          birthdate
        `)
        .neq('id', user.id)
        .limit(50);

      if (error) {
        console.error('Erreur chargement profils:', error);
        throw error;
      }

      console.log('Profils chargés:', data?.length || 0);
      setProfiles(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des profils:', error);
    } finally {
      setLoading(false);
    }
  }

  function getAge(birthdate: string) {
    if (!birthdate) return '?';
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D0B16] via-[#16052a] to-[#3b0b6b] flex items-center justify-center">
        <div className="text-violet-300 text-xl">Chargement des profils...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0B16] via-[#16052a] to-[#3b0b6b] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0D0B16]/80 backdrop-blur-lg border-b border-violet-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-violet-300 hover:text-violet-200 transition-colors"
          >
            ← Retour
          </button>
          <h1 className="text-2xl font-bold text-slate-50">
            Parcourir les profils ✨
          </h1>
          <div className="w-16"></div>
        </div>
      </div>

      {/* Grille de profils */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {profiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-violet-300 text-lg">Aucun profil disponible pour le moment</p>
            <p className="text-slate-400 text-sm mt-2">Reviens plus tard ! 🌙</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => router.push(`/profile/${profile.id}`)}
                className="group relative cursor-pointer rounded-2xl overflow-hidden border-2 border-violet-500/30 hover:border-violet-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/30"
              >
                {/* Image du profil */}
                <div className="aspect-[3/4] relative overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-6xl">
                      👤
                    </div>
                  )}
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Signe astrologique badge */}
                  {profile.zodiac_sign && (
                    <div className="absolute top-3 right-3 bg-violet-600/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-white text-sm font-medium">
                        {profile.zodiac_sign}
                      </span>
                    </div>
                  )}

                  {/* Infos du profil */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white text-xl font-bold mb-1">
                      {profile.username || profile.full_name}, {getAge(profile.birthdate)}
                    </h3>
                    {profile.zodiac_sign && (
                      <p className="text-violet-300 text-sm">
                        {profile.zodiac_sign} ✨
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bouton flottant pour aller swiper */}
      <div className="fixed bottom-24 right-4 z-20">
        <button
          onClick={() => router.push('/discover')}
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-6 py-3 rounded-full shadow-2xl shadow-violet-500/50 flex items-center gap-2 transition-all duration-300 hover:scale-110"
        >
          <span className="text-lg">💫</span>
          <span className="font-semibold">Swiper</span>
        </button>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import Header from '@/app/components/Header';
import Image from 'next/image';

interface Profile {
  id: string;
  username: string;
  bio: string;
  city: string;
  birth_date: string;
  zodiac_sign: string;
}

interface UserPhoto {
  id: string;
  photo_url: string;
  is_primary: boolean;
  photo_order: number;
}

export default function ProfilPage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const profileId = params.id as string;

  useEffect(() => {
    loadProfile();
    loadPhotos();
    loadCurrentUser();
  }, [profileId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('user_photos')
        .select('*')
        .eq('user_id', profileId)
        .order('photo_order', { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des photos:', error);
    }
  };

  const getZodiacEmoji = (sign: string) => {
    const zodiacEmojis: { [key: string]: string } = {
      'Bélier': '♈',
      'Taureau': '♉',
      'Gémeaux': '♊',
      'Cancer': '♋',
      'Lion': '♌',
      'Vierge': '♍',
      'Balance': '♎',
      'Scorpion': '♏',
      'Sagittaire': '♐',
      'Capricorne': '♑',
      'Verseau': '♒',
      'Poissons': '♓'
    };
    return zodiacEmojis[sign] || '✨';
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const previousPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-white text-xl">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-white text-xl">Profil introuvable</div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Photo principale avec navigation */}
        <div className="relative bg-black/30 backdrop-blur-sm rounded-3xl overflow-hidden mb-6 aspect-[3/4]">
          {photos.length > 0 ? (
            <>
              <Image
                src={photos[currentPhotoIndex].photo_url}
                alt={profile.username}
                fill
                className="object-cover"
                priority
              />
              
              {/* Navigation entre les photos */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={previousPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
                  >
                    ←
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
                  >
                    →
                  </button>
                  
                  {/* Indicateurs de photos */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {photos.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 rounded-full transition-all ${
                          index === currentPhotoIndex 
                            ? 'bg-white w-6' 
                            : 'bg-white/50 w-2'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Informations en overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <h1 className="text-white text-3xl font-bold mb-2">
                  {profile.username}
                </h1>
                
                <div className="flex items-center gap-4 text-white/90 mb-3">
                  <span className="flex items-center gap-2">
                    {getZodiacEmoji(profile.zodiac_sign)} {profile.zodiac_sign}
                  </span>
                  <span className="flex items-center gap-2">
                    📍 {profile.city}
                  </span>
                </div>

                {profile.bio && (
                  <p className="text-white/80 text-sm">
                    💼 {profile.bio}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-white/50">
              Aucune photo
            </div>
          )}
        </div>

        {/* Bouton Modifier (uniquement pour son propre profil) */}
        {isOwnProfile && (
          <button
            onClick={() => router.push('/profil/edit')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-2xl transition mb-6"
          >
            ✏️ Modifier mon profil
          </button>
        )}

        {/* Informations détaillées */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white space-y-4">
          <div>
            <h3 className="text-sm text-white/60 mb-1">Signe astrologique</h3>
            <p className="text-lg">{getZodiacEmoji(profile.zodiac_sign)} {profile.zodiac_sign}</p>
          </div>

          <div>
            <h3 className="text-sm text-white/60 mb-1">Ville</h3>
            <p className="text-lg">📍 {profile.city}</p>
          </div>

          {profile.bio && (
            <div>
              <h3 className="text-sm text-white/60 mb-1">À propos</h3>
              <p className="text-lg">{profile.bio}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm text-white/60 mb-1">Photos</h3>
            <p className="text-lg">{photos.length} photo{photos.length > 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
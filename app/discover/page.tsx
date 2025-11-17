"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { SoundPlayer } from "@/lib/soundEffects";

interface Profile {
  id: string;
  full_name: string;
  username: string;
  birthdate: string;
  zodiac_sign: string;
  bio: string;
  city: string;
  avatar_url?: string;
  gender: string;
}

// Fonction de compatibilité
function calculateCompatibility(userSign: string, targetSign: string): number {
  const signs = ["Bélier", "Taureau", "Gémeaux", "Cancer", "Lion", "Vierge", "Balance", "Scorpion", "Sagittaire", "Capricorne", "Verseau", "Poissons"];
  const userIndex = signs.indexOf(userSign);
  const targetIndex = signs.indexOf(targetSign);
  if (userIndex === -1 || targetIndex === -1) return 75;
  const diff = Math.abs(userIndex - targetIndex);
  return 95 - (diff * 3);
}

export default function DiscoverPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const cardRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  // Sound player
  const soundPlayer = useRef<SoundPlayer | null>(null);

  useEffect(() => {
    // Initialiser le sound player
    soundPlayer.current = new SoundPlayer();
    
    // Charger les profils
    loadProfiles();
  }, []);

  async function loadProfiles() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Charger le profil de l'utilisateur connecté
    const { data: userData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userData) {
      setCurrentUser(userData);
    }

    // Charger les profils à découvrir
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id)
      .limit(20);

    if (profilesData) {
      setProfiles(profilesData);
    }

    setLoading(false);
  }

  async function handleAction(action: "like" | "pass" | "superlike") {
    if (currentIndex >= profiles.length || !currentUser) return;

    const currentProfile = profiles[currentIndex];

    // Jouer le son approprié
    if (action === "like" || action === "superlike") {
      soundPlayer.current?.play(action === "superlike" ? "superlike" : "like");
      setSwipeDirection("right");
    } else if (action === "pass") {
      soundPlayer.current?.play("swipe");
      setSwipeDirection("left");
    }

    // Sauvegarder l'action dans la base de données
    if (action === "like" || action === "superlike") {
      const { error: likeError } = await supabase.from("likes").insert({
        user_id: currentUser.id,
        liked_user_id: currentProfile.id,
        is_like: true,
        created_at: new Date().toISOString(),
      });

      if (likeError) {
        console.error("Erreur lors de l'enregistrement du like:", likeError);
        // Continuer quand même
      }

      // Vérifier si c'est un match (l'autre personne m'a déjà liké)
      const { data: reciprocalLike } = await supabase
        .from("likes")
        .select("*")
        .eq("user_id", currentProfile.id)
        .eq("liked_user_id", currentUser.id)
        .eq("is_like", true)
        .maybeSingle();

      if (reciprocalLike) {
        // C'est un match ! Enregistrer dans la table matches
        const { error: matchError } = await supabase.from("matches").insert({
          user1_id: currentUser.id,
          user2_id: currentProfile.id,
          created_at: new Date().toISOString(),
        });

        if (!matchError) {
          soundPlayer.current?.play("match");
          setMatchedProfile(currentProfile);
          setShowMatch(true);
          return; // Ne pas passer au profil suivant tout de suite
        }
      }
    }

    // Animation puis passer au profil suivant
    setTimeout(() => {
      setSwipeDirection(null);
      setDragOffset({ x: 0, y: 0 });
      setCurrentIndex(currentIndex + 1);
    }, 300);
  }

  function closeMatchModal() {
    setShowMatch(false);
    setMatchedProfile(null);
    setSwipeDirection(null);
    setCurrentIndex(currentIndex + 1);
  }

  // Gestion du swipe manuel
  function handleDragStart(e: React.MouseEvent | React.TouchEvent) {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startPosRef.current = { x: clientX, y: clientY };
  }

  function handleDragMove(e: React.MouseEvent | React.TouchEvent) {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - startPosRef.current.x;
    const deltaY = clientY - startPosRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  }

  function handleDragEnd() {
    if (!isDragging) return;
    setIsDragging(false);

    // Si swipe > 100px, on décide
    if (dragOffset.x > 100) {
      handleAction("like");
    } else if (dragOffset.x < -100) {
      handleAction("pass");
    } else {
      // Reset si pas assez de swipe
      setDragOffset({ x: 0, y: 0 });
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center">
        <p className="text-slate-200 text-sm">Chargement des profils...</p>
      </main>
    );
  }

  // Plus de profils à afficher
  if (currentIndex >= profiles.length) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🌙</span>
          <h2 className="text-2xl font-bold text-slate-50 mb-2">
            Plus de profils pour aujourd'hui !
          </h2>
          <p className="text-slate-400 mb-6">Reviens plus tard pour découvrir de nouvelles personnes ✨</p>
          <button
            onClick={() => router.push("/home")}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg font-semibold"
          >
            Retour à l'accueil
          </button>
        </div>
      </main>
    );
  }

  const currentProfile = profiles[currentIndex];
  const age = currentProfile.birthdate
    ? new Date().getFullYear() - new Date(currentProfile.birthdate).getFullYear()
    : null;
  const compatibility = currentUser?.zodiac_sign
    ? calculateCompatibility(currentUser.zodiac_sign, currentProfile.zodiac_sign)
    : 75;

  const rotation = isDragging ? dragOffset.x / 10 : 0;
  const opacity = isDragging ? 1 - Math.abs(dragOffset.x) / 300 : 1;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center px-4 pb-32">
      <div className="w-full max-w-md">
        {/* Compteur */}
        <div className="text-center mb-4">
          <p className="text-slate-400 text-sm">
            {currentIndex + 1} / {profiles.length}
          </p>
        </div>

        {/* Carte de profil */}
        <div
          ref={cardRef}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          style={{
            transform: swipeDirection 
              ? swipeDirection === "right" 
                ? 'translateX(400px) rotate(12deg)'
                : 'translateX(-400px) rotate(-12deg)'
              : `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
            opacity: swipeDirection ? 0 : opacity,
            cursor: isDragging ? 'grabbing' : 'grab',
            transition: isDragging ? 'none' : 'all 0.3s ease',
          }}
          className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Photo */}
          {currentProfile.avatar_url ? (
            <img
              src={currentProfile.avatar_url}
              alt={currentProfile.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <span className="text-9xl">👤</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

          {/* Indicateurs de swipe */}
          {isDragging && Math.abs(dragOffset.x) > 20 && (
            <>
              {dragOffset.x > 0 && (
                <div className="absolute top-20 left-8 px-6 py-3 bg-green-500/90 text-white text-2xl font-bold rounded-xl border-4 border-green-400 rotate-12">
                  ❤️ LIKE
                </div>
              )}
              {dragOffset.x < 0 && (
                <div className="absolute top-20 right-8 px-6 py-3 bg-red-500/90 text-white text-2xl font-bold rounded-xl border-4 border-red-400 -rotate-12">
                  ❌ PASSER
                </div>
              )}
            </>
          )}

          {/* Badge compatibilité */}
          <div className="absolute top-4 right-4 bg-gradient-to-br from-violet-600 to-fuchsia-600 px-4 py-2 rounded-full shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">{compatibility}%</span>
              <span className="text-white text-xs">compatible</span>
            </div>
          </div>

          {/* Infos en bas */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="text-4xl font-bold mb-2">
              {currentProfile.username || currentProfile.full_name}
              {age && <span className="text-3xl font-normal">, {age}</span>}
            </h2>
            <div className="flex items-center gap-2 text-lg mb-3">
              <span>{currentProfile.zodiac_sign}</span>
              <span>•</span>
              <span>{currentProfile.city}</span>
            </div>
            {currentProfile.bio && (
              <p className="text-slate-200 text-sm line-clamp-2">{currentProfile.bio}</p>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-center items-center gap-6 mt-8">
          {/* Pass */}
          <button
            onClick={() => handleAction("pass")}
            className="w-16 h-16 bg-red-500/50 hover:bg-red-500/60 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-red-400/80 text-3xl transition-all hover:scale-110 shadow-lg"
            title="Passer"
          >
            ✖️
          </button>

          {/* Super Like */}
          <button
            onClick={() => handleAction("superlike")}
            className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-full flex items-center justify-center text-3xl transition-all hover:scale-110 shadow-lg shadow-blue-500/50"
            title="Super Like !"
          >
            ⭐
          </button>

          {/* Like */}
          <button
            onClick={() => handleAction("like")}
            className="w-16 h-16 bg-gradient-to-br from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 rounded-full flex items-center justify-center text-3xl transition-all hover:scale-110 shadow-lg shadow-pink-500/50"
            title="J'aime !"
          >
            ❤️
          </button>
        </div>

        {/* Bouton voir profil complet */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push(`/profile/${currentProfile.id}`)}
            className="text-violet-400 hover:text-violet-300 text-sm font-medium"
          >
            Voir le profil complet →
          </button>
        </div>
      </div>

      {/* Modal de Match */}
      {showMatch && matchedProfile && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4">
            {/* Confettis */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 50 }).map((_, i) => {
                const colors = ["#a855f7", "#ec4899", "#f97316", "#eab308"];
                return (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full animate-fall"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: "-10px",
                      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${2 + Math.random() * 2}s`,
                    }}
                  />
                );
              })}
            </div>

            {/* Contenu du modal */}
            <div className="bg-slate-900 border-2 border-violet-600 rounded-3xl p-8 max-w-md w-full text-center relative z-10">
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-4">
                It's a Match ! 🎉
              </h2>
              <p className="text-slate-300 mb-6">
                Toi et {matchedProfile.username} vous êtes liké mutuellement !
              </p>

              {/* Photos côte à côte */}
              <div className="flex justify-center gap-4 mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-violet-500">
                  {currentUser?.avatar_url ? (
                    <img src={currentUser.avatar_url} alt="Toi" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-3xl">
                      👤
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <span className="text-4xl">💕</span>
                </div>
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-pink-500">
                  {matchedProfile.avatar_url ? (
                    <img src={matchedProfile.avatar_url} alt={matchedProfile.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center text-3xl">
                      👤
                    </div>
                  )}
                </div>
              </div>

              {/* Boutons */}
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/chat/${matchedProfile.id}`)}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-lg transition-all"
                >
                  Envoyer un message 💬
                </button>
                <button
                  onClick={closeMatchModal}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-all"
                >
                  Continuer à swiper
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
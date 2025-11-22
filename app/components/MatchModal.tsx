"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, X } from "lucide-react";

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchedUser: {
    id: string;
    username: string;
    avatar_url?: string;
    zodiac_sign?: string;
  };
  matchId: string;
}

interface FloatingHeart {
  id: number;
  x: number;
  delay: number;
  size: number;
}

export default function MatchModal({ isOpen, onClose, matchedUser, matchId }: MatchModalProps) {
  const router = useRouter();
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Déclencher l'animation de cœurs à l'ouverture
      triggerHeartsAnimation();
    }
  }, [isOpen]);

  const triggerHeartsAnimation = () => {
    const hearts: FloatingHeart[] = [];
    const heartCount = 30; // Beaucoup de cœurs !
    
    for (let i = 0; i < heartCount; i++) {
      hearts.push({
        id: Date.now() + i,
        x: Math.random() * 100, // Position X aléatoire (0-100%)
        delay: Math.random() * 1, // Délai aléatoire (0-1s)
        size: 1.5 + Math.random() * 2 // Taille aléatoire (1.5-3.5rem)
      });
    }
    
    setFloatingHearts(hearts);
    
    // Nettoyer après l'animation
    setTimeout(() => {
      setFloatingHearts([]);
    }, 4000);
  };

  const handleSendMessage = () => {
    router.push(`/chat/${matchId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* Cœurs flottants */}
      {floatingHearts.map((heart) => (
        <div
          key={heart.id}
          className="floating-heart-match"
          style={{
            left: `${heart.x}%`,
            animationDelay: `${heart.delay}s`,
            fontSize: `${heart.size}rem`
          }}
        >
          💕
        </div>
      ))}

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scaleIn">
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Titre */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-white mb-2 animate-bounce">
            🎉 C'est un Match ! 🎉
          </h2>
          <p className="text-white/90 text-lg">
            Vous vous êtes likés mutuellement !
          </p>
        </div>

        {/* Profils */}
        <div className="flex justify-center items-center gap-4 mb-8">
          {/* Profil utilisateur actuel (toi) */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md border-4 border-white overflow-hidden">
              <img
                src="https://i.pravatar.cc/100"
                alt="You"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Icône cœur au milieu */}
          <div className="animate-pulse">
            <Heart className="w-12 h-12 text-pink-300 fill-pink-300" />
          </div>

          {/* Profil de l'autre personne */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md border-4 border-white overflow-hidden">
              <img
                src={matchedUser.avatar_url || "https://i.pravatar.cc/101"}
                alt={matchedUser.username}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Nom et signe */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-semibold text-white mb-1">
            {matchedUser.username}
          </h3>
          {matchedUser.zodiac_sign && (
            <p className="text-white/80 text-sm">
              ♈ {matchedUser.zodiac_sign}
            </p>
          )}
        </div>

        {/* Boutons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSendMessage}
            className="w-full bg-white text-purple-600 font-semibold py-4 rounded-full flex items-center justify-center gap-2 hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
            Envoyer un message
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-white/20 backdrop-blur-md text-white font-medium py-3 rounded-full hover:bg-white/30 transition-all border border-white/30"
          >
            Plus tard
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes floatUpMatch {
          0% {
            transform: translateY(0) rotate(0deg) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(-10vh) rotate(45deg) scale(1);
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(180deg) scale(1.5);
            opacity: 0;
          }
        }

        .floating-heart-match {
          position: fixed;
          bottom: -50px;
          animation: floatUpMatch 4s ease-out forwards;
          pointer-events: none;
          z-index: 9999;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const steps = [
  {
    id: 1,
    icon: "🌙",
    title: "Crée ton profil astral",
    description:
      "Entre ta date, heure et lieu de naissance. On calcule ton thème astral complet : Soleil, Lune, Ascendant et plus encore.",
    visual: "✨🌙✨",
    color: "from-violet-600 to-indigo-600",
  },
  {
    id: 2,
    icon: "🔮",
    title: "Découvre ta compatibilité",
    description:
      "Notre algorithme analyse les positions planétaires pour calculer ta compatibilité réelle avec chaque profil. Pas de hasard, que de la magie stellaire !",
    visual: "♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓",
    color: "from-indigo-600 to-purple-600",
  },
  {
    id: 3,
    icon: "💜",
    title: "Swipe & Match",
    description:
      "Découvre des profils compatibles avec ton énergie cosmique. Like ceux qui te plaisent. Quand c'est réciproque... c'est un Match écrit dans les étoiles !",
    visual: "💜 → ❤️ → 💫",
    color: "from-purple-600 to-pink-600",
  },
  {
    id: 4,
    icon: "💬",
    title: "Discute avec tes Matchs",
    description:
      "Une fois matchés, la conversation peut commencer ! Parle, flirte, apprends à vous connaître. Les étoiles vous ont réunis, à vous de jouer !",
    visual: "💬 💕 🌟",
    color: "from-pink-600 to-rose-600",
  },
  {
    id: 5,
    icon: "🤖",
    title: "Confident IA",
    description:
      "Ton ami quotidien, disponible 24h/24. Basé sur ton signe, il te comprend, te conseille et t'accompagne dans ta quête amoureuse. Pose-lui toutes tes questions !",
    visual: "🤖💜✨",
    color: "from-rose-600 to-violet-600",
  },
];

export default function HowItWorksPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (index: number) => {
    setCurrentStep(index);
  };

  const handleStart = () => {
    router.push("/profil/setup");
  };

  const step = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-violet-950/30 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌙</span>
          <span className="text-xl font-bold text-white tracking-wide">
            Xmoon
          </span>
        </div>
        <button
          onClick={() => router.push("/auth/login")}
          className="text-violet-300 hover:text-white transition-colors text-sm"
        >
          Passer
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        {/* Étoiles décoratives */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-2xl opacity-20 animate-pulse">
            ✦
          </div>
          <div
            className="absolute top-40 right-16 text-xl opacity-30 animate-pulse"
            style={{ animationDelay: "0.5s" }}
          >
            ✧
          </div>
          <div
            className="absolute top-60 left-1/4 text-lg opacity-20 animate-pulse"
            style={{ animationDelay: "1s" }}
          >
            ✦
          </div>
          <div
            className="absolute bottom-40 right-1/4 text-2xl opacity-25 animate-pulse"
            style={{ animationDelay: "1.5s" }}
          >
            ✧
          </div>
          <div
            className="absolute bottom-60 left-16 text-xl opacity-20 animate-pulse"
            style={{ animationDelay: "0.7s" }}
          >
            ⋆
          </div>
        </div>

        {/* Card principale */}
        <div
          className={`relative w-full max-w-md bg-gradient-to-br ${step.color} rounded-3xl p-8 shadow-2xl transform transition-all duration-500`}
          style={{
            boxShadow: "0 25px 50px -12px rgba(139, 92, 246, 0.35)",
          }}
        >
          {/* Numéro de l'étape */}
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-violet-600 font-bold text-lg">
              {step.id}
            </span>
          </div>

          {/* Icône principale */}
          <div className="text-center mb-6">
            <span className="text-6xl">{step.icon}</span>
          </div>

          {/* Titre */}
          <h2 className="text-2xl font-bold text-white text-center mb-4">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-white/90 text-center leading-relaxed mb-6">
            {step.description}
          </p>

          {/* Visual */}
          <div className="text-center text-3xl tracking-widest opacity-80">
            {step.visual}
          </div>
        </div>

        {/* Flèches de navigation */}
        <div className="flex items-center justify-between w-full max-w-md mt-8 px-4">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              currentStep === 0
                ? "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                : "bg-violet-600/30 text-violet-300 hover:bg-violet-600/50 hover:text-white hover:scale-110"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Dots de progression */}
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentStep
                    ? "bg-violet-400 w-8"
                    : "bg-slate-600 hover:bg-slate-500"
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextStep}
            disabled={currentStep === steps.length - 1}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              currentStep === steps.length - 1
                ? "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                : "bg-violet-600/30 text-violet-300 hover:bg-violet-600/50 hover:text-white hover:scale-110"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Bouton Commencer (visible à la dernière étape) */}
        {currentStep === steps.length - 1 && (
          <button
            onClick={handleStart}
            className="mt-8 px-10 py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all animate-pulse"
          >
            Commencer l'aventure ✨
          </button>
        )}
      </main>

      {/* Footer - indicateur de scroll */}
      <footer className="fixed bottom-8 left-0 right-0 flex justify-center">
        {currentStep < steps.length - 1 && (
          <button
            onClick={nextStep}
            className="flex flex-col items-center text-violet-400/60 hover:text-violet-300 transition-colors animate-bounce"
          >
            <span className="text-xs mb-1">Suivant</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}
      </footer>
    </div>
  );
}
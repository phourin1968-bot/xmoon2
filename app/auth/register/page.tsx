"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AlertCircle, CheckCircle, Mail } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    if (!displayName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg("Tous les champs sont obligatoires");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
        return;
      }

      // Vérifie si un compte existe déjà avec cet email
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setErrorMsg("Un compte avec cet email existe déjà");
        setIsLoading(false);
        return;
      }

      // Si l'email de confirmation a été envoyé
      if (data.user?.confirmation_sent_at) {
        setRegistrationSuccess(true);
      }
      
      setIsLoading(false);
      
    } catch (err) {
      setErrorMsg("Une erreur est survenue");
      setIsLoading(false);
    }
  }

  // Si l'inscription a réussi et l'email de vérification a été envoyé
  if (registrationSuccess) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-slate-950/80 border border-violet-700/60 rounded-2xl shadow-[0_0_40px_rgba(88,28,135,0.65)] p-8">
          {/* Icône de succès */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-2xl font-bold text-slate-50 text-center mb-3">
            ✅ Compte créé avec succès !
          </h1>

          {/* Message principal */}
          <div className="bg-violet-900/20 border border-violet-700/40 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Mail className="w-6 h-6 text-violet-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-slate-200 font-semibold mb-2">
                  Vérifie ta boîte mail !
                </p>
                <p className="text-slate-300 text-sm">
                  Nous t'avons envoyé un email à <span className="text-violet-400 font-semibold">{email}</span>
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  Clique sur le lien dans l'email pour activer ton compte et commencer ton aventure sur Xmoon 🌙
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-slate-900/50 border border-slate-700/40 rounded-lg p-4 mb-6">
            <p className="text-slate-400 text-xs text-center">
              💡 Tu ne vois pas l'email ? Vérifie tes spams ou courriers indésirables
            </p>
          </div>

          {/* Bouton retour */}
          <button
            onClick={() => router.push("/auth/login")}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-all"
          >
            Retour à la connexion
          </button>
        </div>
      </main>
    );
  }

  // Formulaire d'inscription normal
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-950/80 border border-violet-700/60 rounded-2xl shadow-[0_0_40px_rgba(88,28,135,0.65)] p-8">
        {/* Logo / Titre */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-50 mb-2">
            🌙 Xmoon
          </h1>
          <p className="text-slate-400 text-sm">
            Crée ton compte et trouve ta moitié cosmique ✨
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Message d'erreur */}
          {errorMsg && (
            <div className="p-4 bg-red-900/30 border border-red-700/40 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{errorMsg}</p>
            </div>
          )}

          {/* Prénom ou pseudo */}
          <div>
            <label className="block text-slate-300 text-sm mb-2">
              Prénom ou pseudo
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ton prénom ou pseudo"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-slate-300 text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-slate-300 text-sm mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">
              Minimum 6 caractères (règle Supabase).
            </p>
          </div>

          {/* Bouton inscription */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isLoading ? "Création en cours..." : "Créer mon compte"}
          </button>

          {/* Lien connexion */}
          <div className="text-center mt-4">
            <p className="text-slate-400 text-sm">
              Déjà un compte ?{" "}
              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                className="text-violet-400 hover:text-violet-300 font-semibold"
              >
                Me connecter
              </button>
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            Xmoon - L'amour écrit dans les étoiles 🌟
          </p>
        </div>
      </div>
    </main>
  );
}
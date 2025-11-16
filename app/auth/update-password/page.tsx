"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    // Vérifier si on a un token de réinitialisation valide
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidToken(true);
      } else {
        setMessage("❌ Lien invalide ou expiré. Demande un nouveau lien.");
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Vérifier que les mots de passe correspondent
    if (password !== confirmPassword) {
      setMessage("❌ Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    // Vérifier la longueur minimale
    if (password.length < 8) {
      setMessage("❌ Le mot de passe doit contenir au moins 8 caractères.");
      setLoading(false);
      return;
    }

    // Mettre à jour le mot de passe
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setMessage("❌ Erreur : " + error.message);
      setLoading(false);
    } else {
      setMessage("✅ Mot de passe mis à jour ! Redirection...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    }
  }

  if (!validToken && message.includes("invalide")) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-slate-950/80 border border-violet-700/60 rounded-2xl shadow-[0_0_40px_rgba(88,28,135,0.65)] p-8">
          {/* Icône erreur */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-rose-600 rounded-full flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>
          </div>

          {/* Message d'erreur */}
          <h1 className="text-2xl font-bold text-slate-50 text-center mb-3">
            Lien invalide ou expiré
          </h1>
          <p className="text-slate-300 text-center mb-6">{message}</p>

          {/* Boutons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push("/auth/reset-password")}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-lg transition-all"
            >
              Demander un nouveau lien
            </button>
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full py-3 text-slate-400 hover:text-slate-200 text-sm transition-all"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-950/80 border border-violet-700/60 rounded-2xl shadow-[0_0_40px_rgba(88,28,135,0.65)] p-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-4xl">🌙</span>
          <h1 className="text-3xl font-bold text-slate-50">Xmoon</h1>
        </div>

        {/* Titre */}
        <h2 className="text-xl font-semibold text-slate-200 text-center mb-2">
          Nouveau mot de passe
        </h2>
        <p className="text-slate-400 text-sm text-center mb-6">
          Choisis un nouveau mot de passe sécurisé pour ton compte.
        </p>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 caractères"
              minLength={8}
              className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retape ton mot de passe"
              minLength={8}
              className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Message de feedback */}
          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.includes("✅")
                  ? "bg-green-900/30 text-green-300"
                  : "bg-red-900/30 text-red-300"
              }`}
            >
              {message}
            </div>
          )}

          {/* Bouton submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </button>
        </form>

        {/* Conseils sécurité */}
        <div className="mt-6 p-3 bg-violet-900/20 border border-violet-700/40 rounded-lg">
          <p className="text-xs text-slate-400 text-center">
            💡 Utilise au moins 8 caractères avec des lettres, chiffres et symboles.
          </p>
        </div>
      </div>
    </main>
  );
}
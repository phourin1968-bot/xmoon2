"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      setMessage("❌ Erreur : " + error.message);
    } else {
      setMessage("✅ Email envoyé ! Vérifie ta boîte mail.");
      setEmailSent(true);
    }

    setLoading(false);
  }

  if (emailSent) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-slate-950/80 border border-violet-700/60 rounded-2xl shadow-[0_0_40px_rgba(88,28,135,0.65)] p-8">
          {/* Icône succès */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-4xl">✉️</span>
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-2xl font-bold text-slate-50 text-center mb-3">
            Email envoyé !
          </h1>

          {/* Message */}
          <p className="text-slate-300 text-center mb-2">
            Nous avons envoyé un lien de réinitialisation à :
          </p>
          <p className="text-violet-400 font-semibold text-center mb-6">{email}</p>

          <p className="text-slate-400 text-sm text-center mb-6">
            Clique sur le lien dans l'email pour créer un nouveau mot de passe. Le lien
            expire dans 1 heure.
          </p>

          {/* Bouton retour */}
          <button
            onClick={() => router.push("/auth/login")}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-lg transition-all"
          >
            Retour à la connexion
          </button>

          {/* Note */}
          <div className="mt-6 p-3 bg-violet-900/20 border border-violet-700/40 rounded-lg">
            <p className="text-xs text-slate-400 text-center">
              💡 Si tu ne reçois pas l'email, vérifie tes spams ou réessaie.
            </p>
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
          Mot de passe oublié ?
        </h2>
        <p className="text-slate-400 text-sm text-center mb-6">
          Entre ton email et on t'enverra un lien pour réinitialiser ton mot de passe.
        </p>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
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
            {loading ? "Envoi en cours..." : "Envoyer le lien"}
          </button>
        </form>

        {/* Lien retour */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/auth/login")}
            className="text-slate-400 hover:text-violet-400 text-sm transition-colors"
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>
    </main>
  );
}
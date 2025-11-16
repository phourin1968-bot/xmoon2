"use client";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.push("/profil");
        return;
      }
      setCheckingSession(false);
    }
    checkUser();
  }, [router]);

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center">
        <p className="text-slate-200 text-sm">Chargement…</p>
      </main>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // Vérifier si le profil est complet
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username, birthdate")
        .eq("id", data.user.id)
        .single();

      // Si le profil est incomplet → /profil pour finir l'onboarding
      if (!profile || !profile.full_name || !profile.username || !profile.birthdate) {
        router.push("/profil");
      } else {
        // Profil complet → /home
        router.push("/home");
      }
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-950/80 border border-violet-700/60 rounded-2xl shadow-[0_0_40px_rgba(88,28,135,0.65)] p-8">
        {/* Logo et titre */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-4xl">🌙</span>
          <h1 className="text-3xl font-bold text-slate-50">Xmoon</h1>
        </div>
        
        <p className="text-center text-slate-400 text-sm mb-6">
          Espace confidentiel - univers violet & argent ✨
        </p>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-1">Email</label>
            <input
              type="email"
              placeholder="toi@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-1">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
            <p className="text-xs text-slate-500 mt-1">Minimum 8 caractères (règle Supabase).</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-900/30 border border-red-700/40 rounded-lg text-red-300 text-sm">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {/* Liens */}
        <div className="mt-6 space-y-3 text-center">
          <p className="text-slate-400 text-sm">
            Pas encore de compte ?{" "}
            <button
              onClick={() => router.push("/auth/register")}
              className="text-violet-400 hover:text-violet-300 font-medium"
            >
              Créer un compte
            </button>
          </p>
          <button
            onClick={() => router.push("/auth/reset-password")}
            className="text-slate-500 hover:text-slate-300 text-sm"
          >
            Mot de passe oublié ?
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Xmoon - version alpha - violet, argent & Supabase 🚀
        </p>
      </div>
    </main>
  );
}
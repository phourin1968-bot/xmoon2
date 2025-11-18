"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    // 1) Créer le compte Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;
    if (!user) {
      setErrorMsg("Impossible de récupérer l'utilisateur.");
      setLoading(false);
      return;
    }

    // 2) Créer le profil initial dans la table "profiles"
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      full_name: fullName,
    });

    if (profileError) {
      setErrorMsg(profileError.message);
      setLoading(false);
      return;
    }

    // 3) Redirection vers la page de setup du profil
    // (et non pas /home directement)
    router.push("/profil/setup");
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
          Crée ton compte et trouve ta moitié cosmique ✨
        </p>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-1">Prénom ou pseudo</label>
            <input
              type="text"
              placeholder="Ton prénom"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-900/50 border border-violet-600/40 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

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
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        {/* Liens */}
        <div className="mt-6 space-y-3 text-center">
          <p className="text-slate-400 text-sm">
            Déjà un compte ?{" "}
            <button
              onClick={() => router.push("/auth/login")}
              className="text-violet-400 hover:text-violet-300 font-medium"
            >
              Me connecter
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
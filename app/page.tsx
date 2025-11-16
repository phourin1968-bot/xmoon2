"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage("❌ Erreur inscription : " + error.message);
    } else {
      setMessage(
        "✅ Inscription réussie ! Vérifie ta boîte mail si la confirmation est activée."
      );
    }
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage("❌ Erreur connexion : " + error.message);
    } else {
      setMessage("✅ Connexion réussie !");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-950/80 border border-violet-700/60 rounded-2xl shadow-[0_0_40px_rgba(88,28,135,0.65)] p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-xl font-bold border border-yellow-400/70 shadow-[0_0_25px_rgba(234,179,8,0.5)]">
            🌙
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-50 tracking-wide">
              Xmoon
            </h1>
            <p className="text-xs text-slate-300">
              Espace confidentiel · univers violet & argent ✨
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <form className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-slate-100">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-violet-600/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@exemple.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-100">Mot de passe</label>
            <input
              type="password"
              className="w-full rounded-lg border border-violet-600/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <p className="text-[11px] text-slate-400">
              Minimum 6 caractères (règle Supabase).
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-4 py-2.5 text-sm font-medium text-slate-50 shadow-md shadow-violet-700/40 hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Se connecter
            </button>
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full rounded-full border border-slate-300/60 bg-slate-950/70 px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-900/80 hover:border-yellow-400/80 hover:text-yellow-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Créer un compte
            </button>
          </div>
        </form>

        {/* Message d'état */}
        {message && (
          <div className="text-xs text-center text-slate-100 bg-slate-900/90 border border-violet-600/70 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        {/* Petit footer */}
        <p className="text-[11px] text-center text-slate-400">
          Xmoon · version alpha · violet, argent & Supabase 🚀
        </p>
      </div>
    </main>
  );
}

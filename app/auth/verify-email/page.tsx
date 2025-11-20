"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth/login");
        return;
      }
      
      setEmail(user.email || "");
      
      // Vérifier si l'email est déjà confirmé
      if (user.email_confirmed_at) {
        router.push("/profil/setup"); // ✅ CORRIGÉ : /app/profil/setup
        return;
      }
    }
    
    checkAuth();
    
    // Vérifier périodiquement (toutes les 5 secondes)
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        clearInterval(interval);
        router.push("profil/setup"); // ✅ CORRIGÉ
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [router]);

  async function handleResendEmail() {
    setResending(true);
    setMessage("");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
    });

    if (error) {
      setMessage("❌ Erreur lors de l'envoi : " + error.message);
    } else {
      setMessage("✅ Email envoyé ! Vérifie ta boîte mail.");
    }

    setResending(false);
  }

  async function handleCheckVerification() {
    setChecking(true);
    setMessage("");

    try {
      // Rafraîchir la session pour obtenir les dernières données
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        setMessage("❌ Erreur : " + error.message);
        setChecking(false);
        return;
      }

      if (session?.user?.email_confirmed_at) {
        setMessage("✅ Email vérifié ! Redirection...");
        setTimeout(() => {
          router.push("/profil/setup"); // ✅ CORRIGÉ
        }, 1500);
      } else {
        setMessage("⚠️ Email pas encore vérifié. Vérifie ta boîte mail !");
      }
    } catch (err) {
      setMessage("❌ Erreur lors de la vérification");
    }

    setChecking(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-950/80 border border-violet-700/60 rounded-2xl shadow-[0_0_40px_rgba(88,28,135,0.65)] p-8">
        {/* Icône email */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center">
            <span className="text-4xl">📧</span>
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-2xl font-bold text-slate-50 text-center mb-3">
          Vérifie ton email
        </h1>

        {/* Message */}
        <p className="text-slate-300 text-center mb-2">
          Nous avons envoyé un email de vérification à :
        </p>
        <p className="text-violet-400 font-semibold text-center mb-6">{email}</p>

        <p className="text-slate-400 text-sm text-center mb-6">
          Clique sur le lien dans l'email pour activer ton compte. Si tu ne vois pas
          l'email, vérifie tes spams.
        </p>

        {/* Message de feedback */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm text-center ${
              message.includes("✅")
                ? "bg-green-900/30 text-green-300"
                : message.includes("⚠️")
                ? "bg-yellow-900/30 text-yellow-300"
                : "bg-red-900/30 text-red-300"
            }`}
          >
            {message}
          </div>
        )}

        {/* Boutons */}
        <div className="space-y-3">
          <button
            onClick={handleCheckVerification}
            disabled={checking}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checking ? "Vérification..." : "J'ai vérifié mon email"}
          </button>

          <button
            onClick={handleResendEmail}
            disabled={resending}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? "Envoi..." : "Renvoyer l'email"}
          </button>

          <button
            onClick={() => router.push("/auth/login")}
            className="w-full py-3 text-slate-400 hover:text-slate-200 text-sm transition-all"
          >
            Retour à la connexion
          </button>
        </div>

        {/* Note */}
        <div className="mt-6 p-3 bg-violet-900/20 border border-violet-700/40 rounded-lg">
          <p className="text-xs text-slate-400 text-center">
            💡 L'email peut prendre quelques minutes à arriver. Vérifie aussi tes spams !
          </p>
        </div>
      </div>
    </main>
  );
}
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

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

    // 1) Creation Auth
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

    // 2) Création du profil dans la table "profiles"
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      full_name: fullName,
    });

    if (profileError) {
      setErrorMsg(profileError.message);
      setLoading(false);
      return;
    }

    // 3) Redirection
    router.push("/home");
  };

  return (
    <div className="page-content">
      <h2 style={{ color: "white" }}>Créer un compte</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="text"
          placeholder="Prénom ou pseudo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {errorMsg && <p style={{ color: "#ff8080" }}>{errorMsg}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Création..." : "Créer mon compte"}
        </button>
      </form>

      <p style={{ marginTop: 15 }}>
        Déjà un compte ? <a href="/auth/login">Me connecter</a>
      </p>
    </div>
  );
}

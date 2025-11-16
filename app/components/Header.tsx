"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    setMenuOpen(false);
    await supabase.auth.signOut();
    // Force la redirection et le rafraîchissement
    window.location.href = "/auth/login";
  }

  // Pages publiques où on ne doit PAS afficher le header
  const publicPages = [
    "/auth/login",
    "/auth/register",
    "/auth/reset-password",
    "/auth/update-password",
    "/auth/verify-email",
  ];

  // Ne pas afficher pendant le chargement
  if (loading) {
    return null;
  }

  // Ne pas afficher si:
  // 1. Pas authentifié
  // 2. Sur une page publique
  if (!isAuthenticated || publicPages.some((page) => pathname?.startsWith(page))) {
    return null;
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-violet-700/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">🌙</span>
            <h1 className="text-xl font-bold text-slate-50">Xmoon</h1>
          </div>

          {/* Barre de recherche */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un membre..."
                className="w-full px-4 py-2 pl-10 bg-slate-900/50 border border-violet-600/40 rounded-full text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const searchTerm = e.currentTarget.value;
                    if (searchTerm.trim()) {
                      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
                    }
                  }
                }}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
            </div>
          </div>

          {/* Menu hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-slate-300 hover:text-white transition-colors flex-shrink-0"
            aria-label="Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Menu déroulant */}
      <div
        className={`fixed top-16 right-4 z-50 w-64 bg-slate-900 border border-violet-700/40 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${
          menuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="p-2">
          {/* Mon Profil */}
          <button
            onClick={() => {
              setMenuOpen(false);
              router.push("/profil");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-violet-600/20 rounded-lg transition-colors"
          >
            <span className="text-xl">👤</span>
            <span className="font-medium">Mon Profil</span>
          </button>

          {/* Paramètres */}
          <button
            onClick={() => {
              setMenuOpen(false);
              router.push("/settings");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-violet-600/20 rounded-lg transition-colors"
          >
            <span className="text-xl">⚙️</span>
            <span className="font-medium">Paramètres</span>
          </button>

          {/* Séparateur */}
          <div className="my-2 border-t border-slate-700" />

          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  );
}
"use client";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const navItems = [
  { href: '/discover', icon: '🔥', label: 'Discover' },
  { href: '/confident', icon: '🤖', label: 'IA' },
  { href: '/astro', icon: '✨', label: 'Astro' },
  { href: '/matches', icon: '❤️', label: 'Matches' },
  { href: '/chat', icon: '💬', label: 'Chat' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
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

  const handleNav = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router]
  );

  // Pages publiques où on ne doit PAS afficher la bottom nav
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
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md border-t border-violet-700/30 z-40">
      <div className="max-w-md mx-auto px-2 py-3 flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => handleNav(item.href)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                isActive
                  ? "text-violet-400 bg-violet-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
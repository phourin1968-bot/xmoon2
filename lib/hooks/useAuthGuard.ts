"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";

/**
 * Hook pour protéger les pages qui nécessitent une authentification
 * et un email vérifié
 */
export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      // Pages publiques qui ne nécessitent pas d'auth
      const publicPages = [
        "/auth/login",
        "/auth/register",
        "/auth/reset-password",
        "/auth/verify-email",
      ];

      // Si on est sur une page publique, pas besoin de vérifier
      if (publicPages.some((page) => pathname?.startsWith(page))) {
        setLoading(false);
        return;
      }

      // Vérifier si l'utilisateur est connecté
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Pas connecté → rediriger vers login
        router.push("/auth/login");
        return;
      }

      // Vérifier si l'email est confirmé
      if (!user.email_confirmed_at) {
        // Email non vérifié → rediriger vers page de vérification
        router.push("/auth/verify-email");
        return;
      }

      setUser(user);
      setLoading(false);
    }

    checkAuth();

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/auth/login");
      } else if (!session.user.email_confirmed_at) {
        router.push("/auth/verify-email");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  return { loading, user };
}
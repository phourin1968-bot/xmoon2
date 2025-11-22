"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/app/components/Header";
import { useRouter } from "next/navigation";

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  matched_user: {
    username: string;
    avatar_url: string | null;
  };
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer les matchs
      const { data: matchesData, error } = await supabase
        .from("matches")
        .select(`
          id,
          user1_id,
          user2_id,
          created_at
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur chargement matches:", error);
        return;
      }

      // Pour chaque match, récupérer les infos de l'autre personne
      const matchesWithProfiles = await Promise.all(
        (matchesData || []).map(async (match) => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", otherUserId)
            .single();

          return {
            ...match,
            matched_user: profile || { username: "Utilisateur", avatar_url: null }
          };
        })
      );

      setMatches(matchesWithProfiles);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <p className="text-white text-xl">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Mes Matches 💕</h1>

        {matches.length === 0 ? (
          <div className="text-center text-white/70 mt-12">
            <p className="text-xl mb-4">Aucun match pour le moment</p>
            <p className="text-sm">Continue à swiper pour trouver ton âme sœur ! ✨</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden cursor-pointer hover:bg-white/20 transition"
                onClick={() => {
                console.log("Match ID:", match.id);
                router.push(`/chat/${match.id}`);
                }}
              >
                <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-900 flex items-center justify-center">
                  {match.matched_user.avatar_url ? (
                    <img
                      src={match.matched_user.avatar_url}
                      alt={match.matched_user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-6xl">👤</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-lg">
                    {match.matched_user.username}
                  </h3>
                  <button className="mt-2 w-full bg-gradient-to-r from-purple-700 to-pink-300 text-white py-2 rounded-full text-sm font-medium">
                    Envoyer un message
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

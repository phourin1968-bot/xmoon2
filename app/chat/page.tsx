"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/app/components/Header";
import { useRouter } from "next/navigation";

interface Conversation {
  match_id: string;
  other_user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  last_message: {
    content: string;
    created_at: string;
  } | null;
  unread_count: number;
}

export default function ChatListPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Récupérer tous les matches de l'utilisateur
      const { data: matches } = await supabase
        .from("matches")
        .select("id, user1_id, user2_id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!matches) {
        setLoading(false);
        return;
      }

      // Pour chaque match, récupérer les infos de l'autre personne et le dernier message
      const conversationsData = await Promise.all(
        matches.map(async (match) => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;

          // Infos de l'autre utilisateur
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .eq("id", otherUserId)
            .single();

         // Dernier message de la conversation
        const { data: messages } = await supabase
        .from("messages")
         .select("content, created_at")
        .eq("match_id", match.id)
       .order("created_at", { ascending: false })
        .limit(1);

      const lastMessage = messages && messages.length > 0 ? messages[0] : null;             

          return {
            match_id: match.id,
            other_user: profile || { id: otherUserId, username: "Utilisateur", avatar_url: null },
            last_message: lastMessage || null,
            unread_count: 0 // TODO: implémenter le compteur de messages non lus
          };
        })
      );

      // Trier par date du dernier message (les plus récents en premier)
      conversationsData.sort((a, b) => {
        if (!a.last_message) return 1;
        if (!b.last_message) return -1;
        return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
      });

      setConversations(conversationsData);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    } else if (diffInHours < 48) {
      return "Hier";
    } else {
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
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
        <h1 className="text-3xl font-bold text-white mb-6">Messages 💬</h1>

        {conversations.length === 0 ? (
          <div className="text-center text-white/70 mt-12">
            <p className="text-xl mb-4">Aucune conversation pour le moment</p>
            <p className="text-sm mb-6">Commence à matcher pour démarrer des conversations ! ✨</p>
            <button
              onClick={() => router.push("/discover")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-medium transition"
            >
              Découvrir des profils
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.match_id}
                onClick={() => router.push(`/chat/${conv.match_id}`)}
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-2xl p-4 cursor-pointer transition flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {conv.other_user.avatar_url ? (
                    <img
                      src={conv.other_user.avatar_url}
                      alt={conv.other_user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">👤</span>
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-semibold text-lg truncate">
                      {conv.other_user.username}
                    </h3>
                    {conv.last_message && (
                      <span className="text-white/60 text-sm ml-2 flex-shrink-0">
                        {formatTime(conv.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm truncate">
                    {conv.last_message?.content || "Aucun message"}
                  </p>
                </div>

                {/* Badge messages non lus */}
                {conv.unread_count > 0 && (
                  <div className="bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                    {conv.unread_count}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
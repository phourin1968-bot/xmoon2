"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/app/components/Header";
import { useParams, useRouter } from "next/navigation";
import { Send, Smile } from "lucide-react";
import dynamic from "next/dynamic";

// Importer EmojiPicker dynamiquement pour éviter les erreurs SSR
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface FloatingHeart {
  id: number;
  x: number;
  delay: number;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChat();
    
    // 🔥 REALTIME SUBSCRIPTION
    console.log('🔌 Configuration Realtime pour match:', matchId);
    
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          console.log('🔥 NOUVEAU MESSAGE REÇU EN TEMPS RÉEL:', payload);
          const newMsg = payload.new as Message;
          
          // ✅ Ajouter SEULEMENT si ce n'est pas déjà dans la liste (éviter doublons)
          setMessages((current) => {
            const exists = current.some(msg => msg.id === newMsg.id);
            if (exists) {
              console.log('⚠️ Message déjà présent, ignoré');
              return current;
            }
            console.log('✅ Ajout du nouveau message');
            return [...current, newMsg];
          });
          
          if (containsKiss(newMsg.content)) {
            triggerKissAnimation();
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut Realtime:', status);
      });

    return () => {
      console.log('🧹 Nettoyage du channel Realtime');
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  // Fermer le picker d'émojis si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const containsKiss = (text: string): boolean => {
    const kissEmojis = ['😘', '💋', '😚', '😗', '💏', '💑'];
    const kissWords = ['bisou', 'kiss', 'biz', 'gros bisous', 'bisous'];
    
    const hasKissEmoji = kissEmojis.some(emoji => text.includes(emoji));
    const hasKissWord = kissWords.some(word => 
      text.toLowerCase().includes(word)
    );
    
    return hasKissEmoji || hasKissWord;
  };

  const triggerKissAnimation = () => {
    const newHearts: FloatingHeart[] = [];
    const heartCount = 15;
    
    for (let i = 0; i < heartCount; i++) {
      newHearts.push({
        id: Date.now() + i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5
      });
    }
    
    setFloatingHearts(newHearts);
    
    setTimeout(() => {
      setFloatingHearts([]);
    }, 3000);
  };

  const loadChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUserId(user.id);

      const { data: match } = await supabase
        .from("matches")
        .select("user1_id, user2_id")
        .eq("id", matchId)
        .single();

      if (match) {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", otherUserId)
          .single();

        setOtherUserName(profile?.username || "Utilisateur");
      }

      loadMessages();
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    console.log('📥 Chargement des messages...');
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Erreur chargement messages:", error);
    } else {
      console.log('✅ Messages chargés:', data?.length);
      setMessages(data || []);
    }
  };

  const onEmojiClick = (emojiObject: any) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUserId) return;

    const isKiss = containsKiss(newMessage.trim());
    const messageContent = newMessage.trim();

    console.log('📤 Envoi du message:', messageContent);

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          match_id: matchId,
          sender_id: currentUserId,
          content: messageContent
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur envoi message:", error);
        alert('Erreur lors de l\'envoi du message');
      } else {
        console.log('✅ Message envoyé:', data);
        
        // ✅ IMPORTANT: NE PAS ajouter manuellement ici
        // Le Realtime va s'en charger automatiquement
        
        if (isKiss) {
          triggerKissAnimation();
        }
        setNewMessage("");
      }
    } catch (err) {
      console.error("❌ Erreur:", err);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex flex-col relative overflow-hidden">
      <Header />
      
      {/* Cœurs flottants */}
      {floatingHearts.map((heart) => (
        <div
          key={heart.id}
          className="floating-heart"
          style={{
            left: `${heart.x}%`,
            animationDelay: `${heart.delay}s`
          }}
        >
          💕
        </div>
      ))}
      
      {/* En-tête du chat */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push("/matches")}
            className="text-white hover:text-white/80"
          >
            ← Retour
          </button>
          <h1 className="text-xl font-semibold text-white">{otherUserName}</h1>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-white/60 mt-12">
              <p>Aucun message pour le moment</p>
              <p className="text-sm mt-2">Envoie le premier message ! 💬</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.sender_id === currentUserId
                      ? "bg-purple-600 text-white"
                      : "bg-white/10 backdrop-blur-md text-white"
                  }`}
                >
                  <p className="text-lg">{message.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {new Date(message.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input pour envoyer un message */}
      <div className="bg-white/10 backdrop-blur-md border-t border-white/20 px-4 py-4 relative">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-3 relative">
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div 
              ref={emojiPickerRef}
              className="absolute bottom-16 left-0 z-50"
            >
              <EmojiPicker 
                onEmojiClick={onEmojiClick}
                width={320}
                height={400}
              />
            </div>
          )}

          {/* Bouton Emoji */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center transition flex-shrink-0"
          >
            <Smile className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écris un message..."
            className="flex-1 bg-white/10 border border-white/20 rounded-full px-6 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
          />
          
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white w-12 h-12 rounded-full flex items-center justify-center transition flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(-10vh) scale(1);
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) scale(1.5);
            opacity: 0;
          }
        }

        .floating-heart {
          position: fixed;
          bottom: -50px;
          font-size: 2.5rem;
          animation: floatUp 3s ease-out forwards;
          pointer-events: none;
          z-index: 9999;
        }
      `}</style>
    </div>
  );
}
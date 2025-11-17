"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Profile {
  id: string;
  full_name: string;
  username: string;
  zodiac_sign: string;
}

export default function ConfidentPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [suggestedProfiles, setSuggestedProfiles] = useState<Profile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUserProfile();
    loadSuggestedProfiles();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      setUserProfile(profile);
      startNewConversation(profile);
    }
  }

  async function loadSuggestedProfiles() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, zodiac_sign")
      .neq("id", user.id)
      .limit(10);

    if (profiles) {
      setSuggestedProfiles(profiles);
    }
  }

  function startNewConversation(profile: any) {
    const newConvId = `conv_${Date.now()}_${profile.id}`;
    setCurrentConversationId(newConvId);
    showWelcomeMessage(profile);
  }

  function showWelcomeMessage(profile: any) {
    const welcomeMsg = `Bonjour ${profile.full_name || profile.username} ! 🌙✨\n\nJe suis Confident, ton guide cosmique sur XMOON. En tant que ${profile.zodiac_sign}, tu possèdes des qualités uniques que je peux t'aider à comprendre et à utiliser dans tes relations.\n\nComment puis-je t'aider aujourd'hui ? 💫`;
    
    setMessages([{
      role: "assistant",
      content: welcomeMsg,
      timestamp: new Date(),
    }]);
  }

  async function sendMessage() {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const userContext = {
        userId: userProfile?.id,
        conversationId: currentConversationId,
        zodiacSign: userProfile?.zodiac_sign,
        name: userProfile?.full_name || userProfile?.username,
        age: userProfile?.age || (userProfile?.birthdate
          ? new Date().getFullYear() - new Date(userProfile.birthdate).getFullYear()
          : undefined),
      };

      const response = await fetch("/api/confident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          userContext,
        }),
      });

      if (!response.ok) throw new Error("Erreur communication");

      const data = await response.json();

      setMessages((prev) => [...prev, {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error("Erreur:", error);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Désolé, je n'ai pas pu traiter ta demande. Réessaye ! ✨",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -300 : 300,
        behavior: 'smooth'
      });
    }
  };

  const handleProfileClick = (profileId: string) => {
    router.push(`/profile/${profileId}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f4d] to-[#2a1b3d] flex flex-col">
      {/* HEADER */}
      <div className="bg-white/5 backdrop-blur-lg border-b border-white/10 p-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">🌙 Confident</h1>
            <p className="text-sm text-white/60">Ton confident cosmique</p>
          </div>
          {userProfile && (
            <div className="text-right">
              <p className="text-sm text-white/60">Tu es</p>
              <p className="text-white font-semibold">{userProfile.zodiac_sign}</p>
            </div>
          )}
        </div>
      </div>

      {/* SLIDER PROFILS */}
      {suggestedProfiles.length > 0 && (
        <div className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-[89px] z-10">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <p className="text-white/70 text-sm font-semibold mb-3">✨ Profils suggérés pour toi</p>
            
            <div className="relative group">
              <button
                onClick={() => scrollSlider('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              <div
                ref={sliderRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {suggestedProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => handleProfileClick(profile.id)}
                    className="flex-shrink-0 w-32 bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-all cursor-pointer border border-white/20 group/card"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center text-white font-semibold text-xl">
                        {(profile.full_name || profile.username)?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="text-center w-full">
                        <h3 className="font-semibold text-sm text-white truncate">
                          {profile.full_name || profile.username}
                        </h3>
                        <p className="text-xs text-white/60">{profile.zodiac_sign}</p>
                      </div>
                      <Heart className="w-4 h-4 text-white/40 group-hover/card:text-pink-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => scrollSlider('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white"
                  : "bg-white/10 text-white backdrop-blur-sm"
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-60 mt-2">
                  {message.timestamp.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 rounded-2xl px-4 py-3">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT */}
      <div className="fixed bottom-20 left-0 right-0 bg-white/5 backdrop-blur-lg border-t border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pose-moi une question sur l'amour, l'astrologie... ✨"
            className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-semibold rounded-full shadow-lg shadow-purple-500/30 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Envoyer
          </button>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  );
}
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ConfidentPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadUserProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
      
      const welcomeMsg = `Bonjour ${profile.full_name || profile.username} ! 🌙✨\n\nJe suis Confident, ton guide cosmique sur XMOON. En tant que ${profile.zodiac_sign}, tu possèdes des qualités uniques que je peux t'aider à comprendre et à utiliser dans tes relations.\n\nComment puis-je t'aider aujourd'hui ? 💫`;
      
      setMessages([
        {
          role: "assistant",
          content: welcomeMsg,
          timestamp: new Date(),
        },
      ]);
    }
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
        zodiacSign: userProfile?.zodiac_sign,
        name: userProfile?.full_name || userProfile?.username,
        age: userProfile?.birthdate
          ? new Date().getFullYear() - new Date(userProfile.birthdate).getFullYear()
          : undefined,
      };

      const response = await fetch("/api/confident", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          userContext,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la communication avec Confident");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erreur:", error);
      
      const errorMessage: Message = {
        role: "assistant",
        content: "Désolé, je n'ai pas pu traiter ta demande. Réessaye dans un instant ! ✨",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f4d] to-[#2a1b3d] flex flex-col">
      <div className="bg-white/5 backdrop-blur-lg border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-white/70 hover:text-white text-2xl"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                🌙 Confident
              </h1>
              <p className="text-sm text-white/60">Ton guide cosmique</p>
            </div>
          </div>
          
          {userProfile && (
            <div className="text-right">
              <p className="text-sm text-white/60">Tu es</p>
              <p className="text-white font-semibold">{userProfile.zodiac_sign}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white"
                    : "bg-white/10 text-white backdrop-blur-sm"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
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
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
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

      <div className="fixed bottom-20 left-0 right-0 bg-white/5 backdrop-blur-lg border-t border-white/10 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
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
              className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-semibold rounded-full shadow-lg shadow-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
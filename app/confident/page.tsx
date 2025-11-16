"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ConfidentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Salut ✨ Je suis ton Confident IA Xmoon. Tu peux me parler de tes émotions, de tes rencontres, ou me demander une analyse astrologique 🔮",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: input.trim() },
    ]);

    // ⭐ plus tard : on connectera à l'API IA et à ta table messages_ai

    setInput("");
  };

  return (
    <div className="messages-layout">
      {/* Header */}
      <header className="chat-header">
        <h3>Confident IA</h3>
        <p className="chat-subtitle">
          Parle-moi librement. Je suis là pour t’écouter 💜
        </p>
      </header>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.role === "user" ? "message-user" : "message-ia"
            }`}
          >
            <div className="message-bubble">{msg.content}</div>
          </div>
        ))}
      </div>

      {/* Saisie */}
      <div className="chat-input">
        <input
          type="text"
          placeholder="Exprime-toi…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button type="button" onClick={handleSend}>
          Envoyer
        </button>
      </div>
    </div>
  );
}

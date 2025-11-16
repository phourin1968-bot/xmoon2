"use client";

type ChatDetailProps = {
  params: { id: string };
};

export default function ChatDetailPage({ params }: ChatDetailProps) {
  const otherName = params.id === "1" ? "Lina" : "Alex";

  return (
    <div className="messages-layout">
      <header className="chat-header">
        <h3>{otherName}</h3>
        <p className="chat-subtitle">Chat avec ton match 💑</p>
      </header>

      <div className="chat-messages">
        <div className="message message-ia">
          <div className="message-bubble">
            Salut ! Contente de te parler ici 🥰
          </div>
        </div>

        <div className="message message-user">
          <div className="message-bubble">
            Pareil ! Comment tu vas ?
          </div>
        </div>
      </div>

      <div className="chat-input">
        <input type="text" placeholder="Écris un message…" />
        <button type="button">Envoyer</button>
      </div>
    </div>
  );
}

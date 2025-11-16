export default function ChatPage() {
  // Pour l'instant : données statiques (on branchera Supabase après)
  const conversations = [
    { id: "1", name: "Lina Smith", lastMessage: "À demain alors ? 😊" },
    { id: "2", name: "Alex Martin", lastMessage: "J’ai adoré notre discussion ✨" },
  ];

  return (
    <div className="list-container">
      <h2 style={{ color: "white", marginBottom: "15px" }}>Chats</h2>

      <div className="grid">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            className="conversation-card"
            // plus tard : router.push(`/chat/${conv.id}`)
            type="button"
          >
            <div className="card-icon">💬</div>

            <div className="card-content">
              <h3>{conv.name}</h3>
              <p>{conv.lastMessage}</p>
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 24, color: "rgba(255,255,255,0.7)" }}>
        <p>
          Ici ce sont <strong>les messages avec tes matchs</strong> 💑.
          <br />
          Le <strong>Confident IA</strong> a sa propre page à part.
        </p>
      </div>
    </div>
  );
}

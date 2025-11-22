'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Message = {
  id: string;            // uuid
  match_id: number;      // bigint
  sender_id: string;     // uuid
  sender_email?: string | null;
  content: string;
  created_at: string;
};

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const matchId = Number(params.id); // ton match_id est un bigint -> number côté TS

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  // 1) Récupérer l'utilisateur connecté
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Erreur getUser:', error);
      } else if (data.user) {
        setCurrentUserId(data.user.id);
      }
      setLoadingUser(false);
    })();
  }, []);

  // 2) Charger les messages + abonnement en temps réel
  useEffect(() => {
    if (!matchId || !currentUserId) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchMessages = async () => {
      setLoadingMessages(true);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur chargement messages:', error);
      } else if (data) {
        setMessages(data as Message[]);
      }

      setLoadingMessages(false);
    };

    const subscribeToMessages = () => {
      channel = supabase
        .channel(`messages:match_id=${matchId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `match_id=eq.${matchId}`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages((prev) => [...prev, newMessage]);
          }
        )
        .subscribe();
    };

    fetchMessages();
    subscribeToMessages();

    // cleanup quand on quitte la page
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [matchId, currentUserId]);

  // 3) Envoi d'un message
  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;
    if (!currentUserId) return;
    if (!matchId) return;

    setSending(true);

    const { error } = await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: currentUserId,
      content,
    });

    if (error) {
      console.error('Erreur envoi message:', error);
    } else {
      // Le realtime ajoutera le message, on vide juste l'input
      setText('');
    }

    setSending(false);
  };

  // 🎛 États simples
  if (!matchId) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Chat</h1>
        <p>Match introuvable (id invalide).</p>
      </div>
    );
  }

  if (loadingUser) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Chat</h1>
        <p>Chargement de l’utilisateur…</p>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Chat</h1>
        <p>Tu dois être connecté pour utiliser le chat.</p>
      </div>
    );
  }

  // 🖼 UI du chat
  return (
    <div
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <h1>Chat pour le match #{matchId}</h1>
      <p>Utilisateur connecté : {currentUserId}</p>

      {/* Zone messages */}
      <div
        style={{
          flex: 1,
          marginTop: 16,
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 8,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {loadingMessages ? (
          <p>Chargement des messages…</p>
        ) : messages.length === 0 ? (
          <p style={{ opacity: 0.6 }}>(Aucun message pour le moment)</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  backgroundColor: isMe ? '#2563eb' : '#e5e7eb',
                  color: isMe ? 'white' : 'black',
                  padding: 8,
                  borderRadius: 12,
                  maxWidth: '70%',
                }}
              >
                <div>{msg.content}</div>
                <div
                  style={{
                    fontSize: 10,
                    marginTop: 4,
                    opacity: 0.7,
                    textAlign: isMe ? 'right' : 'left',
                  }}
                >
                  {new Date(msg.created_at).toLocaleTimeString()}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input bas de page */}
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <input
          style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
          placeholder="Écris un message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: sending || !text.trim() ? '#9ca3af' : '#2563eb',
            color: 'white',
            cursor: sending || !text.trim() ? 'not-allowed' : 'pointer',
          }}
          onClick={handleSend}
          disabled={sending || !text.trim()}
        >
          {sending ? '...' : 'Envoyer'}
        </button>
      </div>
    </div>
  );
}

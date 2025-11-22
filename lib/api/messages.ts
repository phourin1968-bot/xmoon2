// lib/api/messages.ts
import { supabase } from '../supabaseClient';

export type Message = {
  id: string;
  match_id: number;
  sender_id: string;
  sender_email: string | null;
  content: string;
  created_at: string;
};

// récupérer les messages d'un match
export async function fetchMessages(matchId: number): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// envoyer un message
export async function sendMessage(
  matchId: number,
  senderId: string,
  content: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: senderId,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Message;
}

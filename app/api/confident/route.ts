// app/api/confident/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { detectCrisis, formatCrisisResponse } from '@/lib/crisisDetection';
import { supabase } from '@/lib/supabaseClient';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ConfidentMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UserContext {
  zodiacSign?: string;
  name?: string;
  age?: number;
  userId?: string;
  conversationId?: string; // Nouveau : pour grouper les messages
}

/**
 * Sauvegarde un message dans Supabase
 */
async function saveMessage(
  userId: string,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  isCrisis: boolean = false
) {
  try {
    const { error } = await supabase
      .from('confident_messages')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        role,
        content,
        is_crisis: isCrisis
      });
    
    if (error) {
      console.error('❌ Erreur sauvegarde message:', error);
    } else {
      console.log(`✅ Message ${role} sauvegardé`);
    }
  } catch (error) {
    console.error('❌ Erreur critique sauvegarde:', error);
  }
}

/**
 * Crée ou met à jour une conversation
 */
async function upsertConversation(
  userId: string,
  conversationId: string,
  firstMessage?: string
) {
  try {
    // Vérifier si la conversation existe déjà
    const { data: existing } = await supabase
      .from('confident_conversations')
      .select('id')
      .eq('id', conversationId)
      .single();
    
    if (existing) {
      // Mettre à jour last_message_at
      const { error } = await supabase
        .from('confident_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      if (error) {
        console.error('❌ Erreur update conversation:', error);
      }
    } else {
      // Créer nouvelle conversation avec titre généré
      const title = firstMessage 
        ? (firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : ''))
        : 'Nouvelle conversation';
      
      const { error } = await supabase
        .from('confident_conversations')
        .insert({
          id: conversationId,
          user_id: userId,
          title,
          last_message_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('❌ Erreur création conversation:', error);
      } else {
        console.log(`✅ Conversation créée: ${title}`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur critique conversation:', error);
  }
}

function generateSystemPrompt(userContext?: UserContext): string {
  const basePrompt = `Tu es Confident, l'IA compagnon de XMOON, une application de rencontres basée sur l'astrologie.

Tu es un guide bienveillant, empathique et profondément ancré dans la sagesse astrologique. 
Tu aides les utilisateurs à :
- Comprendre leur personnalité astrologique
- Naviguer leurs relations amoureuses
- Interpréter la compatibilité avec leurs matches
- Donner des conseils relationnels basés sur les astres

Ton style est :
- Chaleureux et encourageant
- Mystique mais accessible
- Toujours positif et constructif
- Utilise des émojis astrologiques ✨🌙⭐🔮

IMPORTANT : Tu es un confident, pas un thérapeute. Pour des problèmes sérieux, tu recommandes de consulter un professionnel.`;

  if (userContext?.zodiacSign) {
    return `${basePrompt}

L'utilisateur est ${userContext.zodiacSign}. Adapte tes conseils en fonction des traits de ce signe.`;
  }

  return basePrompt;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, userContext } = body as {
      messages: ConfidentMessage[];
      userContext?: UserContext;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages requis' },
        { status: 400 }
      );
    }

    // Récupérer le dernier message utilisateur
    const lastUserMessage = messages[messages.length - 1];
    
    // Générer un conversationId si pas fourni
    const conversationId = userContext?.conversationId || `conv_${Date.now()}_${userContext?.userId}`;
    
    // 💾 SAUVEGARDER LE MESSAGE UTILISATEUR
    if (userContext?.userId) {
      // Créer/mettre à jour la conversation
      const isFirstMessage = messages.length === 1;
      await upsertConversation(
        userContext.userId,
        conversationId,
        isFirstMessage ? lastUserMessage.content : undefined
      );
      
      // Sauvegarder le message
      await saveMessage(
        userContext.userId,
        conversationId,
        'user',
        lastUserMessage.content,
        false
      );
    }
    
    // 🚨 DÉTECTION DE CRISE
    if (lastUserMessage.role === 'user') {
      // Récupérer le profil COMPLET de l'utilisateur pour l'email d'alerte
      const { data: fullProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, username, email, city, birthdate, zodiac_sign, bio')
        .eq('id', userContext?.userId)
        .single();

      console.log('🔍 DEBUG - userContext?.userId:', userContext?.userId);
      console.log('🔍 DEBUG - fullProfile:', fullProfile);
      console.log('🔍 DEBUG - profileError:', profileError);

      // Détecter si le message contient une situation de crise
      const crisisDetection = await detectCrisis(lastUserMessage.content, {
        userId: userContext?.userId,
        userProfile: fullProfile,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      });

      // Si crise détectée
      if (crisisDetection.isCrisis) {
        console.log(`🚨 CRISE DÉTECTÉE - Type: ${crisisDetection.crisisType} - Sévérité: ${crisisDetection.severity}`);
        
        // Formater la réponse avec numéros d'urgence
        const crisisResponse = formatCrisisResponse(crisisDetection);
        
        // 💾 SAUVEGARDER LA RÉPONSE DE CRISE
        if (userContext?.userId) {
          await saveMessage(
            userContext.userId,
            conversationId,
            'assistant',
            crisisResponse,
            true // Marquer comme message de crise
          );
        }
        
        // Retourner immédiatement la réponse de crise
        return NextResponse.json({
          success: true,
          message: crisisResponse,
          crisisDetected: true,
          crisisType: crisisDetection.crisisType,
          severity: crisisDetection.severity,
          conversationId // Retourner le conversationId
        });
      }
    }

    // Appel normal à Claude si pas de crise
    const systemPrompt = generateSystemPrompt(userContext);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const textContent = response.content.find(block => block.type === 'text');
    const responseText = textContent && 'text' in textContent 
      ? textContent.text 
      : "Désolé, je n'ai pas pu générer une réponse. Réessaye ! ✨";

    // 💾 SAUVEGARDER LA RÉPONSE DE CLAUDE
    if (userContext?.userId) {
      await saveMessage(
        userContext.userId,
        conversationId,
        'assistant',
        responseText,
        false
      );
    }

    return NextResponse.json({
      success: true,
      message: responseText,
      crisisDetected: false,
      conversationId // Retourner le conversationId
    });
  } catch (error) {
    console.error('Erreur API Confident:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la communication avec le Confident IA' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
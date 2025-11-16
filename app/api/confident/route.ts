// app/api/confident/route.ts
// Route API pour communiquer avec le Confident IA

import { NextRequest, NextResponse } from 'next/server';
import { sendMessageToConfident, ConfidentMessage, UserContext } from '@/lib/claudeService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, userContext } = body as {
      messages: ConfidentMessage[];
      userContext?: UserContext;
    };

    // Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages requis' },
        { status: 400 }
      );
    }

    // Appeler Claude
    const response = await sendMessageToConfident(messages, userContext);

    return NextResponse.json({
      success: true,
      message: response,
    });
  } catch (error) {
    console.error('Erreur API Confident:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la communication avec le Confident IA' },
      { status: 500 }
    );
  }
}

// Permettre les requêtes OPTIONS (CORS)
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
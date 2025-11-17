import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const ZODIAC_SIGNS: { [key: string]: string } = {
  'belier': 'aries',
  'taureau': 'taurus',
  'gemeaux': 'gemini',
  'cancer': 'cancer',
  'lion': 'leo',
  'vierge': 'virgo',
  'balance': 'libra',
  'scorpion': 'scorpio',
  'sagittaire': 'sagittarius',
  'capricorne': 'capricorn',
  'verseau': 'aquarius',
  'poissons': 'pisces'
};

interface HoroscopeData {
  content: string;
  love: string;
  work: string;
  health: string;
  love_score: number;
  mood_score: number;
  lucky_number: number;
  lucky_color: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sign: string }> }
) {
  try {
    const params = await context.params;
    const sign = params.sign.toLowerCase();
    const today = new Date().toISOString().split('T')[0];

    const validSigns = [...Object.keys(ZODIAC_SIGNS), ...Object.values(ZODIAC_SIGNS)];
    if (!validSigns.includes(sign)) {
      return NextResponse.json(
        { error: 'Invalid zodiac sign' },
        { status: 400 }
      );
    }

    const normalizedSign = ZODIAC_SIGNS[sign] || sign;

    const { data: cached } = await supabase
      .from('horoscopes')
      .select('*')
      .eq('zodiac_sign', normalizedSign)
      .eq('date', today)
      .is('user_id', null)
      .maybeSingle();

    if (cached) {
      return NextResponse.json({
        sign: normalizedSign,
        date: today,
        cached: true,
        horoscope: {
          content: cached.content,
          love: cached.love,
          work: cached.work,
          health: cached.health,
          love_score: cached.love_score,
          mood_score: cached.mood_score,
          lucky_number: cached.lucky_number,
          lucky_color: cached.lucky_color
        }
      });
    }

    console.log(`Generating horoscope for ${normalizedSign} on ${today}...`);

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Tu es un astrologue expert. Génère un horoscope pour le signe ${normalizedSign} pour le ${today}.

Réponds UNIQUEMENT avec un JSON valide dans ce format exact :
{
  "content": "Horoscope général du jour (2-3 phrases positives et engageantes)",
  "love": "Prévisions amoureuses (2 phrases)",
  "work": "Prévisions professionnelles (2 phrases)",
  "health": "Conseils santé/bien-être (2 phrases)",
  "love_score": 85,
  "mood_score": 80,
  "lucky_number": 7,
  "lucky_color": "Violet"
}

Ton style : chaleureux, authentique, avec un peu d'humour. Pas d'effet Barnum, sois précis et inspirant ! Maximum 150 mots au total.`
        }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const horoscopeData: HoroscopeData = JSON.parse(cleanedResponse);

    await supabase.from('horoscopes').insert({
      zodiac_sign: normalizedSign,
      date: today,
      user_id: null,
      content: horoscopeData.content,
      love: horoscopeData.love,
      work: horoscopeData.work,
      health: horoscopeData.health,
      love_score: horoscopeData.love_score,
      mood_score: horoscopeData.mood_score,
      lucky_number: horoscopeData.lucky_number,
      lucky_color: horoscopeData.lucky_color
    });

    return NextResponse.json({
      sign: normalizedSign,
      date: today,
      cached: false,
      horoscope: horoscopeData
    });

  } catch (error: any) {
    console.error('Horoscope error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate horoscope',
        details: error.message
      },
      { status: 500 }
    );
  }
} 
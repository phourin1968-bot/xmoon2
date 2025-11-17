/**
 * Système de détection de crise pour Confident IA
 * Détecte les situations dangereuses et alerte immédiatement
 */

import { Resend } from 'resend';

// Configuration Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const ALERT_EMAIL = process.env.CRISIS_ALERT_EMAIL || 'contact@xmoon.space';

// Types de crises détectées
export enum CrisisType {
  SUICIDE = 'SUICIDE',
  SELF_HARM = 'AUTO_MUTILATION',
  PHYSICAL_VIOLENCE = 'VIOLENCE_PHYSIQUE',
  SEXUAL_VIOLENCE_PERPETRATOR = 'AGRESSEUR_SEXUEL_POTENTIEL',
  SEXUAL_VIOLENCE = 'VIOLENCE_SEXUELLE',
  PEDOCRIMINALITY = 'PEDOCRIMINALITE',
  HARASSMENT = 'HARCELEMENT',
  HATE_SPEECH = 'PROPOS_HAINEUX',
  TERRORISM = 'TERRORISME',
  TRAFFICKING = 'TRAFIC'
}

// Mots-clés par catégorie
const CRISIS_KEYWORDS = {
  [CrisisType.SUICIDE]: [
    'suicide', 'suicider', 'me suicider', 'en finir', 'mettre fin à mes jours',
    'plus envie de vivre', 'envie de mourir', 'mourir', 'disparaître',
    'me tuer', 'tuer', 'finir ma vie', 'sauter', 'pendaison', 'overdose',
    'pilules', 'plus la force', 'abandonner tout', 'ne vois plus d\'issue',
    'aucun espoir', 'désespéré', 'seul au monde', 'personne ne m\'aime'
  ],
  
  [CrisisType.SELF_HARM]: [
    'me faire du mal', 'me blesser', 'me couper', 'scarification',
    'automutilation', 'envie de me faire mal', 'me frapper', 'me brûler',
    'saigner', 'lame', 'rasoir', 'cutter'
  ],
  
  [CrisisType.PHYSICAL_VIOLENCE]: [
    'frapper', 'battre', 'tabasser', 'violence', 'agresser', 'cogner',
    'faire du mal à quelqu\'un', 'tuer quelqu\'un', 'meurtre', 'assassiner',
    'détruire', 'blesser quelqu\'un', 'torture', 'sévices'
  ],
  
  [CrisisType.SEXUAL_VIOLENCE_PERPETRATOR]: [
    // Mots-clés d'agresseur potentiel - TRÈS SPÉCIFIQUES
    'envie de violer', 'vais violer', 'veux violer', 
    'je vais forcer', 'je veux forcer', 'envie de forcer',
    'fantasme de viol', 'envie d\'agresser sexuellement', 
    'vais agresser sexuellement', 'je vais abuser',
    'j\'ai envie de le violer', 'j\'ai envie de la violer'
  ],
  
  [CrisisType.SEXUAL_VIOLENCE]: [
    // Mots-clés de VICTIME uniquement
    'j\'ai été violé', 'j\'ai été violée', 'il m\'a violé', 'elle m\'a violé',
    'j\'ai subi un viol', 'on m\'a violé', 'j\'ai été agressé sexuellement',
    'j\'ai été agressée sexuellement', 'abus sexuel sur moi', 'attouchement sur moi',
    'il m\'a forcé', 'elle m\'a forcé', 'on m\'a forcé', 'contre mon gré',
    'j\'ai subi', 'victime de viol', 'victime d\'agression'
  ],
  
  [CrisisType.PEDOCRIMINALITY]: [
    'pédophile', 'pédophilie', 'enfant sexuel', 'mineur sexuel',
    'abuse enfant', 'exploitation enfant', 'pornographie enfant',
    'cp', 'child porn', 'csam', 'pedo'
  ],
  
  [CrisisType.HARASSMENT]: [
    'harcèlement', 'harceler', 'persécuter', 'stalker', 'traquer',
    'cyber-harcèlement', 'intimidation', 'menaces répétées',
    'revenge porn', 'chantage', 'extorsion'
  ],
  
  [CrisisType.HATE_SPEECH]: [
    'raciste', 'racisme', 'antisémite', 'antisémitisme', 'homophobe',
    'homophobie', 'transphobe', 'transphobie', 'xénophobe', 'xénophobie',
    'islamophobe', 'islamophobie', 'discrimination', 'génocide',
    'purification ethnique', 'suprématie', 'apartheid'
  ],
  
  [CrisisType.TERRORISM]: [
    'attentat', 'terrorisme', 'terroriste', 'jihad', 'kamikaze',
    'bombe', 'explosif', 'djihad', 'radicalisation', 'cellule terroriste',
    'faire sauter', 'attaque', 'État islamique', 'daesh', 'al qaeda'
  ],
  
  [CrisisType.TRAFFICKING]: [
    'trafic drogue', 'dealer', 'vendre drogue', 'trafiquant',
    'cocaïne', 'héroïne', 'méthamphétamine', 'ecstasy',
    'trafic arme', 'vendre armes', 'marché noir', 'blanchiment',
    'traite humaine', 'prostitution forcée', 'esclavage moderne'
  ]
};

// Numéros d'urgence français
const EMERGENCY_NUMBERS: Record<CrisisType, string> = {
  [CrisisType.SUICIDE]: `
    🆘 **Si tu es en détresse, contacte immédiatement :**
    
    📞 **SOS Amitié** : 09 72 39 40 50 (24h/24, 7j/7)
    📞 **Suicide Écoute** : 01 45 39 40 00 (24h/24, 7j/7)
    📞 **Fil Santé Jeunes** : 0 800 235 236 (gratuit, 9h-23h)
    📞 **SAMU** : 15 (urgence vitale immédiate)
  `,
  
  [CrisisType.SELF_HARM]: `
    🆘 **Si tu te fais du mal, appelle :**
    
    📞 **SOS Amitié** : 09 72 39 40 50 (24h/24)
    📞 **Croix-Rouge Écoute** : 0 800 858 858 (gratuit)
    📞 **Fil Santé Jeunes** : 0 800 235 236 (gratuit, 9h-23h)
  `,
  
  [CrisisType.PHYSICAL_VIOLENCE]: `
    🆘 **Si tu es victime ou témoin de violence :**
    
    📞 **Police** : 17 ou 112 (urgence immédiate)
    📞 **Violences Femmes Info** : 3919 (gratuit, 24h/24)
    📞 **Enfance en Danger** : 119 (gratuit, 24h/24)
  `,
  
  [CrisisType.SEXUAL_VIOLENCE]: `
    🆘 **Si tu es victime de violence sexuelle :**
    
    📞 **Viols Femmes Informations** : 0 800 05 95 95 (gratuit)
    📞 **Police** : 17 ou 112 (dépôt de plainte)
    📞 **Violences Femmes Info** : 3919 (24h/24)
    💻 **Tchat** : commentonsaime.fr
  `,
  
  [CrisisType.SEXUAL_VIOLENCE_PERPETRATOR]: `
    🆘 **Si tu as des pulsions d'agression sexuelle :**
    
    📞 **Numéro vert sexualités** : 0 800 08 11 11 (gratuit)
    📞 **SOS Amitié** : 09 72 39 40 50 (24h/24)
    📞 **Fil Santé Jeunes** : 0 800 235 236 (gratuit)
    🏥 **Consulte IMMÉDIATEMENT** un psychiatre ou psychologue
    
    ⚠️ **Important** : Des traitements existent pour ces troubles.
  `,
  
  [CrisisType.PEDOCRIMINALITY]: `
    🆘 **Signalement immédiat obligatoire :**
    
    📞 **Police** : 17 ou 112 (urgence)
    📞 **Enfance en Danger** : 119 (gratuit, 24h/24)
    💻 **Internet-signalement.gouv.fr** (signalement en ligne)
  `,
  
  [CrisisType.HARASSMENT]: `
    🆘 **Si tu es harcelé(e) :**
    
    📞 **Net Écoute** : 3018 (cyberharcèlement, gratuit)
    📞 **Non au Harcèlement** : 3020 (gratuit, 9h-20h)
    📞 **Police** : 17 (si menaces graves)
    💻 **pharos.gouv.fr** (signalement cyberharcèlement)
  `,
  
  [CrisisType.HATE_SPEECH]: `
    🆘 **Pour signaler des propos haineux :**
    
    💻 **Internet-signalement.gouv.fr**
    💻 **pharos.gouv.fr**
    📞 **SOS Racisme** : 01 40 35 36 55
    📞 **LICRA** : 01 45 08 08 08
  `,
  
  [CrisisType.TERRORISM]: `
    🆘 **Signalement immédiat obligatoire :**
    
    📞 **Police / Gendarmerie** : 17 ou 112
    💻 **Internet-signalement.gouv.fr**
    📞 **Numéro vert anti-terrorisme** : 0 800 005 696
  `,
  
  [CrisisType.TRAFFICKING]: `
    🆘 **Pour signaler un trafic :**
    
    📞 **Police / Gendarmerie** : 17 ou 112
    💻 **Internet-signalement.gouv.fr**
    📞 **Drogue Info Service** : 0 800 23 13 13
    📞 **Traite des êtres humains** : 0 800 10 20 20
  `
};

// Messages de réponse par catégorie
const CRISIS_RESPONSES: Record<CrisisType, string> = {
  [CrisisType.SUICIDE]: `
    Je vois que tu traverses un moment très difficile. 💙
    
    Ce que tu ressens est réel et douloureux, mais **tu n'es pas seul(e)**.
    Des professionnels formés sont là pour t'écouter, sans jugement, 24h/24.
  `,
  
  [CrisisType.SELF_HARM]: `
    Je comprends que tu souffres. 💙
    
    Te faire du mal n'est pas une solution, mais c'est un signal que tu as besoin d'aide.
    Des personnes bienveillantes peuvent t'écouter et t'accompagner.
  `,
  
  [CrisisType.PHYSICAL_VIOLENCE]: `
    ⚠️ **La violence n'est jamais acceptable.**
    
    Si tu es en danger immédiat ou témoin de violence, il est crucial de contacter les autorités.
    Ta sécurité et celle des autres est prioritaire.
  `,
  
  [CrisisType.SEXUAL_VIOLENCE]: `
    ⚠️ **Ce que tu décris est grave et illégal.**
    
    Aucune personne ne devrait subir cela. Ce n'est JAMAIS de ta faute.
    Des professionnels formés peuvent t'accompagner dans tes démarches.
  `,
  
  [CrisisType.SEXUAL_VIOLENCE_PERPETRATOR]: `
    ⚠️ **ALERTE : Les propos que tu exprimes sont extrêmement graves.**
    
    Vouloir commettre une agression sexuelle est un crime grave passible de prison.
    Si tu as ces pensées, tu dois IMMÉDIATEMENT consulter un professionnel de santé mentale.
    
    Ces pulsions peuvent être traitées par des professionnels qualifiés.
  `,
  
  [CrisisType.PEDOCRIMINALITY]: `
    ⚠️ **ALERTE : Contenu signalé aux autorités**
    
    La protection des mineurs est absolue et non négociable.
    Les faits mentionnés constituent un crime grave.
  `,
  
  [CrisisType.HARASSMENT]: `
    ⚠️ **Le harcèlement est un délit.**
    
    Personne ne devrait subir cela. Tu as le droit d'être protégé(e).
    Des associations et services spécialisés peuvent t'aider.
  `,
  
  [CrisisType.HATE_SPEECH]: `
    ⚠️ **Les propos haineux sont interdits et punissables.**
    
    La discrimination sous toutes ses formes est inacceptable.
    Tu peux signaler ce contenu aux autorités compétentes.
  `,
  
  [CrisisType.TERRORISM]: `
    ⚠️ **ALERTE GRAVE : Contenu signalé immédiatement**
    
    Toute menace terroriste doit être prise au sérieux.
    Les autorités compétentes ont été alertées.
  `,
  
  [CrisisType.TRAFFICKING]: `
    ⚠️ **Les trafics sont des crimes graves.**
    
    Si tu es impliqué(e) ou témoin, les autorités peuvent t'aider.
    Des services d'aide existent pour sortir de ces situations.
  `
};

// Interface pour le résultat de détection
export interface CrisisDetectionResult {
  isCrisis: boolean;
  crisisType?: CrisisType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  matchedKeywords: string[];
  response?: string;
  emergencyNumbers?: string;
}

/**
 * Détecte si un message contient des signaux de crise
 */
export async function detectCrisis(
  message: string, 
  options?: {
    userId?: string;
    userProfile?: any;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<CrisisDetectionResult> {
  const normalizedMessage = message.toLowerCase().trim();
  
  // Ordre de vérification : cas spécifiques AVANT cas généraux !
  const checkOrder: CrisisType[] = [
    CrisisType.SEXUAL_VIOLENCE_PERPETRATOR, // ⚠️ AVANT SEXUAL_VIOLENCE !
    CrisisType.SUICIDE,
    CrisisType.SELF_HARM,
    CrisisType.PHYSICAL_VIOLENCE,
    CrisisType.SEXUAL_VIOLENCE,
    CrisisType.PEDOCRIMINALITY,
    CrisisType.HARASSMENT,
    CrisisType.HATE_SPEECH,
    CrisisType.TERRORISM,
    CrisisType.TRAFFICKING
  ];
  
  // Parcourir dans l'ordre défini
  for (const crisisType of checkOrder) {
    const keywords = CRISIS_KEYWORDS[crisisType];
    if (!keywords) continue;
    
    const matchedKeywords = keywords.filter(keyword => 
      normalizedMessage.includes(keyword.toLowerCase())
    );
    
    if (matchedKeywords.length > 0) {
      const severity = determineSeverity(crisisType, matchedKeywords.length);
      
      // Envoyer l'alerte email avec toutes les infos
      await sendCrisisAlert({
        crisisType: crisisType,
        message,
        matchedKeywords,
        severity,
        userId: options?.userId,
        userProfile: options?.userProfile,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent
      });
      
      return {
        isCrisis: true,
        crisisType: crisisType,
        severity,
        matchedKeywords,
        response: CRISIS_RESPONSES[crisisType],
        emergencyNumbers: EMERGENCY_NUMBERS[crisisType]
      };
    }
  }
  
  return {
    isCrisis: false,
    severity: 'LOW',
    matchedKeywords: []
  };
}

/**
 * Détermine la sévérité de la crise
 */
function determineSeverity(
  crisisType: CrisisType, 
  keywordCount: number
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  // Crises toujours critiques
  const criticalTypes = [
    CrisisType.SUICIDE,
    CrisisType.PEDOCRIMINALITY,
    CrisisType.TERRORISM,
    CrisisType.SEXUAL_VIOLENCE,
    CrisisType.SEXUAL_VIOLENCE_PERPETRATOR
  ];
  
  if (criticalTypes.includes(crisisType)) {
    return 'CRITICAL';
  }
  
  // Selon le nombre de mots-clés détectés
  if (keywordCount >= 3) return 'CRITICAL';
  if (keywordCount >= 2) return 'HIGH';
  if (keywordCount >= 1) return 'MEDIUM';
  
  return 'LOW';
}

/**
 * Enregistre l'alerte de crise dans Supabase
 */
async function logCrisisToDatabase(params: {
  crisisType: CrisisType;
  message: string;
  matchedKeywords: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  userProfile?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { crisisType, message, matchedKeywords, severity, userId, userProfile, ipAddress, userAgent } = params;
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { error } = await supabase
      .from('crisis_alerts')
      .insert({
        user_id: userId || null,
        crisis_type: crisisType,
        severity: severity,
        message_content: message,
        matched_keywords: matchedKeywords,
        user_email: userProfile?.email || null,
        user_name: userProfile?.username || userProfile?.full_name || null,
        user_phone: userProfile?.phone || null,
        user_city: userProfile?.city || null,
        user_age: userProfile?.age || null,
        zodiac_sign: userProfile?.zodiac_sign || null,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        status: 'pending',
        alert_sent: true
      });
    
    if (error) {
      console.error('❌ Erreur lors de l\'enregistrement en base:', error);
    } else {
      console.log('✅ Alerte enregistrée en base de données');
    }
  } catch (error) {
    console.error('❌ Erreur critique lors de l\'enregistrement:', error);
  }
}

/**
 * Envoie une alerte email en cas de crise détectée
 */
async function sendCrisisAlert(params: {
  crisisType: CrisisType;
  message: string;
  matchedKeywords: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  userProfile?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { crisisType, message, matchedKeywords, severity, userId, userProfile, ipAddress, userAgent } = params;
  
  // 1️⃣ Enregistrer en base de données AVANT l'email
  await logCrisisToDatabase(params);
  
  const severityEmoji: Record<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', string> = {
    LOW: '🟡',
    MEDIUM: '🟠',
    HIGH: '🔴',
    CRITICAL: '🚨'
  };
  
  // Informations utilisateur pour l'email
  const userName = userProfile?.username || userProfile?.user_name || 'Inconnu';
  const userEmail = userProfile?.email || userProfile?.user_email || 'Non disponible';
  const userPhone = userProfile?.phone || userProfile?.user_phone || 'Non disponible';
  const userCity = userProfile?.city || userProfile?.user_city || 'Non disponible';
  const userAge = userProfile?.age || userProfile?.user_age || 'Non disponible';
  const zodiacSign = userProfile?.zodiac_sign || 'Non disponible';
  
  try {
    await resend.emails.send({
      from: 'XMOON Alert <alerts@xmoon.space>',
      to: ALERT_EMAIL,
      subject: `${severityEmoji[severity]} ALERTE CRISE : ${crisisType} - ${userName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 28px;">${severityEmoji[severity]} ALERTE CRISE</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.95;">${crisisType}</p>
              </div>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px;">
                <strong style="color: #856404;">⚠️ Niveau de gravité : ${severity}</strong>
              </div>
              
              <div style="margin-bottom: 20px;">
                <h2 style="color: #667eea; margin-bottom: 10px;">👤 Informations utilisateur :</h2>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 3px solid #667eea;">
                  <p style="margin: 5px 0;"><strong>Nom :</strong> ${userName}</p>
                  <p style="margin: 5px 0;"><strong>Email :</strong> ${userEmail}</p>
                  <p style="margin: 5px 0;"><strong>Téléphone :</strong> ${userPhone}</p>
                  <p style="margin: 5px 0;"><strong>Ville :</strong> ${userCity}</p>
                  <p style="margin: 5px 0;"><strong>Âge :</strong> ${userAge} ans</p>
                  <p style="margin: 5px 0;"><strong>Signe :</strong> ${zodiacSign}</p>
                  ${userId ? `<p style="margin: 5px 0;"><strong>User ID :</strong> <code>${userId}</code></p>` : ''}
                </div>
              </div>
              
              <div style="margin-bottom: 20px;">
                <h2 style="color: #667eea; margin-bottom: 10px;">💬 Message utilisateur :</h2>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 3px solid #667eea;">
                  <p style="margin: 0; white-space: pre-wrap;">${message}</p>
                </div>
              </div>
              
              <div style="margin-bottom: 20px;">
                <h2 style="color: #dc3545; margin-bottom: 10px;">🚨 Mots-clés détectés :</h2>
                <div style="background: #fff5f5; padding: 15px; border-radius: 5px; border-left: 3px solid #dc3545;">
                  <p style="margin: 0;"><strong>${matchedKeywords.join(', ')}</strong></p>
                </div>
              </div>
              
              ${ipAddress || userAgent ? `
              <div style="margin-bottom: 20px;">
                <h2 style="color: #6c757d; margin-bottom: 10px;">🔍 Informations techniques :</h2>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 3px solid #6c757d;">
                  ${ipAddress ? `<p style="margin: 5px 0; font-size: 12px;"><strong>IP :</strong> ${ipAddress}</p>` : ''}
                  ${userAgent ? `<p style="margin: 5px 0; font-size: 12px;"><strong>User Agent :</strong> ${userAgent}</p>` : ''}
                </div>
              </div>
              ` : ''}
              
              <div style="background: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #0c5460;">📋 Actions à prendre :</h3>
                <ul style="margin: 0; padding-left: 20px; color: #0c5460;">
                  <li>Vérifier le contexte complet de la conversation</li>
                  <li>Contacter l'utilisateur par téléphone ou email si nécessaire</li>
                  <li>Signaler aux autorités si requis par la loi (${crisisType === CrisisType.SUICIDE || crisisType === CrisisType.PEDOCRIMINALITY || crisisType === CrisisType.TERRORISM || crisisType === CrisisType.SEXUAL_VIOLENCE_PERPETRATOR ? '⚠️ RECOMMANDÉ' : 'selon situation'})</li>
                  <li>Documenter l'incident dans crisis_alerts (status: pending → reviewed → resolved)</li>
                  <li>Considérer une suspension temporaire du compte si nécessaire</li>
                </ul>
              </div>
              
              <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                  ⏰ Alerte générée le ${new Date().toLocaleString('fr-FR', { 
                    timeZone: 'Europe/Paris' 
                  })}
                </p>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">
                  XMOON - Système de détection de crise
                </p>
              </div>
              
            </div>
          </body>
        </html>
      `
    });
    
    console.log(`✅ Alerte envoyée pour crise ${crisisType}`);
  } catch (error) {
    console.error('❌ Erreur envoi alerte:', error);
    // Ne pas bloquer le flux si l'email échoue
  }
}

/**
 * Formate la réponse complète pour l'utilisateur
 */
export function formatCrisisResponse(result: CrisisDetectionResult): string {
  if (!result.isCrisis) return '';
  
  return `${result.response}\n\n${result.emergencyNumbers}\n\n---\n\n💙 **Tu n'es pas seul(e). Des professionnels sont là pour t'aider.**\n\nJe reste ici pour t'écouter si tu as besoin de parler. 💜`;
}
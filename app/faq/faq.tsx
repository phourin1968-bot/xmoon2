"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, Mail, Shield, Heart, Star, MessageCircle, User, CreditCard, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  icon: React.ReactNode;
  title: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    id: "account",
    icon: <User className="w-5 h-5" />,
    title: "Compte & Profil",
    items: [
      {
        question: "Comment créer mon compte ?",
        answer: "Clique sur 'Créer un compte' sur la page d'accueil, entre ton email et un mot de passe (minimum 6 caractères). Tu recevras un email de confirmation pour activer ton compte."
      },
      {
        question: "Comment modifier mon profil ?",
        answer: "Va dans ton profil en cliquant sur le menu ☰ en haut à droite, puis 'Mon Profil'. Tu pourras modifier tes photos, ta bio, tes intérêts et toutes tes informations."
      },
      {
        question: "Pourquoi demandez-vous mon heure de naissance ?",
        answer: "L'heure de naissance permet de calculer ton Ascendant, un élément clé de ton thème astral. C'est optionnel, mais ça améliore la précision de ta compatibilité ! Si tu ne la connais pas, tu peux laisser vide."
      },
      {
        question: "Mon numéro de téléphone est-il visible ?",
        answer: "Non, jamais ! Ton numéro est privé et sert uniquement pour la sécurité de ton compte (récupération, alertes importantes). Il n'est jamais partagé avec d'autres utilisateurs."
      },
      {
        question: "Comment supprimer mon compte ?",
        answer: "Va dans le menu ☰ → Paramètres → Sécurité → 'Supprimer mon compte'. Si tu as trouvé l'âme sœur grâce à XMOON, félicitations ! 💕 Toutes tes données seront supprimées définitivement."
      },
    ],
  },
  {
    id: "astrology",
    icon: <Star className="w-5 h-5" />,
    title: "Astrologie & Compatibilité",
    items: [
      {
        question: "Comment fonctionne la compatibilité astrologique ?",
        answer: "Notre algorithme analyse ton thème astral complet (Soleil, Lune, Ascendant) et le compare avec celui des autres profils. On calcule un score de compatibilité basé sur les aspects harmonieux et les complémentarités entre vos signes."
      },
      {
        question: "C'est quoi le Soleil, la Lune et l'Ascendant ?",
        answer: "Le Soleil (ton signe principal) représente ton essence. La Lune reflète tes émotions et ta vie intérieure. L'Ascendant montre comment tu te présentes aux autres. Ensemble, ils forment la base de ta personnalité astrologique."
      },
      {
        question: "Pourquoi mon signe est différent de ce que je pensais ?",
        answer: "Si tu es né(e) à la limite entre deux signes (les 19-23 du mois), ton signe dépend de l'année et de l'heure exacte. Notre calcul est basé sur les positions astronomiques réelles."
      },
      {
        question: "Est-ce que deux signes 'incompatibles' peuvent matcher ?",
        answer: "Absolument ! L'astrologie est un guide, pas une règle absolue. Deux signes traditionnellement 'difficiles' peuvent avoir d'autres aspects très compatibles (Lune, Ascendant, Vénus...). L'amour a toujours le dernier mot ! 💫"
      },
    ],
  },
  {
    id: "matching",
    icon: <Heart className="w-5 h-5" />,
    title: "Matchs & Rencontres",
    items: [
      {
        question: "Comment fonctionnent les suggestions ?",
        answer: "On te propose des profils basés sur ta compatibilité astrologique, tes préférences (âge, distance, genre recherché) et tes intérêts communs. Plus ton profil est complet, meilleures sont les suggestions !"
      },
      {
        question: "C'est quoi un Match ?",
        answer: "Un Match, c'est quand deux personnes se likent mutuellement ! Quand ça arrive, vous pouvez commencer à discuter. C'est écrit dans les étoiles ✨"
      },
      {
        question: "Pourquoi je ne vois pas certains profils ?",
        answer: "Tu ne verras pas les profils que tu as déjà likés/passés, ceux qui ne correspondent pas à tes préférences, ou ceux qui t'ont bloqué. Vérifie aussi tes filtres de distance et d'âge."
      },
      {
        question: "Puis-je annuler un like ou un pass ?",
        answer: "Pour l'instant, les actions sont définitives. Réfléchis bien avant de passer quelqu'un ! Une fonctionnalité 'Retour' arrivera bientôt en version Premium."
      },
    ],
  },
  {
    id: "confident",
    icon: <MessageCircle className="w-5 h-5" />,
    title: "Confident IA",
    items: [
      {
        question: "C'est quoi Confident IA ?",
        answer: "Confident IA est ton ami virtuel disponible 24h/24. Basé sur ton signe astrologique, il te comprend, te conseille et t'accompagne dans ta vie amoureuse. Tu peux lui parler de tout !"
      },
      {
        question: "Est-ce que Confident IA est vraiment personnalisé ?",
        answer: "Oui ! Confident connaît ton signe, ton Ascendant et ta Lune. Il adapte ses conseils à ta personnalité astrologique. Plus tu discutes avec lui, plus il te comprend."
      },
      {
        question: "Mes conversations avec Confident sont-elles privées ?",
        answer: "Absolument. Tes conversations sont confidentielles et ne sont jamais partagées. C'est ton espace safe pour te confier sans jugement."
      },
      {
        question: "Combien de messages puis-je envoyer ?",
        answer: "En version gratuite, tu as un quota de messages par jour. La version Premium offre des conversations illimitées avec Confident IA."
      },
    ],
  },
  {
    id: "safety",
    icon: <Shield className="w-5 h-5" />,
    title: "Sécurité & Signalement",
    items: [
      {
        question: "Comment signaler un utilisateur ?",
        answer: "Dans une conversation, clique sur le bouton ⚠️ en haut à droite. Choisis la raison du signalement et envoie. Notre équipe examinera le profil rapidement."
      },
      {
        question: "Comment bloquer quelqu'un ?",
        answer: "Va sur le profil de la personne, clique sur les 3 points ••• puis 'Bloquer'. Cette personne ne pourra plus te voir ni te contacter."
      },
      {
        question: "Que faire si je reçois des messages inappropriés ?",
        answer: "Signale immédiatement le profil et bloque la personne. Si c'est grave (menaces, harcèlement), contacte-nous à support@xmoon.app. Ta sécurité est notre priorité."
      },
      {
        question: "Mes données sont-elles protégées ?",
        answer: "Oui ! Nous utilisons le chiffrement pour protéger tes données. Nous ne vendons jamais tes informations. Consulte notre Politique de Confidentialité pour plus de détails."
      },
    ],
  },
  {
    id: "premium",
    icon: <CreditCard className="w-5 h-5" />,
    title: "Premium & Abonnement",
    items: [
      {
        question: "Quels sont les avantages Premium ?",
        answer: "Avec Premium : likes illimités, voir qui t'a liké, conversations illimitées avec Confident IA, retour sur les profils passés, boost de visibilité, et plus encore !"
      },
      {
        question: "Combien coûte l'abonnement ?",
        answer: "Nous proposons plusieurs formules : mensuelle, trimestrielle et annuelle. Les prix sont affichés dans l'app. L'abonnement annuel offre la meilleure réduction !"
      },
      {
        question: "Comment annuler mon abonnement ?",
        answer: "Va dans Paramètres → Abonnement → Gérer. Tu peux annuler à tout moment. L'accès Premium reste actif jusqu'à la fin de la période payée."
      },
      {
        question: "Y a-t-il un essai gratuit ?",
        answer: "Oui ! Les nouveaux utilisateurs peuvent essayer Premium gratuitement pendant 7 jours. Annule avant la fin de l'essai si tu ne souhaites pas continuer."
      },
    ],
  },
];

export default function FAQPage() {
  const router = useRouter();
  const [openCategory, setOpenCategory] = useState<string | null>("account");
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    setOpenCategory(openCategory === categoryId ? null : categoryId);
  };

  const toggleQuestion = (questionId: string) => {
    const newOpenQuestions = new Set(openQuestions);
    if (newOpenQuestions.has(questionId)) {
      newOpenQuestions.delete(questionId);
    } else {
      newOpenQuestions.add(questionId);
    }
    setOpenQuestions(newOpenQuestions);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-violet-950/30 to-slate-950 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-violet-700/30 p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-violet-600/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-violet-400" />
          </button>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-violet-400" />
            <h1 className="text-xl font-bold text-white">FAQ & Aide</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Introduction */}
        <div className="text-center mb-8">
          <p className="text-slate-400">
            Une question ? Tu trouveras sûrement la réponse ici ! 🌙
          </p>
        </div>

        {/* Catégories FAQ */}
        <div className="space-y-4">
          {faqData.map((category) => (
            <div
              key={category.id}
              className="bg-slate-900/50 border border-violet-700/30 rounded-2xl overflow-hidden"
            >
              {/* Header de catégorie */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-violet-600/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-600/20 rounded-lg text-violet-400">
                    {category.icon}
                  </div>
                  <span className="font-semibold text-white">
                    {category.title}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-violet-400 transition-transform ${
                    openCategory === category.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Questions de la catégorie */}
              {openCategory === category.id && (
                <div className="border-t border-violet-700/20">
                  {category.items.map((item, index) => {
                    const questionId = `${category.id}-${index}`;
                    const isOpen = openQuestions.has(questionId);

                    return (
                      <div
                        key={questionId}
                        className="border-b border-violet-700/10 last:border-b-0"
                      >
                        <button
                          onClick={() => toggleQuestion(questionId)}
                          className="w-full p-4 flex items-start justify-between text-left hover:bg-violet-600/5 transition-colors"
                        >
                          <span className="text-slate-200 pr-4">
                            {item.question}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-violet-400 flex-shrink-0 mt-1 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4">
                            <p className="text-slate-400 text-sm leading-relaxed bg-violet-900/10 p-3 rounded-lg">
                              {item.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact section */}
        <div className="mt-8 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-6 text-center">
          <div className="mb-4">
            <Mail className="w-10 h-10 text-violet-400 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Tu n'as pas trouvé ta réponse ?
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            Notre équipe est là pour t'aider !
          </p>
          <a
            href="mailto:support@xmoon.app"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-full hover:opacity-90 transition-opacity"
          >
            <Mail className="w-4 h-4" />
            Contacte-nous
          </a>
        </div>

        {/* Liens utiles */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push("/how-it-works")}
            className="p-4 bg-slate-900/50 border border-violet-700/30 rounded-xl text-center hover:bg-violet-600/10 transition-colors"
          >
            <span className="text-2xl mb-2 block">✨</span>
            <span className="text-slate-300 text-sm">Comment ça marche</span>
          </button>
          <button
            onClick={() => router.push("/settings")}
            className="p-4 bg-slate-900/50 border border-violet-700/30 rounded-xl text-center hover:bg-violet-600/10 transition-colors"
          >
            <span className="text-2xl mb-2 block">⚙️</span>
            <span className="text-slate-300 text-sm">Paramètres</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-xs">
            XMOON - L'amour écrit dans les étoiles 🌙✨
          </p>
        </div>
      </main>
    </div>
  );
}
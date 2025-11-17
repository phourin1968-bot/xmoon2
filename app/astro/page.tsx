"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Sparkles, Heart, Briefcase, Activity, Palette } from "lucide-react";

interface HoroscopeData {
  sign: string;
  date: string;
  content: string;
  love: string;
  work: string;
  health: string;
  lucky_number: number;
  lucky_color: string;
}

interface ZodiacSign {
  name: string;
  emoji: string;
  dates: string;
}

const zodiacSigns: ZodiacSign[] = [
  { name: "Bélier", emoji: "♈", dates: "21 mars - 19 avril" },
  { name: "Taureau", emoji: "♉", dates: "20 avril - 20 mai" },
  { name: "Gémeaux", emoji: "♊", dates: "21 mai - 20 juin" },
  { name: "Cancer", emoji: "♋", dates: "21 juin - 22 juillet" },
  { name: "Lion", emoji: "♌", dates: "23 juillet - 22 août" },
  { name: "Vierge", emoji: "♍", dates: "23 août - 22 septembre" },
  { name: "Balance", emoji: "♎", dates: "23 septembre - 22 octobre" },
  { name: "Scorpion", emoji: "♏", dates: "23 octobre - 21 novembre" },
  { name: "Sagittaire", emoji: "♐", dates: "22 novembre - 21 décembre" },
  { name: "Capricorne", emoji: "♑", dates: "22 décembre - 19 janvier" },
  { name: "Verseau", emoji: "♒", dates: "20 janvier - 18 février" },
  { name: "Poissons", emoji: "♓", dates: "19 février - 20 mars" },
];

const compatibilityScores: { [key: string]: { [key: string]: number } } = {
  "Bélier": { "Lion": 95, "Sagittaire": 90, "Gémeaux": 85, "Verseau": 80, "Balance": 75 },
  "Taureau": { "Vierge": 95, "Capricorne": 90, "Cancer": 85, "Poissons": 80, "Scorpion": 75 },
  "Gémeaux": { "Balance": 95, "Verseau": 90, "Bélier": 85, "Lion": 80, "Sagittaire": 75 },
  "Cancer": { "Scorpion": 95, "Poissons": 90, "Taureau": 85, "Vierge": 80, "Capricorne": 75 },
  "Lion": { "Bélier": 95, "Sagittaire": 90, "Gémeaux": 85, "Balance": 80, "Verseau": 75 },
  "Vierge": { "Taureau": 95, "Capricorne": 90, "Cancer": 85, "Scorpion": 80, "Poissons": 75 },
  "Balance": { "Gémeaux": 95, "Verseau": 90, "Lion": 85, "Sagittaire": 80, "Bélier": 75 },
  "Scorpion": { "Cancer": 95, "Poissons": 90, "Vierge": 85, "Capricorne": 80, "Taureau": 75 },
  "Sagittaire": { "Bélier": 95, "Lion": 90, "Balance": 85, "Verseau": 80, "Gémeaux": 75 },
  "Capricorne": { "Taureau": 95, "Vierge": 90, "Scorpion": 85, "Poissons": 80, "Cancer": 75 },
  "Verseau": { "Gémeaux": 95, "Balance": 90, "Bélier": 85, "Sagittaire": 80, "Lion": 75 },
  "Poissons": { "Cancer": 95, "Scorpion": 90, "Taureau": 85, "Capricorne": 80, "Vierge": 75 },
};

export default function AstroPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [horoscope, setHoroscope] = useState<HoroscopeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSign, setSelectedSign] = useState<string>("Bélier");

  useEffect(() => {
    loadUserAndHoroscope();
  }, []);

  async function loadUserAndHoroscope() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { data: userData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userData && userData.zodiac_sign) {
      setCurrentUser(userData);
      setSelectedSign(userData.zodiac_sign);
      await loadHoroscope(userData.zodiac_sign);
    } else {
      setCurrentUser(userData);
      await loadHoroscope("Bélier");
    }

    setLoading(false);
  }

  async function loadHoroscope(sign: string) {
    try {
      const signMapping: { [key: string]: string } = {
        'Bélier': 'aries', 'Taureau': 'taurus', 'Gémeaux': 'gemini',
        'Cancer': 'cancer', 'Lion': 'leo', 'Vierge': 'virgo',
        'Balance': 'libra', 'Scorpion': 'scorpio', 'Sagittaire': 'sagittarius',
        'Capricorne': 'capricorn', 'Verseau': 'aquarius', 'Poissons': 'pisces'
      };

      const signEnglish = signMapping[sign] || 'aries';
      const response = await fetch(`/api/astrology/horoscope/${signEnglish}`);
      
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      
      if (data.horoscope) {
        setHoroscope({
          sign, date: data.date,
          content: data.horoscope.content,
          love: data.horoscope.love,
          work: data.horoscope.work,
          health: data.horoscope.health,
          lucky_number: data.horoscope.lucky_number,
          lucky_color: data.horoscope.lucky_color
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setHoroscope({
        sign, date: new Date().toISOString().split('T')[0],
        content: "Votre horoscope sera bientôt disponible ! ✨",
        love: "Les astres préparent quelque chose...",
        work: "Patience...", health: "Prenez soin de vous !",
        lucky_number: 7, lucky_color: "Violet"
      });
    }
  }

  async function changeSign(sign: string) {
    setSelectedSign(sign);
    setLoading(true);
    await loadHoroscope(sign);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-200">Consultation des astres...</p>
        </div>
      </main>
    );
  }

  const currentSignData = zodiacSigns.find(z => z.name === selectedSign);
  const compatibilities = compatibilityScores[selectedSign] || {};

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] pb-32">
      <div className="bg-white/5 backdrop-blur-lg border-b border-white/10 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white text-center flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-300" />
            Astrologie
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Choisissez votre signe</h2>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {zodiacSigns.map((sign) => (
              <button
                key={sign.name}
                onClick={() => changeSign(sign.name)}
                className={`p-3 rounded-xl transition-all ${
                  selectedSign === sign.name
                    ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white scale-105 shadow-lg'
                    : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                <div className="text-3xl mb-1">{sign.emoji}</div>
                <div className="text-xs font-semibold">{sign.name}</div>
              </button>
            ))}
          </div>
        </div>

        {horoscope && (
          <>
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">✨ Horoscope du jour</h2>
                <p className="text-purple-300 text-sm">
                 {new Date().toLocaleDateString('fr-FR', { 
                 weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            })}
                </p>
                <div className="text-right">
                  <div className="text-4xl mb-1">{currentSignData?.emoji}</div>
                  <div className="text-sm text-purple-300">{currentSignData?.dates}</div>
                </div>
              </div>
              <p className="text-slate-100 text-lg leading-relaxed">{horoscope.content}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <Heart className="w-6 h-6 text-pink-400" />
                  <h3 className="text-white font-bold text-lg">Amour</h3>
                </div>
                <p className="text-purple-200 text-sm leading-relaxed">{horoscope.love}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <Briefcase className="w-6 h-6 text-blue-400" />
                  <h3 className="text-white font-bold text-lg">Travail</h3>
                </div>
                <p className="text-purple-200 text-sm leading-relaxed">{horoscope.work}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <Activity className="w-6 h-6 text-green-400" />
                  <h3 className="text-white font-bold text-lg">Santé</h3>
                </div>
                <p className="text-purple-200 text-sm leading-relaxed">{horoscope.health}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <Palette className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-white font-bold text-lg">Chance</h3>
                </div>
                <div className="space-y-2 text-purple-200 text-sm">
                  <p>Chiffre porte-bonheur : <span className="font-bold text-yellow-300">{horoscope.lucky_number}</span></p>
                  <p>Couleur du jour : <span className="font-bold text-fuchsia-300">{horoscope.lucky_color}</span></p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Heart className="w-6 h-6 text-pink-400" />
                Compatibilités amoureuses
              </h2>
              <div className="space-y-4">
                {Object.entries(compatibilities)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([sign, score]) => {
                    const signData = zodiacSigns.find(z => z.name === sign);
                    return (
                      <div key={sign} className="flex items-center gap-4">
                        <div className="text-3xl">{signData?.emoji}</div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-2">
                            <span className="text-white font-semibold">{sign}</span>
                            <span className="text-pink-300 font-bold">{score}%</span>
                          </div>
                          <div className="bg-white/10 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full transition-all duration-1000"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl p-6 text-center">
              <h3 className="text-white text-xl font-bold mb-2">
                Découvrez votre âme sœur cosmique ! 💫
              </h3>
              <p className="text-white/90 mb-4">
                Trouvez quelqu'un dont les astres s'alignent parfaitement avec les vôtres
              </p>
              <button
                onClick={() => router.push("/discover")}
                className="bg-white text-violet-600 px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all shadow-lg"
              >
                Commencer à swiper 🔥
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
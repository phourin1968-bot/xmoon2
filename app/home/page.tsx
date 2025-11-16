"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Profile {
  full_name: string;
  username: string;
  zodiac_sign: string;
  avatar_url?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestedProfiles, setSuggestedProfiles] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Charger le profil
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, username, zodiac_sign, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Charger 6 profils aléatoires à découvrir
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, zodiac_sign, avatar_url, city")
        .neq("id", user.id) // Pas soi-même
        .limit(6);

      if (profiles) {
        setSuggestedProfiles(profiles);
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] flex items-center justify-center">
        <p className="text-slate-200 text-sm">Chargement...</p>
      </main>
    );
  }

  const features = [
    {
      title: "Découvrir",
      description: "Explore de nouveaux profils",
      icon: "✨",
      href: "/discover",
      color: "from-violet-600 to-purple-600",
    },
    {
      title: "Matches",
      description: "Tes connexions astrales",
      icon: "❤️",
      href: "/matches",
      color: "from-pink-600 to-rose-600",
    },
    {
      title: "Messages",
      description: "Tes conversations",
      icon: "💬",
      href: "/chat",
      color: "from-blue-600 to-cyan-600",
    },
    {
      title: "Confident IA",
      description: "Ton guide astro personnel",
      icon: "🤖",
      href: "/confident",
      color: "from-fuchsia-600 to-violet-600",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#16052a] to-[#3b0b6b] pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* En-tête de bienvenue */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center text-3xl">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username || "Avatar"}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>👤</span>
              )}
            </div>

            {/* Message de bienvenue */}
            <div>
              <h1 className="text-3xl font-bold text-slate-50">
                Salut {profile?.username || profile?.full_name} ! 🌙
              </h1>
              <p className="text-violet-400 text-lg">
                {profile?.zodiac_sign && `${profile.zodiac_sign} ✨`}
              </p>
            </div>
          </div>
        </div>

        {/* Profils suggérés */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-50">
              Qui va te plaire ? 💫
            </h2>
            <button
              onClick={() => router.push(`/profile/${p.id}`)}
              className="text-violet-400 hover:text-violet-300 text-sm font-medium"
            >
              Voir plus →
            </button>
          </div>

          {suggestedProfiles.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {suggestedProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => router.push(`/profile/${p.id}`)}
                  className="group relative aspect-square rounded-xl overflow-hidden border-2 border-violet-600/40 hover:border-violet-500 transition-all hover:scale-105"
                >
                  {/* Avatar */}
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt={p.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-4xl">
                      👤
                    </div>
                  )}
                  
                  {/* Overlay avec infos */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white font-semibold text-sm truncate">
                        {p.username || p.full_name}
                      </p>
                      <p className="text-violet-300 text-xs">
                        {p.zodiac_sign} • {p.city}
                      </p>
                    </div>
                  </div>

                  {/* Badge signe */}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                    <span className="text-xs text-white">{p.zodiac_sign}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-violet-600/40 rounded-xl p-6 text-center">
              <p className="text-slate-400 text-sm">
                Aucun profil disponible pour le moment
              </p>
            </div>
          )}
        </div>

        {/* Horoscope du jour */}
        <div className="bg-gradient-to-br from-violet-900/40 to-fuchsia-900/40 border border-violet-600/40 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🔮</span>
            <h2 className="text-xl font-semibold text-slate-50">
              Ton horoscope du jour
            </h2>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            {profile?.zodiac_sign
              ? `Aujourd'hui, les astres sont alignés en ta faveur, ${profile.zodiac_sign} ! C'est le moment parfait pour ouvrir ton cœur aux nouvelles rencontres. L'énergie cosmique favorise les connexions authentiques. ✨`
              : "Configure ton profil pour recevoir ton horoscope personnalisé !"}
          </p>
          <button
            onClick={() => router.push("/astrology")}
            className="mt-4 text-violet-400 hover:text-violet-300 text-sm font-medium"
          >
            Voir l'horoscope complet →
          </button>
        </div>

        {/* Features principales */}
        <div>
          <h2 className="text-xl font-semibold text-slate-50 mb-4">
            Explore XMOON
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => (
              <button
                key={feature.href}
                onClick={() => router.push(feature.href)}
                className="group bg-slate-900/50 border border-violet-600/40 rounded-xl p-6 hover:border-violet-500 transition-all hover:scale-105"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center text-2xl`}
                  >
                    {feature.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-slate-50 mb-1 group-hover:text-violet-300 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 text-sm">{feature.description}</p>
                  </div>
                  <span className="text-slate-600 group-hover:text-violet-400 transition-colors">
                    →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Citation inspirante */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm italic">
            "Les étoiles nous montrent le chemin, mais c'est le cœur qui choisit la
            direction." 💫
          </p>
        </div>
      </div>
    </main>
  );
}
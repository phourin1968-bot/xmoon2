import "./globals.css";
import "./styles/styles-unifie.css";
import Header from "./components/Header";
import type { ReactNode } from "react";
import BottomNav from "./components/BottomNav";

export const metadata = {
  title: "Xmoon",
  description: "Mobile Dating App",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        {/* Header avec recherche et menu */}
        <Header />
        
        {/* Contenu principal avec padding pour header et bottom nav */}
        <main className="pt-16 pb-20 min-h-screen">
          {children}
        </main>
        
        {/* Bottom Navigation */}
        <BottomNav />
      </body>
    </html>
  );
}
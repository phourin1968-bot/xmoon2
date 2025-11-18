import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log("🔍 SUPABASE URL =>", supabaseUrl);
console.log("🔍 SUPABASE ANON =>", supabaseAnonKey ? "[OK]" : "[VIDE]");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Variables Supabase manquantes dans .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
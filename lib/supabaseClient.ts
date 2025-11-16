import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔍 SUPABASE URL LUE PAR NEXT =>", supabaseUrl);
console.log("🔍 SUPABASE ANON LUE PAR NEXT =>", supabaseAnonKey ? "[OK]" : "[VIDE]");

if (!supabaseUrl) {
  throw new Error("❌ NEXT_PUBLIC_SUPABASE_URL est vide (non lue depuis .env.local)");
}
if (!supabaseAnonKey) {
  throw new Error("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY est vide (non lue depuis .env.local)");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

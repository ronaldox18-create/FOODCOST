import { createClient } from '@supabase/supabase-js';

// Usamos process.env aqui porque ele foi injetado pelo vite.config.ts
// Isso é mais seguro que import.meta.env em alguns ambientes de deploy que causam o erro "undefined"
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing! Check .env or Vercel/Netlify settings.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
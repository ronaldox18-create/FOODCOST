// utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// --- LOGS DE DEPURAÇÃO ---
// Este é o lugar certo para verificar as chaves de ambiente.
console.log("supabaseClient.ts carregado. Tentando usar as chaves:");
console.log("URL:", supabaseUrl);
console.log("Anon Key:", supabaseAnonKey ? "****** (Chave encontrada)" : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("ERRO CRÍTICO: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas. Verifique seu arquivo .env e REINICIE o servidor.");
}

// A instância do Supabase é criada e exportada de um único lugar.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no modo (development/production)
  // O terceiro argumento '' garante que carregue todas as variáveis, não apenas as que começam com VITE_
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // A propriedade define faz a substituição direta no código durante o build
    // Isso evita que o navegador tente acessar 'import.meta.env' se ele for undefined
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY),
    },
  };
});
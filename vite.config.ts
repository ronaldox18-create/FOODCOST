import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega todas as variáveis de ambiente do diretório atual
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Injeta as variáveis explicitamente. O JSON.stringify é necessário para que o valor seja tratado como string no código final.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      
      // Polyfill seguro para evitar que bibliotecas que acessem process.env quebrem
      'process.env': {}
    }
  };
});
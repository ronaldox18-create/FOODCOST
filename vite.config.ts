import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Injeta a variável de ambiente corretamente
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Evita crash por acesso indevido ao process.env no navegador
      'process.env': {}
    }
  };
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuração padrão e limpa para evitar erros de build no Cloudflare/Netlify
export default defineConfig({
  plugins: [react()],
});

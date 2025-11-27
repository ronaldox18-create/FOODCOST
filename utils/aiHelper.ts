
import { GoogleGenAI } from "@google/genai";

// Função segura para obter a chave da API sem quebrar a aplicação
const getApiKey = () => {
  try {
    // Tenta ler do import.meta.env (padrão Vite)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.VITE_API_KEY || '';
    }
  } catch (e) {
    console.warn("Ambiente não suporta import.meta.env");
  }
  return '';
};

const apiKey = getApiKey();

// Inicializa o cliente apenas se tiver chave, ou cria um dummy para evitar crash no load
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const askAI = async (prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
  if (!ai) {
    console.error("API Key da IA não encontrada. Configure VITE_API_KEY no painel do Cloudflare/Netlify.");
    return "⚠️ Erro de Configuração: Chave da Inteligência Artificial não encontrada. Por favor, avise o administrador do sistema.";
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("AI Request Failed:", error);
    return "Desculpe, a IA está indisponível no momento. Tente novamente mais tarde.";
  }
};

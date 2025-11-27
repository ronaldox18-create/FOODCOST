
import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key using Vite's import.meta.env
// fallback to empty string to prevent crash on initialization if key is missing
const apiKey = import.meta.env.VITE_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const askAI = async (prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
  if (!apiKey) {
    console.error("API Key is missing. Please set VITE_API_KEY in your environment variables.");
    return "Erro de configuração: Chave da API não encontrada. Verifique as configurações do sistema.";
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("AI Request Failed:", error);
    return "Desculpe, ocorreu um erro ao processar sua solicitação com a IA. Tente novamente em instantes.";
  }
};

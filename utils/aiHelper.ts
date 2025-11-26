import { GoogleGenAI } from "@google/genai";

// O Vite substituirá process.env.API_KEY pelo valor real definido no vite.config.ts
const apiKey = process.env.API_KEY;

// Inicializa o cliente apenas se a chave existir e não for vazia
const ai = (apiKey && apiKey.length > 0) ? new GoogleGenAI({ apiKey: apiKey }) : null;

export const askAI = async (prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
  if (!apiKey || !ai) {
    console.error("API_KEY is missing. Check Vercel Environment Variables.");
    return "Erro de Configuração: Chave de API da IA não encontrada. Verifique as configurações do Vercel.";
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
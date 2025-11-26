import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;

// Inicializa o cliente apenas se a chave existir
const ai = apiKey ? new GoogleGenAI({ apiKey: apiKey }) : null;

export const askAI = async (prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
  if (!apiKey || !ai) {
    console.error("API_KEY is missing in environment variables.");
    return "Erro: Chave de API não configurada no sistema (Vercel/Environment).";
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
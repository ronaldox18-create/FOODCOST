
import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from process.env as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const askAI = async (prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
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

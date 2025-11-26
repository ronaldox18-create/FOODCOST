import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

export const askAI = async (prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
  if (!apiKey) {
    console.error("API_KEY is missing");
    return "Erro: Chave de API não configurada.";
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("AI Request Failed:", error);
    return "";
  }
};

import { GoogleGenAI } from "@google/genai";

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
    return "Desculpe, a IA está indisponível no momento. Tente novamente mais tarde.";
  }
};
const apiKey = import.meta.env.VITE_GOOGLE_AI_KEY ? import.meta.env.VITE_GOOGLE_AI_KEY.trim() : "";

// Atualizado para usar o modelo que confirmamos estar disponível na sua conta
const DEFAULT_MODEL = 'gemini-2.0-flash';

export const askAI = async (prompt: string, model: string = DEFAULT_MODEL): Promise<string> => {
  if (!apiKey) {
    return "Erro: Chave de API da IA não configurada no arquivo .env.";
  }

  // Remove o prefixo 'models/' se for passado acidentalmente
  const cleanModel = model.replace('models/', '');
  
  const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };

  try {
    const response = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      // Se o modelo padrão falhar, tenta um fallback seguro que também vimos na lista
      if (response.status === 404 && cleanModel === DEFAULT_MODEL) {
        console.warn(`[AI RAW] ${DEFAULT_MODEL} falhou, tentando gemini-2.0-flash-lite...`);
        return askAI(prompt, 'gemini-2.0-flash-lite');
      }

      const errorMsg = data.error?.message || JSON.stringify(data.error);
      return `Erro da IA (${response.status}): ${errorMsg}`;
    }

    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
    } else {
        return "A IA não retornou resposta.";
    }

  } catch (error: any) {
    console.error("[AI RAW] Erro de rede:", error);
    return "Erro de conexão com o Google.";
  }
};


import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, USER_PROMPT } from '../constants';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // result is "data:audio/mpeg;base64,...."
      // we only need the part after the comma
      const base64String = result.split(',')[1];
      if (base64String) {
        resolve(base64String);
      } else {
        reject(new Error("Failed to read file as base64."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

const parseTranscriptionResponse = (text: string) => {
    const fielMatch = text.match(/Transcripción Fiel:([\s\S]*?)(\n\nNotas de Observación:|$)/i);
    const notasMatch = text.match(/Notas de Observación:([\s\S]*)/i);

    const transcription = fielMatch ? fielMatch[1].trim() : "No se pudo extraer la transcripción. Respuesta completa:\n" + text;
    const notes = notasMatch ? notasMatch[1].trim() : "No se pudieron extraer las notas.";

    return { transcription, notes };
};

export const transcribeMedia = async (mediaFile: File) => {
  if (!process.env.API_KEY) {
    throw new Error("La clave de API no está configurada. Asegúrate de que la variable de entorno API_KEY esté definida.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';

  try {
    const base64Media = await fileToBase64(mediaFile);
    const mediaPart = {
      inlineData: {
        mimeType: mediaFile.type,
        data: base64Media,
      },
    };

    const textPart = {
      text: USER_PROMPT,
    };

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [mediaPart, textPart] },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    if (!response.text) {
        throw new Error('La respuesta de la API no contiene texto. Por favor, revisa la salida de la consola para más detalles.');
    }

    return parseTranscriptionResponse(response.text);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error('La clave de API no es válida. Por favor, verifica tu clave.');
    }
    throw new Error('No se pudo comunicar con el servicio de transcripción. Inténtalo de nuevo más tarde.');
  }
};

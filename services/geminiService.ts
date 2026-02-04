import { SYSTEM_INSTRUCTION, USER_PROMPT } from '../constants';

// Convierte el archivo procesado por FFmpeg a Base64 para el transporte
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64String = result.split(',')[1];
      if (base64String) {
        resolve(base64String);
      } else {
        reject(new Error("Error al convertir audio a base64."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

// Mantiene tu lógica original para separar la transcripción de las notas
const parseTranscriptionResponse = (text: string) => {
  const fielMatch = text.match(/Transcripción Fiel:([\s\S]*?)(\n\nNotas de Observación:|$)/i);
  const notasMatch = text.match(/Notas de Observación:([\s\S]*)/i);

  const transcription = fielMatch ? fielMatch[1].trim() : "No se pudo extraer la transcripción detallada.";
  const notes = notasMatch ? notasMatch[1].trim() : "No se pudieron extraer las notas.";

  return { transcription, notes };
};

export const transcribeMedia = async (mediaFile: File) => {
  try {
    const base64Media = await fileToBase64(mediaFile);

    // Llamada a tu Backend Proxy en Vercel (/api/transcribe.ts)
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mediaData: base64Media, // Usamos un nombre genérico
        mimeType: mediaFile.type,
        systemInstruction: SYSTEM_INSTRUCTION,
        userPrompt: USER_PROMPT
      }),
    });

    if (!response.ok) {
      const errorText = await response.text(); // Leemos como texto primero
      console.error("Respuesta del servidor:", errorText);
      throw new Error(`Error ${response.status}: El servidor no pudo procesar el archivo.`);
    }

    const data = await response.json();

    if (!data.text) {
      throw new Error('La IA no devolvió texto. Intenta con un audio más claro.');
    }

    return parseTranscriptionResponse(data.text);

  } catch (error) {
    console.error("Error en geminiService:", error);
    throw error;
  }
};
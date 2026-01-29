
// Este archivo representa una "función sin servidor" (Serverless Function).
// Cuando despliegues tu proyecto en una plataforma como Vercel o Netlify,
// cualquier archivo dentro de la carpeta /api se convierte automáticamente
// en un endpoint de API que puedes llamar desde tu frontend.
//
// Nombre del endpoint: /api/transcribe
//
// ¡Importante! Este código se ejecuta en el servidor, no en el navegador.
// Aquí es donde puedes usar tu API_KEY de forma segura.

import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, USER_PROMPT } from '../constants';

// Función para parsear la respuesta (la misma que tenías antes)
const parseTranscriptionResponse = (text: string) => {
    const fielMatch = text.match(/Transcripción Fiel:([\s\S]*?)(\n\nNotas de Observación:|$)/i);
    const notasMatch = text.match(/Notas de Observación:([\s\S]*)/i);

    const transcription = fielMatch ? fielMatch[1].trim() : "No se pudo extraer la transcripción. Respuesta completa:\n" + text;
    const notes = notasMatch ? notasMatch[1].trim() : "No se pudieron extraer las notas.";

    return { transcription, notes };
};

// Esta es la función principal que se ejecutará cuando el frontend llame a `/api/transcribe`.
// El formato exacto de la función (ej: req, res) puede variar ligeramente
// dependiendo de la plataforma de hosting (Vercel, Netlify), pero la lógica es la misma.
// Este ejemplo está escrito para ser compatible con Vercel.

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { base64Media, mimeType } = await req.json();

    if (!base64Media || !mimeType) {
      return new Response(JSON.stringify({ error: 'Faltan datos (base64Media o mimeType)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ¡CRÍTICO! La clave de API se lee de las variables de entorno del servidor.
    // NUNCA se escribe directamente en el código.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("La variable de entorno API_KEY no está configurada en el servidor.");
      return new Response(JSON.stringify({ error: 'Error de configuración del servidor.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-flash-preview';

    const mediaPart = {
      inlineData: {
        mimeType: mimeType,
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
      throw new Error('La respuesta de la API de Gemini no contiene texto.');
    }

    const parsedResult = parseTranscriptionResponse(response.text);

    return new Response(JSON.stringify(parsedResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error en la función de API /api/transcribe:", error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

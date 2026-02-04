import { GoogleGenerativeAI } from "@google/generative-ai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Verificación de método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { mediaData, mimeType, systemInstruction, userPrompt } = req.body;

    // 2. Validación de API Key (Evita el error de "API Key not found")
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Falta GEMINI_API_KEY en variables de entorno");
      return res.status(500).json({ error: "Configuración del servidor incompleta" });
    }

    // 3. Validación de datos de entrada
    if (!mediaData || !mimeType) {
      return res.status(400).json({ error: "Faltan datos requeridos (mediaData o mimeType)" });
    }

    // 4. Inicialización con tipado seguro
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Usamos gemini-1.5-flash para procesar archivos multimedia por su gran ventana de contexto
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      systemInstruction: systemInstruction 
    });

    // 5. Envío a Gemini
    const result = await model.generateContent([
      { text: userPrompt || "Transcribe fielmente el contenido del audio." },
      { 
        inlineData: { 
          data: mediaData, // Se espera un string Base64 puro
          mimeType: mimeType 
        } 
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // 6. Respuesta JSON pura
    return res.status(200).json({ text });

  } catch (error: any) {
    console.error("Error en API Gemini:", error.message);
    
    // Manejo de errores de cuota o tamaño
    const status = error.message?.includes('413') ? 413 : 500;
    return res.status(status).json({ 
      error: "Error en el procesamiento de IA", 
      details: error.message 
    });
  }
}
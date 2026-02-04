import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { mediaData, mimeType, systemInstruction, userPrompt } = req.body;

    // Asegúrate de tener GEMINI_API_KEY en las variables de entorno de Vercel
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // Flash es mejor para payloads grandes
      systemInstruction: systemInstruction 
    });

    const result = await model.generateContent([
      { text: userPrompt },
      { inlineData: { data: mediaData, mimeType: mimeType } }
    ]);

    // Enviamos un objeto JSON puro para evitar errores de parseo
    res.status(200).json({ text: result.response.text() });
  } catch (error) {
    console.error("Error en API:", error.message);
    res.status(500).json({ error: "Error en el servidor de IA", details: error.message });
  }
}
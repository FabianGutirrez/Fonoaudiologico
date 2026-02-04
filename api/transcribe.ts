import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // Aquí recibimos 'mediaData', tal como lo envía el frontend
    const { mediaData, mimeType, systemInstruction, userPrompt } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction 
    });

    const result = await model.generateContent([
      { text: userPrompt },
      { inlineData: { data: mediaData, mimeType: mimeType } }
    ]);

    const text = result.response.text();
    
    // Devolvemos un JSON limpio. Esto evita el error "Unexpected token R"
    res.status(200).json({ text });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
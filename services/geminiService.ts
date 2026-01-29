
const fileToBase64 = (file: File): Promise<{ base64Media: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64String = result.split(',')[1];
      if (base64String) {
        resolve({ base64Media: base64String, mimeType: file.type });
      } else {
        reject(new Error("Failed to read file as base64."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const transcribeMedia = async (mediaFile: File): Promise<{ transcription: string; notes: string }> => {
  try {
    const { base64Media, mimeType } = await fileToBase64(mediaFile);

    // Llamamos a nuestro propio backend seguro en lugar de a la API de Gemini directamente.
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Media, mimeType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error del servidor: ${response.statusText}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error("Error al transcribir:", error);
    if (error instanceof Error) {
        throw new Error(`No se pudo comunicar con el servicio de transcripción. Detalle: ${error.message}`);
    }
    throw new Error('Ocurrió un error desconocido durante la comunicación con el servidor.');
  }
};

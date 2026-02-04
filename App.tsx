import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { AudioUploader } from './components/AudioUploader';
import { ResultTable } from './components/ResultTable'; // Usamos la tabla profesional
import { LoadingSpinner, AlertTriangleIcon } from './components/Icons';
import { transcribeMedia } from './services/geminiService';

const App: React.FC = () => {
  // Estado para el archivo OPTIMIZADO (el .mp3 ligero)
  const [optimizedFile, setOptimizedFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Esta función recibirá el archivo MP3 pequeño desde AudioUploader
  const handleFileOptimized = (file: File | null) => {
    setOptimizedFile(file);
    setTranscription(null);
    setNotes(null);
    setError(null);
  };
  
  const handleTranscription = useCallback(async () => {
    if (!optimizedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      // Enviamos el archivo de ~3-5MB, no el de 400MB
      const result = await transcribeMedia(optimizedFile);
      setTranscription(result.transcription);
      setNotes(result.notes);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [optimizedFile]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-100">
          <p className="text-slate-600 mb-6 text-center">
            Sube tu video o audio. El sistema extraerá el audio automáticamente para el análisis.
          </p>

          {/* AudioUploader ahora se encarga de la compresión pesada */}
          <AudioUploader onFileChange={handleFileOptimized} disabled={isLoading} />
          
          <div className="mt-6 flex flex-col items-center">
            <button
              onClick={handleTranscription}
              disabled={!optimizedFile || isLoading}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <><LoadingSpinner /> Transcribiendo...</>
              ) : (
                'Iniciar Transcripción Clínica'
              )}
            </button>
            
            {optimizedFile && !isLoading && !transcription && (
              <p className="mt-2 text-xs text-teal-600 font-medium animate-pulse">
                ✓ Audio optimizado correctamente. Listo para procesar.
              </p>
            )}
          </div>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="mt-8 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center gap-3 shadow-sm">
            <AlertTriangleIcon className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        
        {/* Tabla de Resultados (Solo aparece si hay datos) */}
        {(transcription || notes) && !isLoading && (
          <ResultTable data={{ transcription: transcription || '', notes: notes || '' }} />
        )}

      </main>
      <footer className="text-center py-10 text-slate-400 text-xs tracking-widest uppercase">
        Potenciado por Gemini 1.5 Flash • Optimización FFmpeg WASM
      </footer>
    </div>
  );
};

export default App;
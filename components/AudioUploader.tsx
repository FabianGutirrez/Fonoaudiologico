import { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// 1. Definimos qué recibe el componente
interface AudioUploaderProps {
  onFileChange: (file: File | null) => void;
  disabled?: boolean; // El signo ? significa que es opcional
}

// 2. Aplicamos la interfaz al componente
export const AudioUploader: React.FC<AudioUploaderProps> = ({ onFileChange, disabled }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [optimizedFile, setOptimizedFile] = useState<File | null>(null);
  const ffmpegRef = useRef(new FFmpeg());

  const processVideo = async (file: File) => {
    setLoading(true);
    setOptimizedFile(null);
    onFileChange(null); // Notificar al padre que estamos procesando
    setProgress(0);
    const ffmpeg = ffmpegRef.current;

    ffmpeg.on('progress', ({ progress }) => {
      setProgress(Math.round(progress * 100));
    });

    try {
      if (!ffmpeg.loaded) {
        setStatus('Iniciando motor fonoaudiológico...');
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      }

      // --- CORRECCIÓN 1: LIMPIEZA Y NOMBRES COHERENTES ---
      try {
        await ffmpeg.deleteFile('input_file');
        await ffmpeg.deleteFile('output.mp3');
      } catch (e) { /* Archivos no existen aún */ }

      setStatus('Procesando video pesado (extrayendo audio clínico)...');
      // Escribimos como 'input_file'
      await ffmpeg.writeFile('input_file', await fetchFile(file));
      
      // --- CORRECCIÓN 2: COMANDOS DE COMPRESIÓN OPTIMIZADOS ---
      await ffmpeg.exec([
        '-i', 'input_file', // Debe coincidir con el nombre de arriba
        '-vn', 
        '-ac', '1', 
        '-ar', '16000', 
        '-ab', '32k', 
        'output.mp3'
      ]);
      
      // --- CORRECCIÓN 3: LECTURA SEGURA DE DATOS ---
      const data = await ffmpeg.readFile('output.mp3');
      const audioUint8 = new Uint8Array(data as ArrayBuffer); 
      const audioBlob = new Blob([audioUint8], { type: 'audio/mp3' });
      const audioFile = new File([audioBlob], 'audio_analisis.mp3', { type: 'audio/mp3' });
      
      setOptimizedFile(audioFile);
      onFileChange(audioFile); // Enviamos el archivo pequeño al App.tsx
      setStatus('✓ Video optimizado. Listo para transcribir.');
      setProgress(100);
    } catch (e) {
      console.error(e);
      setStatus('Error al procesar. Intenta con un archivo más corto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-teal-500 rounded-xl bg-white shadow-sm">
      <div className="flex flex-col items-center gap-4">
        <input 
          type="file" 
          accept="video/*,audio/*" 
          onChange={(e) => e.target.files?.[0] && processVideo(e.target.files[0])}
          disabled={loading || disabled}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
        />

        {loading && (
          <div className="w-full bg-gray-200 rounded-full h-3 mt-2 overflow-hidden">
            <div 
              className="bg-teal-600 h-full transition-all duration-300 shadow-[0_0_10px_rgba(13,148,136,0.5)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
        
        {loading && <p className="text-xs text-teal-700 font-bold animate-pulse">{progress}% procesado</p>}
      </div>

      {status && (
        <p className={`mt-4 text-sm text-center font-medium ${status.includes('Error') ? 'text-red-500' : 'text-slate-600'}`}>
          {status}
        </p>
      )}
    </div>
  );
};
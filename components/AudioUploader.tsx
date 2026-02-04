import { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { transcribeMedia } from '../services/geminiService';

export const AudioUploader = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0); // Nuevo estado para el %
  const [optimizedFile, setOptimizedFile] = useState<File | null>(null);
  const ffmpegRef = useRef(new FFmpeg());

  const processVideo = async (file: File) => {
    setLoading(true);
    setOptimizedFile(null);
    setProgress(0);
    const ffmpeg = ffmpegRef.current;

    // Escuchador de progreso
    ffmpeg.on('progress', ({ progress }) => {
      // progress es un valor de 0 a 1, lo convertimos a 0-100
      setProgress(Math.round(progress * 100));
    });

    try {
      if (!ffmpeg.loaded) {
        setStatus('Cargando motor...');
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      }

      setStatus('Optimizando video para análisis...');
      await ffmpeg.writeFile('input', await fetchFile(file));
      
      // Ejecutar conversión
      await ffmpeg.exec(['-i', 'input', '-vn', '-ab', '128k', 'output.mp3']);
      
      const data = await ffmpeg.readFile('output.mp3');
      const audioFile = new File([new Blob([data])], 'audio_listo.mp3', { type: 'audio/mp3' });
      
      setOptimizedFile(audioFile);
      setStatus('¡Optimización lista!');
      setProgress(100);
    } catch (e) {
      console.error(e);
      setStatus('Error en el proceso.');
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
          disabled={loading}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
        />

        {/* Barra de Progreso Visual */}
        {loading && (
          <div className="w-full bg-gray-200 rounded-full h-4 mt-4 overflow-hidden">
            <div 
              className="bg-teal-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
        
        {loading && <p className="text-xs text-teal-700 font-bold">{progress}% procesado</p>}

        <button
          onClick={() => optimizedFile && transcribeMedia(optimizedFile)}
          disabled={!optimizedFile || loading}
          className={`mt-4 px-8 py-2 rounded-lg font-bold transition-all ${
            !optimizedFile || loading 
              ? 'bg-gray-200 text-gray-400' 
              : 'bg-teal-600 text-white hover:bg-teal-700'
          }`}
        >
          {loading ? 'Espere...' : 'Iniciar Transcripción'}
        </button>
      </div>

      {status && (
        <p className="mt-4 text-sm text-center text-slate-600 font-medium">
          {status}
        </p>
      )}
    </div>
  );
};
import { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { transcribeMedia } from '../services/geminiService';

export const AudioUploader = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const ffmpegRef = useRef(new FFmpeg());

  const processVideo = async (file: File) => {
    setLoading(true);
    const ffmpeg = ffmpegRef.current;

    try {
      setStatus('Cargando motor de procesamiento...');
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setStatus('Extrayendo audio del video pesado...');
      await ffmpeg.writeFile('input_video', await fetchFile(file));
      
      // Comando para extraer audio y convertirlo a MP3 ligero
      await ffmpeg.exec(['-i', 'input_video', '-vn', '-ab', '128k', 'output.mp3']);
      
      const data = await ffmpeg.readFile('output.mp3');
      const audioBlob = new Blob([data], { type: 'audio/mp3' });
      const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mp3' });

      setStatus('Enviando audio ligero a Gemini...');
      const result = await transcribeMedia(audioFile);
      
      console.log("Transcripción lista:", result);
      setStatus('¡Completado!');
    } catch (error) {
      console.error(error);
      setStatus('Error al procesar el archivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border-2 border-dashed border-brand-primary rounded-lg text-center">
      <input 
        type="file" 
        accept="video/*,audio/*" 
        onChange={(e) => e.target.files?.[0] && processVideo(e.target.files[0])}
        disabled={loading}
      />
      {loading && <p className="mt-2 text-brand-primary animate-pulse">{status}</p>}
      {!loading && status && <p className="mt-2 text-green-600">{status}</p>}
    </div>
  );
};
import React, { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface AudioUploaderProps {
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({ onFileChange, disabled }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0); 
  const ffmpegRef = useRef(new FFmpeg());

  const processVideo = async (file: File) => {
    setLoading(true);
    setProgress(0);
    onFileChange(null);
    const ffmpeg = ffmpegRef.current;

    ffmpeg.on('progress', ({ progress: p }) => {
      setProgress(Math.round(p * 100));
    });

    try {
      if (!ffmpeg.loaded) {
        setStatus('Cargando motor de procesamiento...');
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      }

      try { 
        await ffmpeg.deleteFile('input_file'); 
        await ffmpeg.deleteFile('output.mp3'); 
      } catch (e) {}

      setStatus('Extrayendo audio clínico...');
      await ffmpeg.writeFile('input_file', await fetchFile(file));
      
      await ffmpeg.exec([
        '-i', 'input_file', 
        '-vn', '-ac', '1', '-ar', '16000', '-ab', '32k', 
        'output.mp3'
      ]);
      
      const data = await ffmpeg.readFile('output.mp3');
      const audioUint8 = new Uint8Array(data as ArrayBuffer); 
      const audioBlob = new Blob([audioUint8], { type: 'audio/mp3' });
      const audioFile = new File([audioBlob], 'audio_optimizado.mp3', { type: 'audio/mp3' });
      
      onFileChange(audioFile);
      setStatus('✓ ¡Procesamiento completado!');
      setProgress(100);
      
    } catch (error) {
      console.error("Error FFmpeg:", error);
      setStatus('Error: Falló el procesamiento del archivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-teal-400 rounded-xl bg-teal-50/30 transition-all hover:bg-teal-50/50">
      <div className="flex flex-col items-center gap-4">
        <label className="flex flex-col items-center justify-center w-full cursor-pointer">
          <span className="mb-2 text-sm font-semibold text-teal-700 text-center">
            {loading ? 'Procesando archivo...' : 'Seleccionar Video o Audio para Análisis'}
          </span>
          <input 
            type="file" 
            accept="video/*,audio/*" 
            onChange={(e) => e.target.files?.[0] && processVideo(e.target.files[0])}
            disabled={loading || disabled}
            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-teal-600 file:text-white hover:file:bg-teal-700 transition-colors"
          />
        </label>

        {/* Bloque de carga integrado dentro del contenedor principal */}
        {loading && (
          <div className="w-full space-y-2 mt-2">
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-teal-600 h-full transition-all duration-300 shadow-[0_0_8px_rgba(13,148,136,0.4)]" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-center font-bold text-teal-600 uppercase tracking-tighter">
              {progress}% procesado
            </p>
          </div>
        )}

        {status && (
          <p className={`text-xs text-center font-medium ${status.includes('Error') ? 'text-red-500' : 'text-slate-600'}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
};
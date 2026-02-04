import React from 'react';

interface ResultTableProps {
  data: {
    transcription: string;
    notes: string;
  } | null;
}

export const ResultTable: React.FC<ResultTableProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="mt-8 space-y-6 animate-fade-in">
      <div className="overflow-hidden bg-white shadow-lg rounded-xl border border-teal-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-teal-600">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                Categoría del Análisis
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                Contenido Extraído por IA
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {/* Fila de Transcripción Fiel */}
            <tr className="hover:bg-teal-50/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-teal-800 bg-teal-50/30 w-1/4">
                Transcripción Fiel
              </td>
              <td className="px-6 py-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {data.transcription}
              </td>
            </tr>
            {/* Fila de Notas de Observación */}
            <tr className="hover:bg-teal-50/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-teal-800 bg-teal-50/30">
                Notas de Observación
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 italic leading-relaxed whitespace-pre-wrap">
                {data.notes}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Botón de Acción para el Informe */}
      <div className="flex justify-end">
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-all shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Exportar a PDF / Imprimir
        </button>
      </div>
    </div>
  );
};
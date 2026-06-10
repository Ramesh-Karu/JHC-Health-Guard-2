import React from 'react';
import { X, FileText, Download } from 'lucide-react';
import { motion } from 'motion/react';

interface PreviewModalProps {
  data: any[];
  onClose: () => void;
  onDownload: () => void;
  filterClass: string;
  filterDivision: string;
}

export const ExportPreviewModal: React.FC<PreviewModalProps> = ({ data, onClose, onDownload, filterClass, filterDivision }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">PDF Document Preview</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-grow flex justify-center bg-slate-100">
          <div className="w-[210mm] min-h-[297mm] bg-white shadow-lg p-10 text-slate-900">
            <div className="flex justify-between border-b pb-6 mb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-blue-900">JHC Health Guard</h1>
                <p className="text-sm text-slate-500">Official Health Data Report</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-bold">Generated: {new Date().toLocaleString()}</p>
                <p>Dataset: Class {filterClass || 'All'} / Div {filterDivision || 'All'}</p>
              </div>
            </div>
            
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {Object.keys(data[0] || {}).map(k => <th key={k} className="p-2 border">{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b">
                    {Object.values(row).map((v: any, j) => <td key={j} className="p-2 border">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="mt-10 text-xs text-slate-400 italic text-center">
              Confidential Document - https://jhchealthguard.online
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end gap-2 bg-slate-50">
            <button onClick={onClose} className="px-6 py-2 rounded-xl text-slate-700 hover:bg-slate-200 font-bold">Close</button>
            <button onClick={onDownload} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
              <Download size={18} /> Final Download
            </button>
        </div>
      </motion.div>
    </div>
  );
};

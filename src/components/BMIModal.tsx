import React from 'react';
import { X } from 'lucide-react';
import BMICalculator from './BMICalculator';

interface BMIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BMIModal({ isOpen, onClose }: BMIModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors z-10"
        >
          <X size={20} />
        </button>
        <div className="p-6">
          <BMICalculator />
        </div>
      </div>
    </div>
  );
}

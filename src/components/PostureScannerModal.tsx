import React from 'react';
import { X } from 'lucide-react';
import PostureScanner from './PostureScanner';

interface PostureScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PostureScannerModal({ isOpen, onClose }: PostureScannerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden relative border-t md:border border-slate-700 max-h-[90vh] md:max-h-none flex flex-col">
        <div className="p-6 pb-20 md:pb-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Posture Scanner</h2>
            <button 
              onClick={onClose}
              className="p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <PostureScanner />
        </div>
      </div>
    </div>
  );
}

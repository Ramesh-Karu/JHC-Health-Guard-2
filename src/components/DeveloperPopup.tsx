import React from 'react';
import DeveloperTools from './DeveloperTools';

export default function DeveloperPopup({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Developer</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">Close</button>
        </div>
        <DeveloperTools />
      </div>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PostureScanner from '../components/PostureScanner';

export default function PostureScannerPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors mb-8 font-bold"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">Posture Scanner</h2>
          <PostureScanner />
        </div>
      </div>
    </div>
  );
}

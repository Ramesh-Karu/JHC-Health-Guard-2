import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BMICalculator from '../components/BMICalculator';

export default function BMICalculatorPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl relative">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors mb-8 font-bold"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <BMICalculator />
      </div>
    </div>
  );
}

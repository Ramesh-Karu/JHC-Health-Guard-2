import React from 'react';
import { motion } from 'motion/react';
import { LogIn, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

export const FloatingLoginBar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) return null;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-32 left-4 right-4 z-50 md:left-auto md:right-8 md:w-80"
    >
      <button 
        onClick={() => navigate('/login')}
        className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between group hover:bg-slate-800 transition-all border border-white/10"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
            <LogIn size={20} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold">Login to continue</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unlock full features</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
      </button>
    </motion.div>
  );
};

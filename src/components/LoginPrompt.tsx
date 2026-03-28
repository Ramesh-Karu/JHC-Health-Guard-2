import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPromptProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const LoginPrompt: React.FC<LoginPromptProps> = ({ 
  title = "Authentication Required", 
  description = "Please login to your account to view this data and access all features.",
  icon = <Lock size={48} />
}) => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-6"
    >
      <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500">
        {icon}
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <button 
        onClick={() => navigate('/login')}
        className="flex items-center gap-2 px-8 py-4 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
      >
        <LogIn size={20} />
        <span>Login to Continue</span>
      </button>
    </motion.div>
  );
};

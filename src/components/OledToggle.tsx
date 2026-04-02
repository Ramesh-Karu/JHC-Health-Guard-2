import React from 'react';
import { Circle, CheckCircle2 } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '../App';

export const OledToggle = () => {
  const { theme, setTheme } = useTheme();

  const isOled = theme === 'oled';

  const toggleOled = () => {
    if (isOled) {
      setTheme('dark');
    } else {
      setTheme('oled');
    }
  };

  return (
    <button
      onClick={toggleOled}
      className={cn(
        "p-2 rounded-xl transition-all duration-200",
        isOled 
          ? "bg-black text-white border border-slate-800" 
          : "bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
      )}
      aria-label="Toggle OLED mode"
    >
      {isOled ? <CheckCircle2 size={20} /> : <Circle size={20} />}
    </button>
  );
};

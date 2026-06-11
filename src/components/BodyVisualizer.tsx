import React from 'react';
import { motion } from 'motion/react';
import { Activity, Target, ShieldAlert, ShieldCheck } from 'lucide-react';

interface BodyVisualizerProps {
  bmi?: number;
  weight?: number;
  height?: number;
  circumference?: number;
}

export const BodyVisualizer: React.FC<BodyVisualizerProps> = ({ bmi = 0, weight = 0, height = 0, circumference = 0 }) => {
  const isHealthy = bmi >= 18.5 && bmi < 25;
  const isOverweight = bmi >= 25 && bmi < 30;
  const isObese = bmi >= 30;

  const hasData = bmi > 0;
  
  // HUD colors
  const hudColor = isHealthy ? '#10b981' : ((isOverweight || isObese) ? '#ef4444' : '#06b6d4');
  const tailwindColor = isHealthy ? 'text-emerald-400' : ((isOverweight || isObese) ? 'text-red-400' : 'text-cyan-400');
  const borderColor = isHealthy ? 'border-emerald-500/30' : ((isOverweight || isObese) ? 'border-red-500/30' : 'border-cyan-500/30');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl relative overflow-hidden shadow-2xl">
      {/* Background Grid for futuristic feel */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      ></div>

      <div className="relative z-10 p-4 flex flex-col h-[400px] md:h-[350px]">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className={tailwindColor} />
            3D Biometric Scan
          </h3>
          {hasData && (
            <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-2 bg-slate-800 ${borderColor} ${tailwindColor}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${isHealthy ? 'bg-emerald-500' : ((isOverweight || isObese) ? 'bg-red-500' : 'bg-cyan-500')}`}></span>
              LIVE SCAN
            </div>
          )}
        </div>

        {/* 3D Model & Overlay Area */}
        <div className="relative flex-1 w-full mx-auto max-w-4xl">
          
          {/* Real 3D Model Placeholder Image */}
          {/* Note: I am providing a placeholder 3D student image. You can swap the src with your own provided asset URL. */}
          <div className="absolute inset-x-0 bottom-0 top-4 flex justify-center items-center pointer-events-none">
            <img 
              src="https://i.ibb.co/zhLfnNL8/1000218522-removebg-preview.png" 
              alt="3D Student Model" 
              className="h-[85%] md:h-[90%] object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)] z-20"
              style={{ filter: hasData ? 'none' : 'grayscale(100%) opacity(50%)' }}
              onError={(e) => {
                 (e.target as HTMLImageElement).src = 'https://models.readyplayer.me/65842880c102a9ebcf2a1a8a.png?quality=100&camera=full';
              }}
            />
          </div>

          {/* HUD Overlay Lines (SVG) */}
          <svg className="absolute inset-0 w-full h-full z-30 pointer-events-none">
             {hasData && (
              <>
                {/* HEIGHT HUD: Line from Head to Top-Left */}
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <line x1="50%" y1="12%" x2="20%" y2="12%" stroke={hudColor} strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle cx="50%" cy="12%" r="4" fill="none" stroke={hudColor} strokeWidth="2" />
                  <circle cx="50%" cy="12%" r="1.5" fill={hudColor} />
                  <polyline points="20%,12% 16%,12% 12%,14%" fill="none" stroke={hudColor} strokeWidth="1.5" />
                </motion.g>

                {/* WAIST/CIRCUMFERENCE HUD: Ellipse around waist to Mid-Right */}
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                  {/* 3D Ring around waist */}
                  <ellipse cx="50%" cy="58%" rx="28" ry="8" fill="none" stroke={hudColor} strokeWidth="2" strokeDasharray="4 4" className="opacity-80" />
                  
                  {/* Overweight highlight flare area if needed */}
                  {(isOverweight || isObese) && (
                    <ellipse cx="50%" cy="58%" rx="28" ry="8" fill="#ef4444" fillOpacity="0.2" className="animate-pulse" />
                  )}
                  
                  {/* Connection Line */}
                  <line x1="50%" y1="58%" x2="80%" y2="58%" stroke={hudColor} strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle cx="50%" cy="58%" r="2" fill={hudColor} />
                  <polyline points="80%,58% 84%,58% 88%,56%" fill="none" stroke={hudColor} strokeWidth="1.5" />
                </motion.g>
              </>
             )}
          </svg>

          {/* Floating Data Panels Overlay */}
          {hasData && (
            <>
              {/* Top Left: Height Data */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute top-[8%] left-0 z-40 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 p-2 md:p-3 rounded-lg shadow-lg min-w-[90px] md:min-w-[100px]"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className={`w-3 h-3 ${tailwindColor}`} />
                  <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest">Height</span>
                </div>
                <div className="text-lg md:text-xl font-bold text-white font-mono leading-none">
                  {height} <span className="text-[9px] text-slate-500 font-sans">cm</span>
                </div>
              </motion.div>

              {/* Middle Right: Circumference Data */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="absolute top-[58%] right-0 md:right-2 -translate-y-1/2 z-40 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 p-2 md:p-3 rounded-lg shadow-lg min-w-[90px] md:min-w-[100px]"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity className={`w-3 h-3 ${tailwindColor}`} />
                  <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest">Waist</span>
                </div>
                <div className="text-lg md:text-xl font-bold text-white font-mono leading-none">
                  {circumference} <span className="text-[9px] text-slate-500 font-sans">cm</span>
                </div>
              </motion.div>

              {/* Bottom Right: Weight & BMI Data */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-[2%] md:bottom-[5%] left-0 z-40 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 p-2 md:p-3 rounded-lg shadow-lg min-w-[110px]"
              >
                <div className="mb-1.5 border-b border-slate-700/80 pb-1.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Activity className={`w-3 h-3 ${tailwindColor}`} />
                    <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest">Weight Data</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-white font-mono leading-none">
                    {weight} <span className="text-[9px] text-slate-500 font-sans">kg</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1 mt-1.5">
                    {isHealthy ? (
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-3 h-3 text-red-400" />
                    )}
                    <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest">BMI Status</span>
                  </div>
                  <div className={`text-base md:text-lg font-bold font-mono leading-none ${tailwindColor}`}>
                    {bmi.toFixed(1)} 
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* Placeholder state when no data */}
          {!hasData && (
             <div className="absolute inset-0 flex items-center justify-center z-40">
                <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 flex flex-col items-center">
                  <Activity className="w-8 h-8 text-slate-500 mb-3" />
                  <p className="text-slate-400 font-bold tracking-widest uppercase">Awaiting Scan Data</p>
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};


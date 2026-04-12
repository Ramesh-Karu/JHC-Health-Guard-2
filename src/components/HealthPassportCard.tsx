import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Activity, ShieldCheck, CheckCircle2, Scale, Ruler, Zap, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from './ThemeProvider';

interface Props {
  student: any;
  latestRecord?: any;
  passportUrl: string;
  forceFront?: boolean;
}

export const HealthPassportCard = React.forwardRef<HTMLDivElement, Props>(
  ({ student, latestRecord, passportUrl, forceFront }, ref) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const { theme } = useTheme();

    const handleFlip = () => {
      if (forceFront) return;
      setIsFlipped(!isFlipped);
    };

    const cardBaseClasses = cn(
      "relative w-full aspect-[1.4/1] sm:aspect-[1.9/1] max-w-[1200px] mx-auto cursor-pointer transition-all duration-500",
      "rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-14 text-white shadow-2xl overflow-hidden border-2 sm:border-4",
      theme === 'oled' 
        ? "bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700" 
        : "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 border-white/10"
    );

    return (
      <div 
        ref={ref}
        className="relative w-[calc(100%+1rem)] -ml-2 sm:w-full sm:ml-0 max-w-[1200px] mx-auto" 
        style={{ perspective: 2000 }}
      >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(e, info) => {
          if (Math.abs(info.offset.x) > 50) {
            handleFlip();
          }
        }}
        initial={false}
        animate={{ rotateY: (isFlipped && !forceFront) ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
        className={cn("w-full h-full", !forceFront && "cursor-grab active:cursor-grabbing")}
        onClick={handleFlip}
      >
        {/* Front Side */}
        <div 
          className={cn(cardBaseClasses, "backface-hidden")}
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Futuristic background elements */}
          {theme === 'oled' ? (
            <>
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
            </>
          ) : (
            <>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
            </>
          )}
          
          <div className="relative z-10 flex gap-4 sm:gap-8 h-full">
            <div className="w-24 sm:w-56 h-full flex flex-col items-center justify-center gap-4 sm:gap-6">
              <div className={cn("w-20 h-20 sm:w-48 sm:h-48 rounded-2xl sm:rounded-[2.5rem] border-2 sm:border-4 overflow-hidden shadow-2xl shrink-0", theme === 'oled' ? "border-slate-700 bg-slate-800" : "border-white/20 bg-white")}>
                <img 
                  src={student?.photoUrl || "https://i.postimg.cc/qvHpVXB1/images-(21).jpg"} 
                  alt={student?.fullName} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className={cn("p-2 sm:p-5 rounded-xl sm:rounded-3xl shadow-2xl shrink-0", theme === 'oled' ? "bg-slate-800 border border-slate-700" : "bg-white")}>
                <QRCodeSVG value={passportUrl} size={window.innerWidth < 640 ? 50 : 120} fgColor={theme === 'oled' ? "#ffffff" : "#000000"} bgColor="transparent" />
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center gap-3 sm:gap-8 min-w-0">
              <div>
                <h2 className="text-xl sm:text-6xl font-black tracking-tight flex items-start sm:items-center gap-2 sm:gap-4">
                  <span className="leading-tight whitespace-pre-line">{student?.fullName ? student.fullName.replace(' ', '\n') : ''}</span>
                  {student?.wellnessBadge && (
                    <CheckCircle2 size={window.innerWidth < 640 ? 18 : 40} className="text-emerald-400 fill-emerald-400/10 shrink-0 mt-1 sm:mt-0" />
                  )}
                </h2>
                <div className="flex items-center gap-2 sm:gap-4 text-blue-100 font-bold text-[9px] sm:text-xl mt-2 sm:mt-3">
                  <ShieldCheck size={window.innerWidth < 640 ? 12 : 24} className="shrink-0" />
                  <span className="truncate">{student?.class} • Jaffna Hindu College</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-8 mt-1 sm:mt-0">
                <div className={cn("backdrop-blur-md p-2 sm:p-6 rounded-xl sm:rounded-[2rem] border", theme === 'oled' ? "bg-slate-800/50 border-slate-700" : "bg-white/10 border-white/10")}>
                  <p className="text-[7px] sm:text-[14px] font-bold uppercase tracking-widest opacity-70">Index Number</p>
                  <p className="font-bold text-sm sm:text-3xl truncate">{student?.indexNumber || 'N/A'}</p>
                </div>
                <div className={cn("backdrop-blur-md p-2 sm:p-6 rounded-xl sm:rounded-[2rem] border", theme === 'oled' ? "bg-slate-800/50 border-slate-700" : "bg-white/10 border-white/10")}>
                  <p className="text-[7px] sm:text-[14px] font-bold uppercase tracking-widest opacity-70">Health Points</p>
                  <p className="font-bold text-sm sm:text-3xl text-emerald-300">{student?.points || 0}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-6 text-[8px] sm:text-base font-bold opacity-80 mt-2 sm:mt-3">
                <Heart size={window.innerWidth < 640 ? 12 : 24} className="text-red-400 shrink-0" />
                <span className="whitespace-nowrap">Health Passport Active</span>
                <Activity size={window.innerWidth < 640 ? 12 : 24} className="text-blue-300 ml-2 sm:ml-8 shrink-0" />
                <span>{new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
          
          {!forceFront && (
            <div className="absolute bottom-4 right-6 text-[10px] font-bold opacity-30 uppercase tracking-widest">
              Tap to flip
            </div>
          )}
        </div>

        {/* Back Side */}
        {!forceFront && (
          <div 
            className={cn(cardBaseClasses, "backface-hidden")}
            style={{ 
              backfaceVisibility: "hidden", 
              transform: "rotateY(180deg)",
              position: "absolute",
              top: 0,
              left: 0
            }}
          >
            {theme === 'oled' ? (
              <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 -translate-x-1/2 blur-3xl" />
            ) : (
              <div className="absolute top-0 left-0 w-64 h-64 bg-purple-400/10 rounded-full -translate-y-1/2 -translate-x-1/2 blur-3xl" />
            )}
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-2 sm:mb-8">
                <h3 className="text-sm sm:text-2xl font-black tracking-tight flex items-center gap-2">
                  <Activity className="text-blue-300 w-4 h-4 sm:w-6 sm:h-6" />
                  Metrics
                </h3>
                <div className="text-[7px] sm:text-[10px] font-bold opacity-50 uppercase tracking-widest">
                  Updated: {latestRecord?.date ? new Date(latestRecord.date).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 flex-1">
                <div className={cn("backdrop-blur-md p-3 sm:p-6 rounded-xl sm:rounded-3xl border flex flex-col justify-center", theme === 'oled' ? "bg-slate-800/50 border-slate-700" : "bg-white/10 border-white/10")}>
                  <div className="flex items-center gap-1.5 sm:gap-1.5 text-blue-200 mb-1 sm:mb-2">
                    <Scale size={window.innerWidth < 640 ? 12 : 18} />
                    <span className="text-[8px] sm:text-[11px] font-bold uppercase tracking-widest">Weight</span>
                  </div>
                  <p className="text-lg sm:text-5xl font-black">{latestRecord?.weight || '--'} <span className="text-[10px] sm:text-xl font-bold opacity-50">kg</span></p>
                </div>

                <div className={cn("backdrop-blur-md p-3 sm:p-6 rounded-xl sm:rounded-3xl border flex flex-col justify-center", theme === 'oled' ? "bg-slate-800/50 border-slate-700" : "bg-white/10 border-white/10")}>
                  <div className="flex items-center gap-1.5 sm:gap-1.5 text-emerald-200 mb-1 sm:mb-2">
                    <Ruler size={window.innerWidth < 640 ? 12 : 18} />
                    <span className="text-[8px] sm:text-[11px] font-bold uppercase tracking-widest">Height</span>
                  </div>
                  <p className="text-lg sm:text-5xl font-black">{latestRecord?.height || '--'} <span className="text-[10px] sm:text-xl font-bold opacity-50">cm</span></p>
                </div>

                <div className={cn("backdrop-blur-md p-3 sm:p-6 rounded-xl sm:rounded-3xl border flex flex-col justify-center", theme === 'oled' ? "bg-slate-800/50 border-slate-700" : "bg-white/10 border-white/10")}>
                  <div className="flex items-center gap-1.5 sm:gap-1.5 text-amber-200 mb-1 sm:mb-2">
                    <Zap size={window.innerWidth < 640 ? 12 : 18} />
                    <span className="text-[8px] sm:text-[11px] font-bold uppercase tracking-widest">BMI</span>
                  </div>
                  <p className="text-lg sm:text-5xl font-black">{latestRecord?.bmi?.toFixed(1) || '--'}</p>
                  <p className="text-[8px] sm:text-[11px] font-bold text-amber-300 mt-0.5">{latestRecord?.category || 'No Data'}</p>
                </div>

                <div className={cn("backdrop-blur-md p-3 sm:p-6 rounded-xl sm:rounded-3xl border flex flex-col justify-center", theme === 'oled' ? "bg-slate-800/50 border-slate-700" : "bg-white/10 border-white/10")}>
                  <div className="flex items-center gap-1.5 sm:gap-1.5 text-purple-200 mb-1 sm:mb-2">
                    <Info size={window.innerWidth < 640 ? 12 : 18} />
                    <span className="text-[8px] sm:text-[11px] font-bold uppercase tracking-widest">Status</span>
                  </div>
                  <p className="text-sm sm:text-3xl font-black leading-tight">
                    {latestRecord?.category === 'Normal' ? 'Healthy' : 'Checkup'}
                  </p>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[7px] sm:text-[10px] font-bold opacity-50 uppercase tracking-widest">
                <span>ID: {student?.id ? student.id.slice(-8).toUpperCase() : 'N/A'}</span>
                <span>Tap to flip</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
});

HealthPassportCard.displayName = 'HealthPassportCard';


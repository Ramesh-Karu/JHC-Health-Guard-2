import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { 
  Wind, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  Settings, 
  History, 
  Activity, 
  Clock, 
  Info,
  Volume2,
  VolumeX,
  Zap,
  Brain,
  Award,
  TrendingUp,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  color: string;
  bg: string;
}

const PATTERNS: BreathingPattern[] = [
  { 
    id: 'box', 
    name: 'Box Breathing', 
    description: 'The Navy SEAL technique for instant focus and calm.',
    inhale: 4, hold1: 4, exhale: 4, hold2: 4,
    color: 'text-blue-400', bg: 'bg-blue-400/10'
  },
  { 
    id: '478', 
    name: '4-7-8 Relax', 
    description: 'The natural tranquilizer for the nervous system.',
    inhale: 4, hold1: 7, exhale: 8, hold2: 0,
    color: 'text-emerald-400', bg: 'bg-emerald-400/10'
  },
  { 
    id: 'zen', 
    name: 'Zen Breath', 
    description: 'Deep, slow breathing for profound meditation.',
    inhale: 5, hold1: 0, exhale: 10, hold2: 0,
    color: 'text-indigo-400', bg: 'bg-indigo-400/10'
  },
  { 
    id: 'quick', 
    name: 'Quick Reset', 
    description: 'A fast way to lower heart rate and anxiety.',
    inhale: 2, hold1: 0, exhale: 4, hold2: 0,
    color: 'text-rose-400', bg: 'bg-rose-400/10'
  }
];

export default function BreathingSystem() {
  const navigate = useNavigate();
  const [activePattern, setActivePattern] = useState<BreathingPattern>(PATTERNS[0]);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2' | 'ready'>('ready');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [sessions, setSessions] = useState<{ id: string; duration: number; timestamp: number; pattern: string }[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const controls = useAnimation();
  const synth = window.speechSynthesis;

  // Initialize background music
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/music/preview/mixkit-dreamy-morning-111.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const speak = (text: string) => {
    if (!soundEnabled || !synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8; // Slower for calm tone
    utterance.pitch = 1.2; // Slightly higher for "sweet" tone
    synth.speak(utterance);
  };

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('wellness_breathing_sessions');
    if (saved) {
      setSessions(JSON.parse(saved));
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('wellness_breathing_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const startSession = () => {
    setIsActive(true);
    setPhase('ready'); // Start with a brief ready phase
    setTotalSeconds(0);
    
    if (musicEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }

    // Small delay before first inhale
    setTimeout(() => {
      setPhase('inhale');
      setTimeLeft(activePattern.inhale);
      speak('Inhale deeply');
    }, 1000);
  };

  const stopSession = () => {
    setIsActive(false);
    setPhase('ready');
    setTimeLeft(0);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (synth) synth.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (totalSeconds > 5) {
      const newSession = {
        id: Date.now().toString(),
        duration: totalSeconds,
        timestamp: Date.now(),
        pattern: activePattern.name
      };
      setSessions([newSession, ...sessions]);
    }
    setTotalSeconds(0);
  };

  useEffect(() => {
    if (isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setTotalSeconds(prev => prev + 1);
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Switch phase logic
            let nextPhase: typeof phase = 'inhale';
            let nextTime = 0;

            if (phase === 'inhale') {
              if (activePattern.hold1 > 0) {
                nextPhase = 'hold1';
                nextTime = activePattern.hold1;
                speak('Hold your breath');
              } else {
                nextPhase = 'exhale';
                nextTime = activePattern.exhale;
                speak('Exhale slowly');
              }
            } else if (phase === 'hold1') {
              nextPhase = 'exhale';
              nextTime = activePattern.exhale;
              speak('Exhale slowly');
            } else if (phase === 'exhale') {
              if (activePattern.hold2 > 0) {
                nextPhase = 'hold2';
                nextTime = activePattern.hold2;
                speak('Hold');
              } else {
                nextPhase = 'inhale';
                nextTime = activePattern.inhale;
                speak('Inhale');
              }
            } else if (phase === 'hold2') {
              nextPhase = 'inhale';
              nextTime = activePattern.inhale;
              speak('Inhale');
            } else if (phase === 'ready') {
              nextPhase = 'inhale';
              nextTime = activePattern.inhale;
              speak('Inhale');
            }

            setPhase(nextPhase);
            return nextTime;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phase, activePattern]);

  // Animation logic
  useEffect(() => {
    if (!isActive) {
      controls.stop();
      controls.set({ scale: 1, opacity: 0.5 });
      return;
    }

    if (phase === 'inhale') {
      controls.start({
        scale: 1.5,
        opacity: 1,
        transition: { duration: activePattern.inhale, ease: "easeInOut" }
      });
    } else if (phase === 'exhale') {
      controls.start({
        scale: 1,
        opacity: 0.5,
        transition: { duration: activePattern.exhale, ease: "easeInOut" }
      });
    }
  }, [phase, isActive, activePattern, controls]);

  const totalMinutes = useMemo(() => {
    const total = sessions.reduce((acc, curr) => acc + curr.duration, 0);
    return (total / 60).toFixed(1);
  }, [sessions]);

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 overflow-hidden rounded-3xl border border-white/5 shadow-2xl relative">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] transition-all duration-1000 ${
          isActive ? (
            phase === 'inhale' ? 'bg-blue-500/30 scale-125' :
            phase === 'exhale' ? 'bg-emerald-500/30 scale-100' :
            'bg-indigo-500/30 scale-110'
          ) : 'bg-slate-800/20'
        }`} />
      </div>

      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-10 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/others')}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Wind className="text-blue-400" size={20} />
            Mindful Breathing Lab
          </h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setMusicEnabled(!musicEnabled)}
              className={`p-2 rounded-full transition-all ${
                musicEnabled ? "bg-blue-500/20 text-blue-400" : "hover:bg-white/10 text-slate-400"
              }`}
              title="Background Music"
            >
              <History size={20} />
            </button>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-full transition-all ${
                soundEnabled ? "bg-emerald-500/20 text-emerald-400" : "hover:bg-white/10 text-slate-400"
              }`}
              title="Voice Prompts"
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Patterns Selection */}
          <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Settings size={14} />
              Techniques
            </h2>
            {PATTERNS.map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => {
                  if (!isActive) setActivePattern(pattern);
                }}
                disabled={isActive}
                className={`w-full p-4 rounded-2xl border transition-all text-left group ${
                  activePattern.id === pattern.id
                    ? 'bg-white/10 border-white/20 shadow-xl shadow-blue-500/10'
                    : 'bg-transparent border-white/5 hover:border-white/10 opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold ${activePattern.id === pattern.id ? 'text-white' : 'text-slate-400'}`}>
                    {pattern.name}
                  </span>
                  <div className={`p-1.5 rounded-lg ${pattern.bg}`}>
                    <Activity className={pattern.color} size={14} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{pattern.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">{pattern.inhale}-{pattern.hold1}-{pattern.exhale}-{pattern.hold2}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Center: Main Visualizer */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center py-6 md:py-12 order-1 lg:order-2">
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
              {/* Outer Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-white/5" />
              
              {/* Progress Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-white/10"
                />
                {isActive && (
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="48%"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray="1000"
                    initial={{ strokeDashoffset: 1000 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: timeLeft, ease: "linear" }}
                    key={phase + timeLeft}
                    className="text-blue-400"
                  />
                )}
              </svg>

              {/* Breathing Circle */}
              <motion.div
                animate={controls}
                className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-1000 backdrop-blur-xl border border-white/20 ${
                  isActive ? (
                    phase === 'inhale' ? 'bg-blue-500/40 shadow-blue-500/30' :
                    phase === 'exhale' ? 'bg-emerald-500/40 shadow-emerald-500/30' :
                    'bg-indigo-500/40 shadow-indigo-500/30'
                  ) : 'bg-slate-800/40'
                }`}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={phase}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center"
                  >
                    <p className="text-xs font-black uppercase tracking-widest text-white/80 mb-1">
                      {isActive ? phase.replace('1', '').replace('2', '') : 'Ready'}
                    </p>
                    <p className="text-4xl font-black">
                      {isActive ? timeLeft : <Wind size={40} />}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* Pulsing Dots */}
              {isActive && (
                <div className="absolute inset-0">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        delay: i * 0.5,
                        ease: "easeOut"
                      }}
                      className="absolute inset-0 rounded-full border border-white/20"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-16 flex items-center gap-6">
              {!isActive ? (
                <button
                  onClick={startSession}
                  className="px-12 py-4 bg-white text-slate-950 rounded-full font-black text-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl shadow-white/10"
                >
                  <Play fill="currentColor" size={20} />
                  START LAB
                </button>
              ) : (
                <button
                  onClick={stopSession}
                  className="px-12 py-4 bg-rose-500 text-white rounded-full font-black text-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl shadow-rose-500/20"
                >
                  <Pause fill="currentColor" size={20} />
                  STOP SESSION
                </button>
              )}
            </div>

            {isActive && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 text-slate-400 font-mono text-sm"
              >
                Session Time: {Math.floor(totalSeconds / 60)}:{(totalSeconds % 60).toString().padStart(2, '0')}
              </motion.div>
            )}
          </div>

          {/* Right: Stats & History */}
          <div className="lg:col-span-3 space-y-8 order-3">
            {/* Quick Stats */}
            <section className="bg-white/5 rounded-3xl p-6 border border-white/10">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <BarChart3 size={14} />
                Performance
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Total Focus</p>
                  <p className="text-2xl font-black">{totalMinutes}<span className="text-xs text-slate-500 ml-1">MIN</span></p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Sessions</p>
                  <p className="text-2xl font-black">{sessions.length}</p>
                </div>
              </div>
            </section>

            {/* History */}
            <section className="bg-white/5 rounded-3xl p-6 border border-white/10">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <History size={14} />
                Recent Logs
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {sessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold">{session.pattern}</p>
                      <p className="text-[10px] text-slate-500">{new Date(session.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-blue-400">{session.duration}s</p>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <p className="text-center text-xs text-slate-600 italic py-4">No sessions recorded</p>
                )}
              </div>
            </section>
          </div>

        </div>

        {/* Data Privacy Notice */}
        <div className="mt-12 p-6 rounded-3xl bg-blue-500/5 border border-white/5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="text-blue-400" size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Privacy & Data Safety</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your breathing session data is stored <span className="font-bold text-blue-400">locally on your device</span> to protect your privacy and safety. 
              Please note that if the app is uninstalled or its local data is cleared via device settings, all your progress and history will be permanently erased.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

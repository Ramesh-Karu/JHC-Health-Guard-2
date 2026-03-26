
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Heart, Activity, Award, ShieldCheck, Zap } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    title: "Welcome to Health Guard",
    description: "Your personal health companion at Jaffna Hindu College. Track your wellness journey and stay fit.",
    icon: <Heart size={64} className="text-red-500" />,
    color: "bg-red-50"
  },
  {
    title: "Track Your Activities",
    description: "Log your sports, exercises, and daily habits. Earn points for every healthy choice you make.",
    icon: <Activity size={64} className="text-blue-500" />,
    color: "bg-blue-50"
  },
  {
    title: "Earn Badges & Rewards",
    description: "Compete with your classmates on the leaderboard and earn prestigious wellness badges.",
    icon: <Award size={64} className="text-amber-500" />,
    color: "bg-amber-50"
  },
  {
    title: "Stay Informed",
    description: "Get nutrition advice, health updates, and announcements directly from your teachers and coaches.",
    icon: <ShieldCheck size={64} className="text-emerald-500" />,
    color: "bg-emerald-50"
  }
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide === slides.length - 1) {
      onComplete();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    setCurrentSlide(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 font-sans pt-safe pb-safe">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.5, ease: "anticipate" }}
            className="w-full flex flex-col items-center"
          >
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1
              }}
              className={`w-36 h-36 ${slides[currentSlide].color} rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl shadow-slate-200 relative group`}
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {slides[currentSlide].icon}
              </motion.div>
              
              {/* Decorative elements */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center"
              >
                <Zap size={14} className="text-amber-400 fill-amber-400" />
              </motion.div>
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-black text-slate-900 mb-4 tracking-tight"
            >
              {slides[currentSlide].title}
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-slate-500 text-lg leading-relaxed mb-12 font-medium"
            >
              {slides[currentSlide].description}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2 mb-12">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentSlide ? "w-8 bg-blue-500" : "w-2 bg-slate-200"
              }`}
            />
          ))}
        </div>

        <div className="w-full flex items-center justify-between gap-4">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`flex items-center gap-2 px-6 py-3 font-bold rounded-2xl transition-all ${
              currentSlide === 0 ? "opacity-0 pointer-events-none" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <ChevronLeft size={20} />
            Back
          </button>

          <button
            onClick={nextSlide}
            className="flex items-center gap-2 px-8 py-4 bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-600 transition-all active:scale-95"
          >
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
            <ChevronRight size={20} />
          </button>
        </div>

        {currentSlide < slides.length - 1 && (
          <button
            onClick={onComplete}
            className="mt-8 text-slate-400 font-bold text-sm hover:text-slate-600 transition-all"
          >
            Skip Intro
          </button>
        )}
      </div>
    </div>
  );
}

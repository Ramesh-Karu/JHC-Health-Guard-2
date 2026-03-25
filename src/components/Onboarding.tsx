
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
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col items-center"
          >
            <div className={`w-32 h-32 ${slides[currentSlide].color} rounded-full flex items-center justify-center mb-10 shadow-lg`}>
              {slides[currentSlide].icon}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">
              {slides[currentSlide].title}
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed mb-12">
              {slides[currentSlide].description}
            </p>
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

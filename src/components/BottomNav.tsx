import React from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, QrCode, Trophy, MessageSquare, Menu } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../App';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navItems = [
    { icon: QrCode, label: 'Pass', path: '/health-passport' },
    { icon: Trophy, label: 'Trophy', path: '/leaderboard' },
    { icon: LayoutDashboard, label: 'Home', path: '/dashboard', isCenter: true },
    { icon: MessageSquare, label: 'Chat', path: '/community' },
    { icon: Menu, label: 'Menu', path: '/others' },
  ];

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50 md:hidden w-[90%] max-w-[400px]">
      <div className="bg-white/10 backdrop-blur-3xl rounded-[24px] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] px-1 py-1 flex items-center justify-between relative">
        {/* Liquid Slider Background */}
        <div className="absolute inset-x-1 inset-y-1 flex justify-between pointer-events-none">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div key={item.path} className="flex-1 flex items-center justify-center relative">
                {isActive && !item.isCenter && (
                  <motion.div
                    layoutId="liquidSlider"
                    transition={{ 
                      type: "spring", 
                      bounce: 0.15, 
                      duration: 0.5,
                    }}
                    className="absolute inset-0 bg-blue-500/20 rounded-[18px]"
                  />
                )}
              </div>
            );
          })}
        </div>

        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          
          if (item.isCenter) {
            return (
              <div key={item.path} className="relative flex-1 flex justify-center -top-6">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group",
                    "bg-blue-600/80 backdrop-blur-xl border-2 border-white/30",
                    "shadow-[0_12px_24px_-8px_rgba(37,99,235,0.4),inset_0_1px_2px_rgba(255,255,255,0.2)]",
                    "relative overflow-hidden"
                  )}
                >
                  {/* Liquid Glass Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-30" />
                  <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-xl transform rotate-45 animate-pulse" />
                  
                  <item.icon 
                    className={cn(
                      "text-white relative z-10 transition-transform duration-300",
                      isActive ? "scale-110" : "group-hover:scale-110"
                    )} 
                    size={24} 
                  />
                </motion.button>
              </div>
            );
          }

          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 relative z-10 group"
            >
              <item.icon 
                size={20} 
                className={cn(
                  "transition-all duration-300",
                  isActive 
                    ? "text-blue-600 scale-110" 
                    : "text-slate-500/60 group-hover:text-slate-800"
                )} 
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

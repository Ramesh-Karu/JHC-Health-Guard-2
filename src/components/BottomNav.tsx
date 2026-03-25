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
    { icon: QrCode, label: 'Health Pass', path: '/health-passport' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', isCenter: true },
    { icon: MessageSquare, label: 'Community', path: '/community' },
    { icon: Menu, label: 'Others', path: '/others' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe px-4 mb-2">
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] px-4 py-2 flex items-center justify-between relative">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          
          if (item.isCenter) {
            return (
              <div key={item.path} className="relative -top-6">
                <button
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 border-4 border-white",
                    isActive ? "bg-blue-600 shadow-blue-500/30" : "bg-blue-500 shadow-blue-500/20"
                  )}
                >
                  <item.icon className="text-white" size={20} />
                </button>
              </div>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 p-1.5 relative"
            >
              <item.icon 
                size={20} 
                className={cn(
                  "transition-colors",
                  isActive ? "text-blue-600" : "text-slate-400"
                )} 
              />
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -bottom-0.5 w-1 h-1 bg-blue-600 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

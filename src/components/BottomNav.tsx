import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, QrCode, Trophy, MessageSquare, Menu } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../App';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
    { icon: QrCode, label: 'Pass', path: '/health-passport' },
    { icon: Trophy, label: 'Trophy', path: '/leaderboard' },
    { icon: MessageSquare, label: 'Chat', path: '/community' },
    { icon: Menu, label: 'Menu', path: '/others' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 md:hidden z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <item.icon size={20} className={isActive ? "fill-blue-100 dark:fill-blue-900/30" : ""} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}


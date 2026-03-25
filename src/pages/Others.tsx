import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { 
  UserCircle, 
  Settings, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Activity,
  Apple,
  Brain,
  QrCode,
  Microscope,
  BookOpen,
  TrendingUp,
  Leaf,
  ShoppingCart,
  Coffee,
  Code
} from 'lucide-react';
import DeveloperPopup from '../components/DeveloperPopup';

export default function Others() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDeveloperOpen, setIsDeveloperOpen] = useState(false);

  const handleLogout = async () => {
    console.log("Logout triggered from Others menu");
    try {
      await logout();
      console.log("Logout function completed, redirecting...");
      window.location.href = '/login';
    } catch (error) {
      console.error("Error during logout navigation:", error);
      // Fallback redirect
      window.location.href = '/login';
    }
  };

  const sections = [
    {
      title: 'Health & Wellness',
      items: [
        { icon: Activity, label: 'Record Activity', path: '/activities', color: 'bg-blue-500' },
        { icon: TrendingUp, label: 'My Progress', path: '/tracking', color: 'bg-emerald-500' },
        { icon: Apple, label: 'Nutrition', path: '/nutrition', color: 'bg-orange-500' },
        { icon: Brain, label: 'AI Insights', path: '/ai-insights', color: 'bg-purple-500' },
        { icon: QrCode, label: 'Health Passport', path: '/health-passport', color: 'bg-indigo-500' },
      ]
    },
    {
      title: 'School Facilities',
      items: [
        { icon: Leaf, label: 'Marketplace', path: '/marketplace', color: 'bg-green-500' },
        { icon: ShoppingCart, label: 'My Reservations', path: '/my-reservations', color: 'bg-teal-500' },
        { icon: Coffee, label: 'Breakfast Club', path: '/breakfast', color: 'bg-amber-500' },
        { icon: Coffee, label: 'My Breakfast', path: '/my-breakfast', color: 'bg-yellow-500' },
        { icon: Microscope, label: 'STEM Innovation', path: '/stem-innovation', color: 'bg-cyan-500' },
        { icon: BookOpen, label: 'Modules', path: '/modules', color: 'bg-rose-500' },
      ]
    },
    {
      title: 'Account & Support',
      items: [
        { icon: UserCircle, label: 'Health Pass', path: '/health-pass', color: 'bg-blue-500' },
        { icon: Bell, label: 'Notifications', path: '#', color: 'bg-red-500' },
        { icon: Shield, label: 'Privacy & Security', path: '#', color: 'bg-blue-600' },
        { icon: HelpCircle, label: 'Help & Support', path: '/queries', color: 'bg-emerald-600' },
        ...(user?.role === 'admin' ? [{ icon: Code, label: 'Developer', path: '#', color: 'bg-slate-800', onClick: () => setIsDeveloperOpen(true) }] : []),
      ]
    }
  ];

  return (
    <div className="min-h-full bg-[#F2F2F7] -m-4 md:-m-8 p-4 md:p-8 pb-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8 px-2">Settings</h1>

        {/* Admin Section (Admin Only) */}
        {user?.role === 'admin' && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4">
              Admin
            </h3>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {[
                { label: 'Organic Admin', path: '/organic-admin' },
                { label: 'Breakfast Admin', path: '/breakfast-admin' },
                { label: 'User Management', path: '/admin/users' },
                { label: 'Students', path: '/students' },
                { label: 'Teachers', path: '/admin/teachers' },
                { label: 'Badge Applications', path: '/admin/badges' },
                { label: 'Classrooms', path: '/admin/classrooms' },
                { label: 'Health Update', path: '/admin/health-update' },
                { label: 'Sports Management', path: '/admin/sports' },
                { label: 'STEM Innovation', path: '/stem-innovation' },
                { label: 'Modules', path: '/modules' },
              ].map((item, idx) => (
                <button key={item.label} onClick={() => navigate(item.path)} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-blue-500"><Settings size={18} /></div>
                  <span className="flex-1 text-left font-medium text-slate-900">{item.label}</span>
                  <ChevronRight className="text-slate-300" size={20} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/health-pass')}
          className="bg-white rounded-2xl p-4 mb-8 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform shadow-sm"
        >
          <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-2xl">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-slate-900 truncate">{user?.fullName}</h2>
            <p className="text-sm text-slate-500 truncate">{user?.email}</p>
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mt-1">{user?.role}</p>
          </div>
          <ChevronRight className="text-slate-400" size={20} />
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, idx) => (
            <motion.div 
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4">
                {section.title}
              </h3>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {section.items.map((item, itemIdx) => (
                  <button
                    key={item.label}
                    onClick={() => item.onClick ? item.onClick() : navigate(item.path)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors active:bg-slate-100 relative"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${item.color}`}>
                      <item.icon size={18} />
                    </div>
                    <span className="flex-1 text-left font-medium text-slate-900">{item.label}</span>
                    <ChevronRight className="text-slate-300" size={20} />
                    {itemIdx !== section.items.length - 1 && (
                      <div className="absolute bottom-0 left-16 right-0 h-[1px] bg-slate-100" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Logout Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl overflow-hidden shadow-sm mt-8"
          >
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-4 text-red-500 font-semibold hover:bg-red-50 transition-colors active:bg-red-100"
            >
              <LogOut size={20} />
              Log Out
            </button>
          </motion.div>
        </div>
      </div>
      <DeveloperPopup isOpen={isDeveloperOpen} onClose={() => setIsDeveloperOpen(false)} />
    </div>
  );
}

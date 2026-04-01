import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
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
  Code,
  Scan,
  Heart,
  Scale,
  Camera
} from 'lucide-react';
import DeveloperPopup from '../components/DeveloperPopup';
import QRScanner from '../components/QRScanner';
import StudentPassportPopup from '../components/StudentPassportPopup';
import { SyncStatusIndicator } from '../components/SyncManager';
import { InstallPWAButton } from '../components/InstallPWAButton';
import NotificationForm from '../components/NotificationForm';
import NotificationsModal from '../components/NotificationsModal';
import BMIModal from '../components/BMIModal';
import PostureScannerModal from '../components/PostureScannerModal';

export default function Others() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDeveloperOpen, setIsDeveloperOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNotificationFormOpen, setIsNotificationFormOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isBMICalculatorOpen, setIsBMICalculatorOpen] = useState(false);
  const [isPostureScannerOpen, setIsPostureScannerOpen] = useState(false);
  const [scannedStudentId, setScannedStudentId] = useState<string | null>(null);

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

  const handleScan = (decodedText: string) => {
    // Extract ID from URL if it's a passport URL
    // Format: http://.../health-passport/STUDENT_ID
    let studentId = decodedText;
    if (decodedText.includes('/health-passport/')) {
      const parts = decodedText.split('/health-passport/');
      studentId = parts[parts.length - 1];
    }
    
    setScannedStudentId(studentId);
    setIsScannerOpen(false);
  };

  const sections = [
    {
      title: 'Health & Wellness',
      items: [
        { icon: Scan, label: 'QR Scan', path: '#', color: 'bg-blue-600', onClick: () => setIsScannerOpen(true) },
        { icon: Activity, label: 'Record Activity', path: '/activities', color: 'bg-blue-500' },
        { icon: TrendingUp, label: 'My Progress', path: '/tracking', color: 'bg-emerald-500' },
        { icon: Apple, label: 'Nutrition', path: '/nutrition', color: 'bg-orange-500' },
        { icon: Heart, label: 'Health Pet', path: '/health-pet', color: 'bg-pink-500' },
        { icon: Brain, label: 'AI Insights', path: '/ai-insights', color: 'bg-purple-500' },
        { icon: QrCode, label: 'Health Passport', path: '/health-passport', color: 'bg-indigo-500' },
        { icon: Scale, label: 'BMI Calculator', path: '#', color: 'bg-rose-500', onClick: () => setIsBMICalculatorOpen(true) },
        { icon: Camera, label: 'Posture Scanner', path: '#', color: 'bg-blue-600', onClick: () => setIsPostureScannerOpen(true) },
      ]
    },
    {
      title: 'School Facilities',
      items: [
        { icon: Leaf, label: 'Marketplace', path: '/marketplace', color: 'bg-green-500' },
        { icon: ShoppingCart, label: 'My Reservations', path: '/my-reservations', color: 'bg-teal-500' },
        { icon: Coffee, label: 'Healthy Canteen', path: '/breakfast', color: 'bg-amber-500' },
        { icon: Coffee, label: 'My Healthy Breakfast', path: '/my-breakfast', color: 'bg-yellow-500' },
        { icon: Microscope, label: 'STEM Innovation', path: '/stem-innovation', color: 'bg-cyan-500' },
        { icon: BookOpen, label: 'Modules', path: '/modules', color: 'bg-rose-500' },
      ]
    },
    {
      title: 'Appearance',
      items: [
        { icon: Settings, label: 'Dark Mode', path: '#', color: 'bg-slate-500', component: <ThemeToggle /> },
      ]
    },
    {
      title: 'Account & Support',
// ...
      items: [
        { icon: UserCircle, label: 'Health Pass', path: '/health-pass', color: 'bg-blue-500' },
        { icon: Bell, label: 'Notifications', path: '#', color: 'bg-red-500', onClick: () => setIsNotificationsModalOpen(true) },
        ...(user?.role === 'admin' || user?.role === 'teacher' ? [{ icon: Bell, label: 'Create Notification', path: '#', color: 'bg-red-500', onClick: () => setIsNotificationFormOpen(true) }] : []),
        { icon: Apple, label: 'Add to iOS Home Screen', path: '/ios-shortcut', color: 'bg-slate-900' },
        { icon: Shield, label: 'Privacy & Security', path: '/privacy-security', color: 'bg-blue-600' },
        { icon: HelpCircle, label: 'Help & Support', path: '/queries', color: 'bg-emerald-600' },
        { icon: Code, label: 'Developer', path: '#', color: 'bg-slate-800', onClick: () => setIsDeveloperOpen(true) },
      ]
    }
  ];

  return (
    <div className="min-h-full bg-[#F2F2F7] dark:bg-slate-900 -m-4 md:-m-8 p-4 md:p-8 pb-24 pt-safe">
      <Helmet>
        <title>Settings | JHC Health Guard</title>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [{
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://jhchealthguard.online/"
            },{
              "@type": "ListItem",
              "position": 2,
              "name": "Settings",
              "item": "https://jhchealthguard.online/others"
            }]
          })}
        </script>
      </Helmet>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 px-2">Settings</h1>
        
        <div className="px-2 mb-8">
          <InstallPWAButton />
        </div>

        {/* Admin Section (Admin Only) */}
            {user?.role === 'admin' && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4">
                  Admin
                </h3>
                <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  {[
                    { label: 'Organic Admin', path: '/organic-admin' },
                    { label: 'Healthy Canteen Admin', path: '/breakfast-admin' },
                    { label: 'User Management', path: '/admin/users' },
                    { label: 'Student Search & Edit', path: '/admin/student-management' },
                    { label: 'Students', path: '/students' },
                    { label: 'Teachers', path: '/admin/teachers' },
                    { label: 'Badge Applications', path: '/admin/badges' },
                    { label: 'Classrooms', path: '/admin/classrooms' },
                    { label: 'Health Update', path: '/admin/health-update' },
                    { label: 'Sports Management', path: '/admin/sports' },
                    { label: 'STEM Innovation', path: '/stem-innovation' },
                    { label: 'Modules', path: '/modules' },
                  ].map((item, idx) => (
                    <button key={item.label} onClick={() => navigate(item.path)} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-blue-500"><Settings size={18} /></div>
                      <span className="flex-1 text-left font-medium text-slate-900 dark:text-slate-100">{item.label}</span>
                      <ChevronRight className="text-slate-300 dark:text-slate-600" size={20} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Card / Login Prompt */}
            {user ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate('/health-pass')}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-8 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform shadow-sm"
              >
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={user.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-2xl">
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white truncate">{user?.fullName}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mt-1">{user?.role}</p>
                </div>
                <ChevronRight className="text-slate-400 dark:text-slate-600" size={20} />
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate('/login')}
                className="bg-blue-600 rounded-2xl p-6 mb-8 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform shadow-xl shadow-blue-200 dark:shadow-none"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                  <UserCircle className="text-white" size={40} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">Login to your account</h2>
                  <p className="text-blue-100 text-sm">Access your health records and personalized dashboard</p>
                </div>
                <ChevronRight className="text-white/60" size={24} />
              </motion.div>
            )}

            {/* Sync Status Section */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4">
                System Synchronization
              </h3>
              <SyncStatusIndicator inline />
            </div>

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
                  <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    {section.items.map((item, itemIdx) => {
                      const ItemContent = (
                        <div
                          key={item.label}
                          onClick={() => !item.component && (item.onClick ? item.onClick() : navigate(item.path))}
                          className={`w-full flex items-center gap-4 p-4 ${!item.component ? 'hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:bg-slate-100 dark:active:bg-slate-700 cursor-pointer' : ''} relative`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${item.color}`}>
                            <item.icon size={18} />
                          </div>
                          <span className="flex-1 text-left font-medium text-slate-900 dark:text-slate-100">{item.label}</span>
                          {item.component ? (
                            item.component
                          ) : (
                            <ChevronRight className="text-slate-300 dark:text-slate-600" size={20} />
                          )}
                          {itemIdx !== section.items.length - 1 && (
                            <div className="absolute bottom-0 left-16 right-0 h-[1px] bg-slate-100 dark:bg-slate-800" />
                          )}
                        </div>
                      );
                      return ItemContent;
                    })}
                  </div>
                </motion.div>
              ))}

              {/* Logout Button */}
              {user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm mt-8"
                >
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-4 text-red-500 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors active:bg-red-100 dark:active:bg-red-900/50"
                  >
                    <LogOut size={20} />
                    Log Out
                  </button>
                </motion.div>
              )}
            </div>
      </div>
      <DeveloperPopup isOpen={isDeveloperOpen} onClose={() => setIsDeveloperOpen(false)} />
      {isScannerOpen && <QRScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />}
      {scannedStudentId && (
        <StudentPassportPopup 
          studentId={scannedStudentId} 
          onClose={() => setScannedStudentId(null)} 
        />
      )}
      {isNotificationFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md relative">
            <NotificationForm onClose={() => setIsNotificationFormOpen(false)} />
          </div>
        </div>
      )}
      <NotificationsModal isOpen={isNotificationsModalOpen} onClose={() => setIsNotificationsModalOpen(false)} />
      <BMIModal isOpen={isBMICalculatorOpen} onClose={() => setIsBMICalculatorOpen(false)} />
      <PostureScannerModal isOpen={isPostureScannerOpen} onClose={() => setIsPostureScannerOpen(false)} />
    </div>
  );
}

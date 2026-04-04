import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, NavLink, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, onAuthStateChanged, signOut, doc, getDoc, onSnapshot, getDocs, collection, query, limit, seedDatabase, getDocFromCache, getDocsFromCache } from './firebase';
import { 
  UserCircle,
  LayoutDashboard, 
  Users, 
  Activity, 
  Trophy, 
  MessageSquare, 
  HelpCircle, 
  Apple, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Search,
  Plus,
  ChevronRight,
  Heart,
  TrendingUp,
  Award,
  Brain,
  QrCode,
  Microscope,
  BookOpen,
  Calendar,
  Leaf,
  ShoppingCart,
  ShieldCheck,
  Github,
  Coffee,
  CheckCircle2
} from 'lucide-react';
import { cn } from './lib/utils';
import { HelmetProvider } from 'react-helmet-async';

// Types
import BirdToy from './components/BirdToy';
import { User } from './types';

// Auth Context
interface AuthContextType {
  user: User | null;
  login: (user: any) => void;
  logout: () => void;
  loading: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import HealthRecords from './pages/HealthRecords';
import Activities from './pages/Activities';
import Leaderboard from './pages/Leaderboard';
import Community from './pages/Community';
import Queries from './pages/Queries';
import Nutrition from './pages/Nutrition';
import AIInsights from './pages/AIInsights';
import HealthPassport from './pages/HealthPassport';
import STEMInnovation from './pages/STEMInnovation';
import BottomNav from './components/BottomNav';
import { FloatingLoginBar } from './components/FloatingLoginBar';
import Others from './pages/Others';
import HealthPass from './pages/HealthPass';
import Modules from './pages/Modules';
import AdminModules from './pages/AdminModules';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherStudents from './pages/TeacherStudents';
import TeacherHealthRecords from './pages/TeacherHealthRecords';
import TeacherActivities from './pages/TeacherActivities';
import TeacherAnalytics from './pages/TeacherAnalytics';
import TeacherAnnouncements from './pages/TeacherAnnouncements';
import TeacherQueries from './pages/TeacherQueries';
import AdminTeachers from './pages/AdminTeachers';
import AdminClassrooms from './pages/AdminClassrooms';
import AdminSports from './pages/AdminSports';
import CoachDashboard from './pages/CoachDashboard';
import CoachAttendance from './pages/CoachAttendance';
import CoachActivities from './pages/CoachActivities';
import HealthyCanteenAdmin from './pages/HealthyCanteenAdmin';
import BreakfastMarketplace from './pages/BreakfastMarketplace';
import MyBreakfastReservations from './pages/MyBreakfastReservations';
import VegetableMarketplace from './pages/VegetableMarketplace';
import MyReservations from './pages/MyReservations';
import UserManagement from './pages/UserManagement';
import PrivacySecurity from './pages/PrivacySecurity';
import IOSShortcut from './pages/IOSShortcut';
import ChangePassword from './pages/ChangePassword';
import OrganicClubAdmin from './pages/OrganicClubAdmin';
import OrganicAdminDashboard from './pages/OrganicAdminDashboard';
import BreakfastAdminDashboard from './pages/BreakfastAdminDashboard';
import AdminHealthUpdate from './pages/AdminHealthUpdate';
import StudentTracking from './pages/StudentTracking';
import AdminBadgeApplications from './pages/AdminBadgeApplications';
import AdminActivities from './pages/AdminActivities';
import AdminStudentManagement from './pages/AdminStudentManagement';
import HealthPet from './pages/HealthPet';
import BMICalculatorPage from './pages/BMICalculatorPage';
import PostureScannerPage from './pages/PostureScannerPage';
import MoodTracker from './pages/MoodTracker';
import BreathingSystem from './pages/BreathingSystem';

import Onboarding from './components/Onboarding';
import HeartLoader from './components/HeartLoader';

const SidebarItem = ({ icon: Icon, label, path, onClick }: any) => (
  <NavLink
    to={path}
    onClick={onClick}
    className={({ isActive }) => cn(
      "flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      isActive 
        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" 
        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
    )}
  >
    {({ isActive }) => (
      <>
        <Icon size={20} className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white")} />
        <span className="font-medium">{label}</span>
        {isActive && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
      </>
    )}
  </NavLink>
);

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSidebarItemClick = () => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Organic Admin Dashboard', path: '/organic-admin-dashboard', roles: ['organic-admin'] },
    { icon: LayoutDashboard, label: 'Healthy Canteen Admin', path: '/breakfast-admin-dashboard', roles: ['breakfast-admin'] },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'student'] },
    { icon: LayoutDashboard, label: 'Teacher Dashboard', path: '/teacher/dashboard', roles: ['teacher'] },
    { icon: LayoutDashboard, label: 'Coach Dashboard', path: '/coach/dashboard', roles: ['coach'] },
    { icon: Calendar, label: 'Attendance', path: '/coach/attendance', roles: ['coach'] },
    { icon: Activity, label: 'Record Activity', path: '/coach/activities', roles: ['coach'] },
    { icon: TrendingUp, label: 'My Progress', path: '/tracking', roles: ['admin', 'student'] },
    { icon: Leaf, label: 'Marketplace', path: '/marketplace', roles: ['admin', 'student', 'teacher'] },
    { icon: ShoppingCart, label: 'My Reservations', path: '/my-reservations', roles: ['admin', 'student', 'teacher'] },
    { icon: Coffee, label: 'Healthy Breakfast', path: '/breakfast', roles: ['admin', 'student', 'teacher'] },
    { icon: Coffee, label: 'My Healthy Breakfast', path: '/my-breakfast', roles: ['admin', 'student', 'teacher'] },
    { icon: ShieldCheck, label: 'Organic Admin', path: '/organic-admin', roles: ['admin'] },
    { icon: ShieldCheck, label: 'Healthy Canteen Admin', path: '/breakfast-admin', roles: ['admin'] },
    { icon: Users, label: 'User Management', path: '/admin/users', roles: ['admin'] },
    { icon: Search, label: 'Student Search & Edit', path: '/admin/student-management', roles: ['admin'] },
    { icon: UserCircle, label: 'Health Pass', path: '/health-pass', roles: ['admin', 'student', 'teacher', 'coach'] },
    { icon: Users, label: 'Students', path: '/students', roles: ['admin'] },
    { icon: Users, label: 'Teachers', path: '/admin/teachers', roles: ['admin'] },
    { icon: ShieldCheck, label: 'Badge Applications', path: '/admin/badges', roles: ['admin'] },
    { icon: Activity, label: 'Manage Activities', path: '/admin/activities', roles: ['admin'] },
    { icon: BookOpen, label: 'Classrooms', path: '/admin/classrooms', roles: ['admin'] },
    { icon: Activity, label: 'Health Update', path: '/admin/health-update', roles: ['admin'] },
    { icon: Award, label: 'Sports Management', path: '/admin/sports', roles: ['admin'] },
    { icon: Users, label: 'My Students', path: '/teacher/students', roles: ['teacher'] },
    { icon: Activity, label: 'Health Records', path: '/teacher/health-records', roles: ['teacher'] },
    { icon: Activity, label: 'Activities', path: '/activities', roles: ['admin', 'student'] },
    { icon: Activity, label: 'Activity Tracking', path: '/teacher/activities', roles: ['teacher'] },
    { icon: TrendingUp, label: 'Class Analytics', path: '/teacher/analytics', roles: ['teacher'] },
    { icon: MessageSquare, label: 'Announcements', path: '/teacher/announcements', roles: ['teacher'] },
    { icon: HelpCircle, label: 'Student Queries', path: '/teacher/queries', roles: ['teacher'] },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard', roles: ['admin', 'student'] },
    { icon: Apple, label: 'Nutrition', path: '/nutrition', roles: ['admin', 'student'] },
    { icon: Brain, label: 'AI Insights', path: '/ai-insights', roles: ['admin', 'student'] },
    { icon: QrCode, label: 'Health Passport', path: '/health-passport', roles: ['admin', 'student'] },
    { icon: MessageSquare, label: 'Community', path: '/community', roles: ['admin', 'student'] },
    { icon: HelpCircle, label: 'Queries', path: '/queries', roles: ['admin', 'student'] },
    { icon: Microscope, label: 'STEM Innovation', path: '/stem-innovation', roles: ['admin'] },
    { icon: BookOpen, label: 'Modules', path: '/modules', roles: ['admin', 'student', 'teacher'] },
    { icon: ShieldCheck, label: 'Admin Modules', path: '/admin/modules', roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role || 'student'));

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-slate-900 overflow-hidden font-sans relative pt-safe">
      {/* Global Background Gradients for Glass Effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 dark:bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/20 dark:bg-indigo-900/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-emerald-400/10 dark:bg-emerald-900/10 rounded-full blur-[100px]" />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth <= 768 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Hidden on mobile, replaced by BottomNav */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 280 : 0, 
          opacity: isSidebarOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed h-[calc(100vh-32px)] z-30 overflow-hidden m-4 rounded-3xl hidden md:block",
          "bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-2xl shadow-slate-200/20 dark:shadow-slate-900/20",
          !isSidebarOpen && "w-0 border-none p-0"
        )}
      >
        <div className="flex flex-col h-full p-6 w-[280px]">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
              <Heart className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Health Guard</h1>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Jaffna Hindu College</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto pr-2 -mr-2 thin-scrollbar">
            {filteredItems.map((item) => (
              <SidebarItem
                key={item.path}
                {...item}
                onClick={handleSidebarItemClick}
              />
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/10">
            <button
              onClick={async () => {
                await logout();
                window.location.href = '/login';
              }}
              className="flex items-center w-full gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={cn("flex-1 flex flex-col overflow-hidden transition-all duration-300", isSidebarOpen && "md:ml-[300px]")}>
        {/* Header */}
        <header className="h-16 mt-4 mx-4 bg-white/40 dark:bg-slate-800/80 backdrop-blur-2xl border border-white/60 dark:border-slate-700/60 rounded-2xl flex items-center justify-between px-4 md:px-8 flex-shrink-0 shadow-xl shadow-blue-900/5 dark:shadow-none z-10 relative">
          <div className="flex items-center gap-4 z-10">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-lg text-slate-500 dark:text-slate-400 transition-colors hidden md:block"
              aria-label="Toggle Sidebar"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search health data..." 
                className="pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-white/60 dark:border-slate-600/60 rounded-xl w-64 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm shadow-sm dark:shadow-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Left Logo */}
          <div className="flex items-center gap-3 pointer-events-none">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-700/50">
              <img 
                src="https://image2url.com/r2/default/images/1774698066689-6e63ff07-2034-4699-8e48-1fe210ec509e.jpg" 
                alt="School Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
              <Heart className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">Health Guard</span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Jaffna Hindu College</span>
            </div>
          </div>

          <div className="flex items-center gap-6 z-10">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-end gap-1">
                  {user?.fullName || 'Guest User'}
                  {user?.wellnessBadge && <span title="Wellness Badge"><CheckCircle2 size={14} className="text-emerald-500 fill-emerald-500/10" /></span>}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role || 'Public Access'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
                <img 
                  src={user?.photoUrl || `https://ui-avatars.com/api/?name=${user?.fullName || 'Guest'}&background=3b82f6&color=fff`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 md:pb-8 bg-transparent relative z-10">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <FloatingLoginBar />
    </div>
  );
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('user');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error("Failed to parse cached user:", e);
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setIsAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? firebaseUser.uid : 'null');
      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore with cache fallback
          let userDoc;
          try {
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          } catch (err: any) {
            if (err?.message?.includes('Quota exceeded') || err?.message?.includes('quota')) {
              console.warn('Quota exceeded for user profile fetch, falling back to cache');
              userDoc = await getDocFromCache(doc(db, 'users', firebaseUser.uid));
            } else {
              throw err;
            }
          }

          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            console.log('User data fetched:', userData);
            const userObj = { ...userData, id: firebaseUser.uid };
            setUser(userObj);
            localStorage.setItem('user', JSON.stringify(userObj));
          } else {
            console.warn('User document does not exist for UID:', firebaseUser.uid);
            setUser(null);
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
          localStorage.removeItem('user');
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = async () => {
    console.log("Attempting logout...");
    try {
      if (auth) {
        await signOut(auth);
        console.log("Firebase signOut successful");
      }
    } catch (error) {
      console.error("Firebase signOut error:", error);
    } finally {
      console.log("Clearing local user state");
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  useEffect(() => {
    const checkAndSeed = async () => {
      if (!db) return;
      try {
        const q = query(collection(db, 'users'), limit(1));
        let snapshot;
        try {
          snapshot = await getDocs(q);
        } catch (err: any) {
          if (err?.message?.includes('Quota exceeded') || err?.message?.includes('quota')) {
            console.warn('Quota exceeded for seeding check, skipping check');
            return; // Skip seeding check if quota is hit
          }
          throw err;
        }
        
        if (snapshot.empty) {
          console.log("Database is empty, auto-seeding...");
          await seedDatabase();
          console.log("Auto-seeding complete.");
        }
      } catch (error) {
        console.error("Error checking/seeding database:", error);
      }
    };
    
    if (isAuthReady) {
      checkAndSeed();
    }
  }, [isAuthReady]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-slate-900">
      <HeartLoader />
    </div>
  );

  // Allow public access, but guard role checks
  if (user) {
    if ((user.role === 'student' || user.role === 'teacher') && !user.passwordChanged && location.pathname !== '/change-password') {
      return <Navigate to="/change-password" />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" />;
      return <Navigate to="/dashboard" />;
    }
  } else {
    // If not logged in and trying to access a role-specific route that isn't student-facing/general
    // we might want to redirect, but the user said "Everyone can view, but everything will be locked"
    // So we allow it, and the queries will return null.
  }

  return <Layout />;
};

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/ThemeProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour default stale time
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

import { loadInitialData } from './lib/queries';
import { SyncProvider } from './components/SyncManager';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('hasSeenOnboarding') !== 'true';
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SyncProvider>
          <AuthProvider>
            {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
            <Router>
              <BirdToy />
              <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/privacy-security" element={<PrivacySecurity />} />
              <Route path="/ios-shortcut" element={<IOSShortcut />} />
              <Route path="/change-password" element={<ChangePassword />} />
              
              {/* Protected Routes with Persistent Layout */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'student']} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/nutrition" element={<Nutrition />} />
                <Route path="/community" element={<Community />} />
                <Route path="/queries" element={<Queries />} />
                <Route path="/ai-insights" element={<AIInsights />} />
                <Route path="/health-passport" element={<HealthPassport />} />
                <Route path="/health-records" element={<HealthRecords />} />
                <Route path="/tracking" element={<StudentTracking />} />
                <Route path="/others" element={<Others />} />
                <Route path="/health-pet" element={<HealthPet />} />
                <Route path="/bmi-calculator" element={<BMICalculatorPage />} />
                <Route path="/posture-scanner" element={<PostureScannerPage />} />
                <Route path="/mood-tracker" element={<MoodTracker />} />
                <Route path="/breathing-system" element={<BreathingSystem />} />
              </Route>
              
              <Route path="/health-passport/:id" element={<HealthPassport />} />

              <Route element={<ProtectedRoute allowedRoles={['admin', 'student', 'teacher']} />}>
                <Route path="/health-pass" element={<HealthPass />} />
                <Route path="/modules" element={<Modules />} />
              </Route>

              {/* Teacher Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
                <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                <Route path="/teacher/students" element={<TeacherStudents />} />
                <Route path="/teacher/health-records" element={<TeacherHealthRecords />} />
                <Route path="/teacher/activities" element={<TeacherActivities />} />
                <Route path="/teacher/analytics" element={<TeacherAnalytics />} />
                <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
                <Route path="/teacher/queries" element={<TeacherQueries />} />
              </Route>

              {/* Coach Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['coach']} />}>
                <Route path="/coach/dashboard" element={<CoachDashboard />} />
                <Route path="/coach/attendance" element={<CoachAttendance />} />
                <Route path="/coach/activities" element={<CoachActivities />} />
              </Route>

              {/* Organic Marketplace Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'student', 'teacher']} />}>
                <Route path="/marketplace" element={<VegetableMarketplace />} />
                <Route path="/my-reservations" element={<MyReservations />} />
              </Route>

              {/* Healthy Canteen Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'student', 'teacher']} />}>
                <Route path="/breakfast" element={<BreakfastMarketplace />} />
                <Route path="/my-breakfast" element={<MyBreakfastReservations />} />
              </Route>

              {/* Organic Admin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['organic-admin']} />}>
                <Route path="/organic-admin-dashboard" element={<OrganicAdminDashboard />} />
              </Route>

              {/* Healthy Canteen Admin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['breakfast-admin']} />}>
                <Route path="/breakfast-admin-dashboard" element={<HealthyCanteenAdmin />} />
              </Route>

              {/* Admin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/modules" element={<AdminModules />} />
                <Route path="/organic-admin" element={<OrganicClubAdmin />} />
                <Route path="/breakfast-admin" element={<HealthyCanteenAdmin />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/student-management" element={<AdminStudentManagement />} />
                <Route path="/students" element={<Students />} />
                <Route path="/admin/teachers" element={<AdminTeachers />} />
                <Route path="/admin/classrooms" element={<AdminClassrooms />} />
                <Route path="/admin/sports" element={<AdminSports />} />
                <Route path="/admin/badges" element={<AdminBadgeApplications />} />
                <Route path="/admin/activities" element={<AdminActivities />} />
                <Route path="/admin/health-update" element={<AdminHealthUpdate />} />
                <Route path="/stem-innovation" element={<STEMInnovation />} />
              </Route>

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </AuthProvider>
      </SyncProvider>
    </ThemeProvider>
  </QueryClientProvider>
</HelmetProvider>
  );
}

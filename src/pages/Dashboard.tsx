import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, orderBy, limit, onSnapshot } from '../firebase';
import { Skeleton } from '../components/Skeleton';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Award, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  Plus,
  Heart,
  Scale,
  Ruler,
  CheckCircle2,
  Zap,
  MessageSquare,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '../App';
import { HealthRecord, Activity as ActivityType } from '../types';
import { useQueryClient } from '@tanstack/react-query';
import { CACHE_KEYS } from '../lib/queries';

const StatCard = ({ icon: Icon, label, value, trend, trendValue, color }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={cn("p-2.5 sm:p-3 rounded-2xl", color)}>
        <Icon size={20} className="text-white sm:w-6 sm:h-6" />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold",
          trend === 'up' ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
        )}>
          {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trendValue}
        </div>
      )}
    </div>
    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-1 truncate" title={label}>{label}</p>
    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">{value}</h3>
  </motion.div>
);

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

import { useAdminDashboard, useStudentHealthRecords, useStudentActivities, useAnnouncements } from '../lib/queries';

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: adminAnalytics, isLoading: adminLoading, isRefetching: adminRefetching } = useAdminDashboard();
  const { data: studentHealthRecords, isLoading: hrLoading } = useStudentHealthRecords(user?.role === 'student' ? user?.id : '');
  const { data: studentActivities, isLoading: actLoading } = useStudentActivities(user?.role === 'student' ? user?.id : '');
  const { data: studentAnnouncements, isLoading: annLoading } = useAnnouncements(user?.role === 'student' ? user?.class || '' : '');

  const [analytics, setAnalytics] = useState<any>(null);
  const [healthHistory, setHealthHistory] = useState<HealthRecord[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no user, we still show the dashboard but with empty data
    if (!user) {
      setAnalytics(null);
      setHealthHistory([]);
      setActivities([]);
      setAnnouncements([]);
      setLoading(false);
      return;
    }

    if (user.role === 'admin') {
      if (!adminLoading && adminAnalytics) {
        setAnalytics(adminAnalytics);
        setLoading(false);
      }
    } else {
      if (!hrLoading && !actLoading && !annLoading) {
        setHealthHistory(studentHealthRecords || []);
        setActivities(studentActivities || []);
        setAnnouncements(studentAnnouncements || []);
        setLoading(false);
      }
    }
  }, [user, adminAnalytics, adminLoading, studentHealthRecords, hrLoading, studentActivities, actLoading, studentAnnouncements, annLoading]);

  if (loading) return (
    <div className="space-y-8 px-4">
      <div className="h-16 w-64 bg-slate-200 animate-pulse rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );

  if (user?.role === 'admin') {
    const COLORS = ['#3b82f6', '#6366f1', '#f59e0b', '#ef4444'];
    
    const handleRefresh = () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ADMIN_DASHBOARD });
    };

    return (
      <div className="space-y-8 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Overview</h1>
            <p className="text-slate-500 dark:text-slate-400">Real-time school health analytics</p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={adminRefetching}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={adminRefetching ? "animate-spin" : ""} />
            {adminRefetching ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={Users} 
            label="Total Students" 
            value={analytics?.totalStudents || 0} 
            color="bg-blue-500" 
          />
          <StatCard 
            icon={Activity} 
            label="Avg. BMI" 
            value={analytics?.classStats?.[0]?.avgBmi?.toFixed(1) || '0.0'} 
            trend="down" 
            trendValue="2.4%" 
            color="bg-blue-500" 
          />
          <StatCard 
            icon={Award} 
            label="Sports Participation" 
            value={analytics?.activityStats?.find((s: any) => s.type === 'sport')?.count || 0} 
            trend="up" 
            trendValue="12%" 
            color="bg-amber-500" 
          />
          <StatCard 
            icon={TrendingUp} 
            label="Health Score Avg" 
            value="84" 
            trend="up" 
            trendValue="5.2%" 
            color="bg-violet-500" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">BMI Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={analytics?.bmiStats || []}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="category"
                  >
                    {analytics?.bmiStats?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                      padding: '8px 12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-x-4 gap-y-2 mt-6">
              {analytics?.bmiStats?.map((entry: any, index: number) => (
                <div key={entry.category} className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate" title={entry.category}>
                    {entry.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Average BMI by Class</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.classStats || []} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="class" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="avgBmi" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Student Dashboard
  const latestRecord = healthHistory[0];
  const chartData = [...healthHistory].reverse().map(r => ({
    date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    bmi: r.bmi,
    weight: r.weight,
    height: r.height
  }));

  return (
    <div className="space-y-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 justify-start">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
            <Heart className="text-white" size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hello, {user?.fullName || 'Guest'}! 👋</h1>
            <p className="text-slate-500 dark:text-slate-400">Here's your health summary for today.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = '/health-pass'}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center gap-2"
          >
            View Profile
            <ChevronRight size={18} />
          </button>
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <Calendar size={18} className="text-blue-500" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Scale} 
          label="Current Weight" 
          value={`${latestRecord?.weight || 0} kg`} 
          color="bg-blue-500" 
        />
        <StatCard 
          icon={Ruler} 
          label="Current Height" 
          value={`${latestRecord?.height || 0} cm`} 
          color="bg-blue-500" 
        />
        <StatCard 
          icon={Activity} 
          label="Latest BMI" 
          value={latestRecord?.bmi?.toFixed(1) || '0.0'} 
          trend={latestRecord?.category === 'Normal' ? 'up' : 'down'} 
          trendValue={latestRecord?.category || 'N/A'} 
          color="bg-amber-500" 
        />
        <StatCard 
          icon={Award} 
          label="Health Points" 
          value={user?.points || 0} 
          color="bg-violet-500" 
        />
      </div>

      {/* Gamification Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-3xl text-white shadow-lg">
          <p className="text-blue-100 text-sm font-bold uppercase">Current Level</p>
          <h2 className="text-3xl font-bold mt-1">Level {Math.floor((user?.points || 0) / 100) + 1}</h2>
          <p className="text-blue-100 text-sm mt-2">{100 - ((user?.points || 0) % 100)} points to next level</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase">Daily Streak</p>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">5 Days</h2>
          </div>
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-500 dark:text-orange-400">
            <Zap size={32} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase mb-4">Badges</p>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-bold">🥇</div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">🏃</div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold">🍎</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">BMI Trend</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">Weight</button>
                <button className="px-3 py-1 text-xs font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">Height</button>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-700" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#f1f5f9' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bmi" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent Activities</h3>
            <div className="space-y-4">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                      <Activity className="text-blue-500" size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{activity.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-600 dark:text-blue-400 font-bold">+{activity.points} pts</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{activity.type}</p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-slate-400 dark:text-slate-500">No activities recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Announcements */}
          {announcements.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-blue-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Class Announcements</h3>
              </div>
              <div className="space-y-3">
                {announcements.slice(0, 3).map((announcement, i) => (
                  <div key={i} className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-50 dark:border-blue-800">
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{announcement.title}</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 line-clamp-2">{announcement.content}</p>
                    <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-2 font-medium">From: {announcement.teacherName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-200">
            <h3 className="text-xl font-bold mb-2">Health Tip</h3>
            <p className="text-blue-100 text-sm mb-6">
              Drinking 8 glasses of water daily helps maintain energy levels.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Health Goals</h3>
            <div className="space-y-6">
              {[
                { label: 'Daily Steps', current: 6500, target: 10000, color: 'bg-blue-500' },
                { label: 'Water Intake', current: 5, target: 8, color: 'bg-blue-500' },
                { label: 'Sleep Hours', current: 7, target: 8, color: 'bg-amber-500' },
              ].map((goal) => (
                <div key={goal.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{goal.label}</span>
                    <span className="text-slate-500 dark:text-slate-400">{goal.current}/{goal.target}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(goal.current / goal.target) * 100}%` }}
                      className={cn("h-full rounded-full", goal.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

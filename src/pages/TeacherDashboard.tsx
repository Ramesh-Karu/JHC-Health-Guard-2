import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Activity, QrCode, BookOpen, MessageSquare, Calendar } from 'lucide-react';
import { useAuth } from '../App';
import QRScanner from '../components/QRScanner';
import { useTeacherDashboard, useSchoolSummary } from '../lib/queries';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function TeacherDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isAssigned = !!user?.class && !!user?.division;
  const { data: teacherStats, isLoading: teacherLoading } = useTeacherDashboard(user?.class || '', user?.division || '');
  const { data: schoolStats, isLoading: schoolLoading } = useSchoolSummary();
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  if (authLoading) return <div className="p-8">Loading...</div>;
  if (!user) return <div className="p-8">Please log in to view the dashboard.</div>;

  const loading = isAssigned ? teacherLoading : schoolLoading;
  const stats = isAssigned ? teacherStats : schoolStats;

  if (loading) return <div className="p-8">Loading...</div>;

  const totalStudents = stats?.totalStudents || 0;
  const bmiStats = stats?.bmiStats || [];
  const activityStats = stats?.activityStats || [];

  const overweightObese = bmiStats
    .filter((s: any) => s.category === 'Overweight' || s.category === 'Obese')
    .reduce((acc: number, curr: any) => acc + curr.count, 0);

  const totalActivities = activityStats.reduce((acc: number, curr: any) => acc + curr.count, 0);

  const bmiData = bmiStats.map((s: any) => ({ name: s.category, value: s.count }));
  const activityData = activityStats.map((s: any) => ({ name: s.type, value: s.count }));
  
  const BMI_COLORS: Record<string, string> = {
    'Underweight': '#60a5fa',
    'Normal': '#10b981',
    'Overweight': '#fbbf24',
    'Obese': '#f87171',
    'N/A': '#94a3b8'
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-sm border border-slate-700">
          <p className="font-bold opacity-70 mb-1 uppercase tracking-wider text-[10px]">{payload[0].name}</p>
          <p className="text-xl font-black">{payload[0].value} <span className="text-[10px] opacity-50">Students</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <motion.div initial={{ x: -20 }} animate={{ x: 0 }}>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Hello, {user?.fullName || 'Teacher'}!</h1>
          <p className="text-slate-500 mt-2 text-lg">{isAssigned ? `Overview for ${user?.class}` : 'School-Wide Summary'}</p>
        </motion.div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsScannerOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-200"
        >
          <QrCode size={20} />
          Scan Passbook
        </motion.button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: 'Students', path: '/teacher/students' },
          { icon: Activity, label: 'Health', path: '/teacher/health-records' },
          { icon: MessageSquare, label: 'Announce', path: '/teacher/announcements' },
          { icon: Calendar, label: 'Activities', path: '/teacher/activities' },
        ].map((action, i) => (
          <motion.button
            key={i}
            whileHover={{ y: -5 }}
            onClick={() => navigate(action.path)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:border-blue-200 transition-colors"
          >
            <action.icon className="text-blue-500" size={24} />
            <span className="font-bold text-slate-700 text-sm">{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: totalStudents, color: 'text-slate-900' },
          { label: 'Health Alerts', value: overweightObese, color: 'text-red-600' },
          { label: 'Activities', value: totalActivities, color: 'text-emerald-600' },
          { label: 'Engagement', value: `${totalStudents > 0 ? Math.round((totalActivities / totalStudents) * 100) : 0}%`, color: 'text-purple-600' },
        ].map((stat, i) => (
          <motion.div key={i} whileHover={{ scale: 1.02 }} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
            <h3 className={`text-3xl font-bold ${stat.color}`}>{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">BMI Distribution</h3>
          <div className="h-64 relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-900">{totalStudents}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={bmiData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={70} 
                  outerRadius={90} 
                  paddingAngle={8}
                  cornerRadius={10}
                  stroke="none"
                >
                  {bmiData.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={BMI_COLORS[entry.name] || '#94a3b8'} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-xs font-bold text-slate-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Activity Types</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {isScannerOpen && <QRScanner onClose={() => setIsScannerOpen(false)} />}
    </motion.div>
  );
}

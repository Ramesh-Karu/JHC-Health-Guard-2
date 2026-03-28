import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs } from '../firebase';
import { TrendingUp, Activity, Users } from 'lucide-react';
import { useAuth } from '../App';
import { useTeacherDashboard } from '../lib/queries';

export default function TeacherAnalytics() {
  const { user } = useAuth();
  const { data: teacherStats, isLoading: teacherLoading } = useTeacherDashboard(user?.class || '', user?.division || '');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    if (!teacherLoading && teacherStats) {
      setStats(teacherStats);
      setLoading(false);
    }
  }, [user, teacherStats, teacherLoading]);

  if (loading) return <div className="p-8">Loading...</div>;

  const totalStudents = stats?.totalStudents || 0;
  const bmiStats = stats?.bmiStats || [];
  const activityStats = stats?.activityStats || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Class Analytics</h1>
        <p className="text-slate-500 mt-1">Detailed health performance for {user?.class}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-blue-500" size={24} />
            <h3 className="text-xl font-bold text-slate-900">BMI Distribution</h3>
          </div>
          <div className="space-y-6">
            {bmiStats.map((stat: any) => (
              <div key={stat.category}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700 text-base">{stat.category}</span>
                  <span className="text-slate-500 font-medium">{stat.count} students ({Math.round((stat.count / totalStudents) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full ${
                      stat.category === 'Normal' ? 'bg-emerald-500' : 
                      stat.category === 'Underweight' ? 'bg-blue-400' : 
                      stat.category === 'Overweight' ? 'bg-orange-400' : 'bg-red-500'
                    }`} 
                    style={{ width: `${(stat.count / totalStudents) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {bmiStats.length === 0 && <p className="text-slate-500">No BMI data available.</p>}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-indigo-500" size={24} />
            <h3 className="text-xl font-bold text-slate-900">Activity Participation</h3>
          </div>
          <div className="space-y-6">
            {activityStats.map((stat: any) => (
              <div key={stat.type}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700 text-base capitalize">{stat.type}</span>
                  <span className="text-slate-500 font-medium">{stat.count} sessions</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4">
                  <div 
                    className="h-4 rounded-full bg-indigo-500" 
                    style={{ width: `${(stat.count / activityStats.reduce((acc: number, curr: any) => acc + curr.count, 0)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {activityStats.length === 0 && <p className="text-slate-500">No activities logged yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Activity, Star, Users } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function LeaderboardDetailModal({ entry, onClose, type, classLeaderboard }: { entry: any; onClose: () => void, type: 'student' | 'class', classLeaderboard?: any[] }) {
  if (!entry) return null;

  const classAvg = type === 'student' && classLeaderboard ? classLeaderboard.find(c => c.className === entry.class) : null;

  const comparisonData = type === 'student' && classAvg ? [
    { name: 'You', points: entry.points },
    { name: 'Class Avg', points: classAvg.avgPoints },
  ] : [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {type === 'student' ? entry.name : `${entry.className} - ${entry.division}`}
              </h2>
              <p className="text-slate-500 font-medium">
                {type === 'student' ? entry.class : `${entry.studentCount} Students`}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {type === 'student' ? (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl">
                  <div className="text-blue-500 mb-2"><Star size={20} /></div>
                  <p className="text-sm text-slate-500 font-bold uppercase">Points</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{entry.points}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl">
                  <div className="text-emerald-500 mb-2"><Activity size={20} /></div>
                  <p className="text-sm text-slate-500 font-bold uppercase">Status</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{entry.wellnessBadge ? 'Well' : 'Standard'}</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl">
                  <div className="text-indigo-500 mb-2"><Star size={20} /></div>
                  <p className="text-sm text-slate-500 font-bold uppercase">Avg Points</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{entry.avgPoints}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl">
                  <div className="text-blue-500 mb-2"><Users size={20} /></div>
                  <p className="text-sm text-slate-500 font-bold uppercase">Participants</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{entry.studentCount}</p>
                </div>
              </>
            )}
          </div>

          {comparisonData.length > 0 && (
            <div className="h-64 mt-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Performance Comparison</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#334155', color: '#f1f5f9' }}
                  />
                  <Bar 
                    dataKey="points" 
                    fill="#3b82f6" 
                    radius={[10, 10, 0, 0]} 
                    barSize={40} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

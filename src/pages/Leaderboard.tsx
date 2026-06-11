import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Trophy, Medal, Star, ShieldCheck, CheckCircle2, RefreshCw, Users, BookOpen } from 'lucide-react';
import { useAuth } from '../App';
import { useLeaderboard, useClassLeaderboard, CACHE_KEYS } from '../lib/queries';
import { Skeleton } from '../components/Skeleton';
import { useQueryClient } from '@tanstack/react-query';

export default function Leaderboard() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'students' | 'classes'>('students');
  
  const { data: leaderboard = [], isLoading: loading } = useLeaderboard();
  const { data: classLeaderboard = [], isLoading: classLoading } = useClassLeaderboard();
  
  const [filter, setFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (viewMode === 'students') {
      await queryClient.invalidateQueries({ queryKey: CACHE_KEYS.LEADERBOARD });
    } else {
      await queryClient.invalidateQueries({ queryKey: ['class-leaderboard'] });
    }
    setIsRefreshing(false);
  };

  const currentLoading = viewMode === 'students' ? loading : classLoading;

  const filteredData = filter === 'All' 
    ? leaderboard 
    : leaderboard.filter(s => s.class === filter);

  const classes = ['All', ...Array.from(new Set(leaderboard.map(s => s.class).filter(Boolean)))];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="text-amber-400" size={24} />;
    if (rank === 2) return <Medal className="text-slate-400" size={24} />;
    if (rank === 3) return <Medal className="text-amber-700" size={24} />;
    return <span className="text-slate-400 font-bold text-sm">#{rank}</span>;
  };

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
      <Helmet>
        <title>Leaderboard | JHC Health Guard</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">School Leaderboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Celebrating our healthiest {viewMode === 'students' ? 'students' : 'classes'}</p>
        </div>
        
        {/* Toggle Slider */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl md:mx-auto">
          <button
            onClick={() => setViewMode('students')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              viewMode === 'students' 
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <Users size={16} /> Students
          </button>
          <button
            onClick={() => setViewMode('classes')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              viewMode === 'classes' 
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <BookOpen size={16} /> Classes
          </button>
        </div>

        <div className="flex items-center gap-2 justify-end">
          {currentUser?.role === 'admin' && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
              title="Refresh Leaderboard"
            >
              <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          )}
          {viewMode === 'students' && (
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      </div>

      {currentLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      ) : (viewMode === 'students' ? leaderboard.length === 0 : classLeaderboard.length === 0) ? (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="text-slate-200 dark:text-slate-600" size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {!currentUser ? 'Login to View Rankings' : 'No Rankings Yet'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {!currentUser 
              ? 'Please log in to see the school leaderboard and your current rank.' 
              : `Check back later when there are ${viewMode === 'students' ? 'students' : 'classes'} on the leaderboard!`}
          </p>
          {!currentUser && (
            <button 
              onClick={() => window.location.href = '/login'}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
            >
              Login Now
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pb-10"
            key={viewMode}
          >
            {/* 2nd Place */}
            {(viewMode === 'students' ? filteredData[1] : classLeaderboard[1]) && (
              <motion.div 
                initial={{ opacity: 0, rotateX: -20, y: 50 }}
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                transition={{ duration: 0.8, type: "spring", delay: 0.1 }}
                whileHover={{ 
                  y: -10, 
                  rotateX: 5, 
                  rotateY: 5, 
                  scale: 1.05,
                  transition: { duration: 0.2 } 
                }}
                style={{ perspective: 1000 }}
                className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-center relative order-2 md:order-1"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-md">
                  <Medal className="text-slate-400" size={24} />
                </div>
                {viewMode === 'students' ? (
                  <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-4 border-4 border-white dark:border-slate-900 shadow-lg overflow-hidden relative">
                    <img src={filteredData[1].avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-4 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center relative">
                    <Users size={32} className="text-slate-400" />
                  </div>
                )}
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                  {viewMode === 'students' ? filteredData[1].name : `${classLeaderboard[1].className} - ${classLeaderboard[1].division}`}
                  {viewMode === 'students' && filteredData[1].wellnessBadge && (
                    <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-500/10" />
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 text-center">
                  {viewMode === 'students' ? filteredData[1].class : `${classLeaderboard[1].studentCount} Students`}
                </p>
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-sm font-bold">
                  <Star size={14} className="fill-slate-400 text-slate-400" />
                  {viewMode === 'students' ? filteredData[1].points : `${classLeaderboard[1].avgPoints} Avg Pts`}
                </div>
              </motion.div>
            )}

            {/* 1st Place */}
            {(viewMode === 'students' ? filteredData[0] : classLeaderboard[0]) && (
              <motion.div 
                initial={{ opacity: 0, rotateX: -20, y: 50 }}
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                transition={{ duration: 0.8, type: "spring", delay: 0.2 }}
                whileHover={{ 
                  y: -10, 
                  rotateX: 5, 
                  rotateY: 5, 
                  scale: 1.05,
                  transition: { duration: 0.2 } 
                }}
                style={{ perspective: 1000 }}
                className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border-2 border-blue-100 dark:border-blue-900 shadow-xl shadow-blue-100/50 dark:shadow-none text-center relative z-10 order-1 md:order-2"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-lg">
                  <Trophy className="text-white" size={32} />
                </div>
                {viewMode === 'students' ? (
                  <div className="w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900/30 mx-auto mb-6 border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden relative">
                    <img src={filteredData[0].avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900/30 mx-auto mb-6 border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center relative">
                    <Users size={40} className="text-blue-500" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                  {viewMode === 'students' ? filteredData[0].name : `${classLeaderboard[0].className} - ${classLeaderboard[0].division}`}
                  {viewMode === 'students' && filteredData[0].wellnessBadge && (
                    <CheckCircle2 size={20} className="text-emerald-500 fill-emerald-500/10" />
                  )}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center">
                  {viewMode === 'students' ? filteredData[0].class : `${classLeaderboard[0].studentCount} Students`}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full text-lg font-bold shadow-lg shadow-blue-200 dark:shadow-none">
                  <Star size={20} className="fill-white" />
                  {viewMode === 'students' ? filteredData[0].points : `${classLeaderboard[0].avgPoints} Avg Pts`}
                </div>
              </motion.div>
            )}

            {/* 3rd Place */}
            {(viewMode === 'students' ? filteredData[2] : classLeaderboard[2]) && (
              <motion.div 
                initial={{ opacity: 0, rotateX: -20, y: 50 }}
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                transition={{ duration: 0.8, type: "spring", delay: 0.3 }}
                whileHover={{ 
                  y: -10, 
                  rotateX: 5, 
                  rotateY: 5, 
                  scale: 1.05,
                  transition: { duration: 0.2 } 
                }}
                style={{ perspective: 1000 }}
                className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-center relative order-3"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-md">
                  <Medal className="text-amber-700 dark:text-amber-500" size={24} />
                </div>
                {viewMode === 'students' ? (
                  <div className="w-24 h-24 rounded-full bg-amber-50 dark:bg-amber-900/20 mx-auto mb-4 border-4 border-white dark:border-slate-900 shadow-lg overflow-hidden relative">
                    <img src={filteredData[2].avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-amber-50 dark:bg-amber-900/20 mx-auto mb-4 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center relative">
                    <Users size={32} className="text-amber-700 dark:text-amber-500" />
                  </div>
                )}
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                  {viewMode === 'students' ? filteredData[2].name : `${classLeaderboard[2].className} - ${classLeaderboard[2].division}`}
                  {viewMode === 'students' && filteredData[2].wellnessBadge && (
                    <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-500/10" />
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 text-center">
                  {viewMode === 'students' ? filteredData[2].class : `${classLeaderboard[2].studentCount} Students`}
                </p>
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 rounded-full text-sm font-bold">
                  <Star size={14} className="fill-amber-600 dark:fill-amber-500 text-amber-600 dark:text-amber-500" />
                  {viewMode === 'students' ? filteredData[2].points : `${classLeaderboard[2].avgPoints} Avg Pts`}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Full List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
            key={`${viewMode}-list`}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white">Rankings</h3>
            </div>
            
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {viewMode === 'students' ? (
                // Students List
                filteredData.slice(3).map((student: any, index: number) => (
                  <div 
                    key={student.id} 
                    className={cn(
                      "flex items-center justify-between p-6 transition-colors",
                      student.id === currentUser?.id ? "bg-blue-50/50 dark:bg-blue-900/20" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-8 text-center">{getRankIcon(index + 4)}</div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                          <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            {student.name} 
                            {student.wellnessBadge && (
                              <CheckCircle2 size={14} className="text-emerald-500 fill-emerald-500/10" />
                            )}
                            {student.id === currentUser?.id && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full ml-1">YOU</span>}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{student.class}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">{student.points}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Points</p>
                    </div>
                  </div>
                ))
              ) : (
                // Classes List
                classLeaderboard.slice(3).map((cls: any, index: number) => (
                  <div 
                    key={cls.id} 
                    className="flex items-center justify-between p-6 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-8 text-center">{getRankIcon(index + 4)}</div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <BookOpen size={20} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            {cls.className} - {cls.division}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{cls.studentCount} Students</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">{cls.avgPoints}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Pts</p>
                    </div>
                  </div>
                ))
              )}
              
              {(viewMode === 'students' ? filteredData.length : classLeaderboard.length) <= 3 && (
                <div className="p-10 text-center text-slate-400">No more rankings to display.</div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

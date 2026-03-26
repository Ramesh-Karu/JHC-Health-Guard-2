import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, orderBy, getDocs, getDoc, setDoc, doc } from '../firebase';
import { Trophy, Medal, Award, Star, ChevronRight, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../App';

export default function Leaderboard() {
  const { user: currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [filter, setFilter] = useState('All');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLeaderboard = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const leaderboardDoc = await getDoc(doc(db, 'system', 'leaderboard'));
        const now = new Date().getTime();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
        
        if (leaderboardDoc.exists()) {
          const data = leaderboardDoc.data();
          const updatedAt = data.updatedAt?.toDate() || new Date(0);
          const lastUpdatedTime = updatedAt.getTime();
          
          // If less than 7 days old and has users, use cached
          if (data.users && data.users.length > 0 && now - lastUpdatedTime < SEVEN_DAYS) {
            setLeaderboard(data.users);
            setLastUpdated(updatedAt);
            setLoading(false);
            return;
          }
        }
      }
      
      // Fetch all students and sort in memory
      // We only fetch students who have at least 1 point to reduce data load
      const q = query(
        collection(db, 'users'), 
        where('role', '==', 'student'),
        where('points', '>', 0)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
      
      // Update cache
      const updateTime = new Date();
      await setDoc(doc(db, 'system', 'leaderboard'), {
        users: data,
        updatedAt: updateTime
      });
      
      setLeaderboard(data);
      setLastUpdated(updateTime);
      setLoading(false);
      setRecalculating(false);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
      handleFirestoreError(err, OperationType.GET, 'system/leaderboard');
      setLoading(false);
      setRecalculating(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    await fetchLeaderboard(true);
  };

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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">School Leaderboard</h1>
          <p className="text-slate-500">Celebrating our healthiest students</p>
          {lastUpdated && (
            <div className="flex items-center gap-4 mt-1">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Last updated: {lastUpdated.toLocaleDateString()} {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="text-[10px] text-blue-600 font-bold uppercase tracking-wider hover:text-blue-800 disabled:text-slate-400"
              >
                {recalculating ? 'Recalculating...' : 'Recalculate Now'}
              </button>
            </div>
          )}
        </div>
        {!loading && leaderboard.length > 0 && (
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
            {classes.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  filter === c ? "bg-blue-500 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Loading rankings...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="text-slate-200" size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Rankings Yet</h3>
          <p className="text-slate-500 max-w-xs mx-auto">Start participating in activities to earn points and appear on the leaderboard!</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pb-10">
        {/* 2nd Place */}
        {filteredData[1] && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center relative order-2 md:order-1"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-md">
              <Medal className="text-slate-400" size={24} />
            </div>
            <div className="w-24 h-24 rounded-full bg-slate-200 mx-auto mb-4 border-4 border-white shadow-lg overflow-hidden relative">
              <img src={filteredData[1].photoUrl || `https://ui-avatars.com/api/?name=${filteredData[1].fullName}&background=94a3b8&color=fff`} alt="" className="w-full h-full object-cover" />
            </div>
            <h3 className="font-bold text-slate-900 flex items-center justify-center gap-1">
              {filteredData[1].fullName}
              {filteredData[1].wellnessBadge && <span title="Wellness Badge"><ShieldCheck size={16} className="text-emerald-500 fill-emerald-100" /></span>}
            </h3>
            <p className="text-xs text-slate-500 mb-3">{filteredData[1].class}</p>
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-sm font-bold">
              <Star size={14} className="fill-slate-400 text-slate-400" />
              {filteredData[1].points} pts
            </div>
          </motion.div>
        )}

        {/* 1st Place */}
        {filteredData[0] && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white p-10 rounded-[40px] border-2 border-blue-100 shadow-xl shadow-blue-100/50 text-center relative z-10 order-1 md:order-2"
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
              <Trophy className="text-white" size={32} />
            </div>
            <div className="w-32 h-32 rounded-full bg-blue-100 mx-auto mb-6 border-4 border-white shadow-xl overflow-hidden relative">
              <img src={filteredData[0].photoUrl || `https://ui-avatars.com/api/?name=${filteredData[0].fullName}&background=3b82f6&color=fff`} alt="" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-1">
              {filteredData[0].fullName}
              {filteredData[0].wellnessBadge && <span title="Wellness Badge"><ShieldCheck size={20} className="text-emerald-500 fill-emerald-100" /></span>}
            </h3>
            <p className="text-sm text-slate-500 mb-4">{filteredData[0].class}</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full text-lg font-bold shadow-lg shadow-blue-200">
              <Star size={20} className="fill-white" />
              {filteredData[0].points} pts
            </div>
          </motion.div>
        )}

        {/* 3rd Place */}
        {filteredData[2] && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center relative order-3"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center border-4 border-white shadow-md">
              <Medal className="text-amber-700" size={24} />
            </div>
            <div className="w-24 h-24 rounded-full bg-amber-50 mx-auto mb-4 border-4 border-white shadow-lg overflow-hidden relative">
              <img src={filteredData[2].photoUrl || `https://ui-avatars.com/api/?name=${filteredData[2].fullName}&background=b45309&color=fff`} alt="" className="w-full h-full object-cover" />
            </div>
            <h3 className="font-bold text-slate-900 flex items-center justify-center gap-1">
              {filteredData[2].fullName}
              {filteredData[2].wellnessBadge && <span title="Wellness Badge"><ShieldCheck size={16} className="text-emerald-500 fill-emerald-100" /></span>}
            </h3>
            <p className="text-xs text-slate-500 mb-3">{filteredData[2].class}</p>
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-bold">
              <Star size={14} className="fill-amber-600 text-amber-600" />
              {filteredData[2].points} pts
            </div>
          </motion.div>
        )}
      </div>

      {/* Full List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Rankings</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {filteredData.slice(3).map((student, index) => (
            <div 
              key={student.id} 
              className={cn(
                "flex items-center justify-between p-6 transition-colors",
                student.id === currentUser?.id ? "bg-blue-50/50" : "hover:bg-slate-50/50"
              )}
            >
              <div className="flex items-center gap-6">
                <div className="w-8 text-center">{getRankIcon(index + 4)}</div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden relative">
                    <img src={student.photoUrl || `https://ui-avatars.com/api/?name=${student.fullName}&background=3b82f6&color=fff`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      {student.fullName} 
                      {student.wellnessBadge && <span title="Wellness Badge"><ShieldCheck size={14} className="text-emerald-500 fill-emerald-100" /></span>}
                      {student.id === currentUser?.id && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full ml-1">YOU</span>}
                    </p>
                    <p className="text-xs text-slate-500">{student.class}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">{student.points}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Points</p>
              </div>
            </div>
          ))}
          {filteredData.length <= 3 && (
            <div className="p-10 text-center text-slate-400">No more rankings to display.</div>
          )}
        </div>
      </div>
    </>
  )}
</div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

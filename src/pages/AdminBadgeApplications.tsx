import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, query, getDocs, doc, updateDoc, setDoc, getDoc, where } from '../firebase';
import { ShieldCheck, Check, X, Search, Settings, User as UserIcon, Award, Zap } from 'lucide-react';
import { User } from '../types';
import { motion } from 'motion/react';

export default function AdminBadgeApplications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [requiredPoints, setRequiredPoints] = useState(1000);
  const [pointsPerSport, setPointsPerSport] = useState(20);
  const [pointsPerExercise, setPointsPerExercise] = useState(10);
  const [pointsPerHabit, setPointsPerHabit] = useState(5);
  const [pointsPerNormalBMI, setPointsPerNormalBMI] = useState(50);
  const [pointsPerGoodStrength, setPointsPerGoodStrength] = useState(50);
  const [savingSettings, setSavingSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'applications' | 'quick-upgrade'>('applications');
  const [quickIndexNumber, setQuickIndexNumber] = useState('');
  const [quickStudent, setQuickStudent] = useState<User | null>(null);
  const [searchingQuick, setSearchingQuick] = useState(false);
  const [upgradingQuick, setUpgradingQuick] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch Settings
      const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        if (data.requiredBadgePoints) setRequiredPoints(data.requiredBadgePoints);
        if (data.pointsPerSport) setPointsPerSport(data.pointsPerSport);
        if (data.pointsPerExercise) setPointsPerExercise(data.pointsPerExercise);
        if (data.pointsPerHabit) setPointsPerHabit(data.pointsPerHabit);
        if (data.pointsPerNormalBMI) setPointsPerNormalBMI(data.pointsPerNormalBMI);
        if (data.pointsPerGoodStrength) setPointsPerGoodStrength(data.pointsPerGoodStrength);
      }

      // Fetch Applications
      const q = query(collection(db, 'badge_applications'));
      const snapshot = await getDocs(q);
      setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'badge_applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuickSearch = async () => {
    if (!quickIndexNumber.trim()) return;
    setSearchingQuick(true);
    setQuickStudent(null);
    try {
      const q = query(collection(db, 'users'), where('indexNumber', '==', quickIndexNumber.trim()));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setQuickStudent({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as User);
      } else {
        alert('Student not found with this index number.');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'users');
    } finally {
      setSearchingQuick(false);
    }
  };

  const handleQuickBadgeUpdate = async (upgrade: boolean) => {
    if (!quickStudent) return;
    setUpgradingQuick(true);
    try {
      await updateDoc(doc(db, 'users', quickStudent.id), {
        wellnessBadge: upgrade,
        badgeStatus: upgrade ? 'approved' : 'none'
      });
      
      // Also update application if it exists
      const appQ = query(collection(db, 'badge_applications'), where('userId', '==', quickStudent.id));
      const appSnap = await getDocs(appQ);
      if (!appSnap.empty) {
        await updateDoc(doc(db, 'badge_applications', appSnap.docs[0].id), {
          status: upgrade ? 'approved' : 'rejected'
        });
      }

      setQuickStudent(prev => prev ? { ...prev, wellnessBadge: upgrade, badgeStatus: upgrade ? 'approved' : 'none' } : null);
      alert(`Student ${upgrade ? 'upgraded' : 'degraded'} successfully!`);
      fetchData(); // Refresh applications list
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    } finally {
      setUpgradingQuick(false);
    }
  };

  const handleUpdateStatus = async (appId: string, userId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'badge_applications', appId), { status });
      await updateDoc(doc(db, 'users', userId), { 
        badgeStatus: status,
        wellnessBadge: status === 'approved'
      });
      
      // Update local state
      setApplications(apps => apps.map(app => 
        app.id === appId ? { ...app, status } : app
      ));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'badge_applications');
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        requiredBadgePoints: requiredPoints,
        pointsPerSport,
        pointsPerExercise,
        pointsPerHabit,
        pointsPerNormalBMI,
        pointsPerGoodStrength
      }, { merge: true });
      alert('Settings saved successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredApps = applications.filter(app => 
    app.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingApps = filteredApps.filter(app => app.status === 'pending');
  const processedApps = filteredApps.filter(app => app.status !== 'pending');

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
        <div className="w-full lg:max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Wellness Badge Portal</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage student applications and quick upgrades.</p>
          
          <div className="flex gap-2 mt-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'applications'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Applications
            </button>
            <button
              onClick={() => setActiveTab('quick-upgrade')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'quick-upgrade'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Quick Upgrade
            </button>
          </div>
        </div>
        
        <div className="w-full lg:flex-1 bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <Settings size={20} className="text-blue-500" />
            <span className="text-base font-bold text-slate-800 dark:text-slate-200">Points Configuration</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[
              { label: 'Badge Requirement', value: requiredPoints, setter: setRequiredPoints },
              { label: 'Per Sport', value: pointsPerSport, setter: setPointsPerSport },
              { label: 'Per Exercise', value: pointsPerExercise, setter: setPointsPerExercise },
              { label: 'Per Healthy Habit', value: pointsPerHabit, setter: setPointsPerHabit },
              { label: 'Normal BMI', value: pointsPerNormalBMI, setter: setPointsPerNormalBMI },
              { label: 'Good Strength', value: pointsPerGoodStrength, setter: setPointsPerGoodStrength },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{item.label}</span>
                <input 
                  type="number" 
                  value={item.value}
                  onChange={(e) => item.setter(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                />
              </div>
            ))}
          </div>

          <button 
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="w-full mt-6 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-[0.98]"
          >
            {savingSettings ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {activeTab === 'applications' ? (
        <>
          {/* Pending Applications */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-500">
                  <ShieldCheck size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pending Applications</h2>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by student name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="p-4 font-semibold">Student</th>
                    <th className="p-4 font-semibold">Points</th>
                    <th className="p-4 font-semibold">BMI</th>
                    <th className="p-4 font-semibold">Applied Date</th>
                    <th className="p-4 font-semibold">Pledge</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {pendingApps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                        No pending applications found.
                      </td>
                    </tr>
                  ) : (
                    pendingApps.map(app => (
                      <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                              <img src={app.userPhoto || `https://ui-avatars.com/api/?name=${app.userName}&background=3b82f6&color=fff`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">{app.userName}</span>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{app.points}</td>
                        <td className="p-4 font-medium text-slate-700 dark:text-slate-300">{app.bmi}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">{new Date(app.appliedAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          <div className="max-w-xs text-xs text-slate-500 dark:text-slate-400 italic truncate" title={app.pledge}>
                            "{app.pledge}"
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleUpdateStatus(app.id, app.userId, 'approved')}
                              className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-all active:scale-95"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(app.id, app.userId, 'rejected')}
                              className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-all active:scale-95"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {pendingApps.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium">
                  No pending applications found.
                </div>
              ) : (
                pendingApps.map(app => (
                  <div key={app.id} className="p-5 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={app.userPhoto || `https://ui-avatars.com/api/?name=${app.userName}&background=3b82f6&color=fff`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white">{app.userName}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(app.appliedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400 leading-none">{app.points}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Points</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">BMI</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{app.bmi}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                        <p className="text-sm font-bold text-amber-600 dark:text-amber-500">Pending</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pledge</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2">"{app.pledge}"</p>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleUpdateStatus(app.id, app.userId, 'approved')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 dark:shadow-none active:scale-[0.98]"
                      >
                        <Check size={18} />
                        Approve
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(app.id, app.userId, 'rejected')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold border border-red-100 dark:border-red-900/50 rounded-2xl active:scale-[0.98]"
                      >
                        <X size={18} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Processed Applications */}
          {processedApps.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Processed Applications</h2>
              </div>
              
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="p-4 font-semibold">Student</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold">Applied Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {processedApps.map(app => (
                      <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{app.userName}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            app.status === 'approved' 
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">{new Date(app.appliedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {processedApps.map(app => (
                  <div key={app.id} className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{app.userName}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(app.appliedAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      app.status === 'approved' 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-8">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                <Zap size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quick Badge Upgrade</h2>
              <p className="text-slate-500 dark:text-slate-400">Instantly upgrade or degrade a student's wellness badge status by their index number.</p>
            </div>

            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Enter Student Index Number..."
                  value={quickIndexNumber}
                  onChange={(e) => setQuickIndexNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickSearch()}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold dark:text-white"
                />
              </div>
              <button
                onClick={handleQuickSearch}
                disabled={searchingQuick || !quickIndexNumber.trim()}
                className="px-8 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
              >
                {searchingQuick ? 'Searching...' : 'Search'}
              </button>
            </div>

            {quickStudent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img
                      src={quickStudent.photoUrl || `https://ui-avatars.com/api/?name=${quickStudent.fullName}&background=3b82f6&color=fff`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{quickStudent.fullName}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{quickStudent.class} - {quickStudent.division}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        quickStudent.wellnessBadge 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {quickStudent.wellnessBadge ? 'Has Badge' : 'No Badge'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400 leading-none">{quickStudent.points || 0}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Points</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => handleQuickBadgeUpdate(true)}
                    disabled={upgradingQuick || quickStudent.wellnessBadge}
                    className="flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 dark:shadow-none hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    <ShieldCheck size={20} />
                    Upgrade to Wellness Badge
                  </button>
                  <button
                    onClick={() => handleQuickBadgeUpdate(false)}
                    disabled={upgradingQuick || !quickStudent.wellnessBadge}
                    className="flex items-center justify-center gap-2 py-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold border border-red-100 dark:border-red-900/50 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    <X size={20} />
                    Degrade Badge
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

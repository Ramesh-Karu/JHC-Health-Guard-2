import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, query, getDocs, doc, updateDoc, setDoc, getDoc } from '../firebase';
import { ShieldCheck, Check, X, Search, Settings } from 'lucide-react';

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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Wellness Badge Portal</h1>
          <p className="text-slate-500 mt-1">Manage student applications for the Wellness Badge.</p>
        </div>
        
        <div className="w-full lg:flex-1 bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Settings size={20} className="text-blue-500" />
            <span className="text-base font-bold text-slate-800">Points Configuration</span>
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
              <div key={item.label} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</span>
                <input 
                  type="number" 
                  value={item.value}
                  onChange={(e) => item.setter(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            ))}
          </div>

          <button 
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="w-full mt-6 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
          >
            {savingSettings ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Pending Applications */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Pending Applications</h2>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by student name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="p-4 font-semibold">Student</th>
                <th className="p-4 font-semibold">Points</th>
                <th className="p-4 font-semibold">BMI</th>
                <th className="p-4 font-semibold">Applied Date</th>
                <th className="p-4 font-semibold">Pledge</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                    No pending applications found.
                  </td>
                </tr>
              ) : (
                pendingApps.map(app => (
                  <tr key={app.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                          <img src={app.userPhoto || `https://ui-avatars.com/api/?name=${app.userName}&background=3b82f6&color=fff`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-slate-900">{app.userName}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-blue-600">{app.points}</td>
                    <td className="p-4 font-medium text-slate-700">{app.bmi}</td>
                    <td className="p-4 text-slate-500 text-sm">{new Date(app.appliedAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="max-w-xs text-xs text-slate-500 italic truncate" title={app.pledge}>
                        "{app.pledge}"
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleUpdateStatus(app.id, app.userId, 'approved')}
                          className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all active:scale-95"
                          title="Approve"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(app.id, app.userId, 'rejected')}
                          className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all active:scale-95"
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
        <div className="md:hidden divide-y divide-slate-100">
          {pendingApps.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">
              No pending applications found.
            </div>
          ) : (
            pendingApps.map(app => (
              <div key={app.id} className="p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                    <img src={app.userPhoto || `https://ui-avatars.com/api/?name=${app.userName}&background=3b82f6&color=fff`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{app.userName}</h3>
                    <p className="text-xs text-slate-500">{new Date(app.appliedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600 leading-none">{app.points}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Points</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">BMI</p>
                    <p className="text-sm font-bold text-slate-700">{app.bmi}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                    <p className="text-sm font-bold text-amber-600">Pending</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pledge</p>
                  <p className="text-xs text-slate-500 italic line-clamp-2">"{app.pledge}"</p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleUpdateStatus(app.id, app.userId, 'approved')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 active:scale-[0.98]"
                  >
                    <Check size={18} />
                    Approve
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(app.id, app.userId, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 font-bold border border-red-100 rounded-2xl active:scale-[0.98]"
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
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Processed Applications</h2>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4 font-semibold">Student</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Applied Date</th>
                </tr>
              </thead>
              <tbody>
                {processedApps.map(app => (
                  <tr key={app.id} className="border-b border-slate-50">
                    <td className="p-4 font-bold text-slate-900">{app.userName}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">{new Date(app.appliedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {processedApps.map(app => (
              <div key={app.id} className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">{app.userName}</h3>
                  <p className="text-xs text-slate-500">{new Date(app.appliedAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

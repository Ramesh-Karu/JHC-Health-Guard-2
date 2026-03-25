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
    <div className="space-y-8 p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Wellness Badge Portal</h1>
          <p className="text-slate-500">Manage student applications for the Wellness Badge.</p>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Settings size={20} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-700">Points Configuration</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-600">Badge Requirement:</span>
              <input 
                type="number" 
                value={requiredPoints}
                onChange={(e) => setRequiredPoints(Number(e.target.value))}
                className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-600">Per Sport:</span>
              <input 
                type="number" 
                value={pointsPerSport}
                onChange={(e) => setPointsPerSport(Number(e.target.value))}
                className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-600">Per Exercise:</span>
              <input 
                type="number" 
                value={pointsPerExercise}
                onChange={(e) => setPointsPerExercise(Number(e.target.value))}
                className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-600">Per Healthy Habit:</span>
              <input 
                type="number" 
                value={pointsPerHabit}
                onChange={(e) => setPointsPerHabit(Number(e.target.value))}
                className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-600">Normal BMI:</span>
              <input 
                type="number" 
                value={pointsPerNormalBMI}
                onChange={(e) => setPointsPerNormalBMI(Number(e.target.value))}
                className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-600">Good Strength:</span>
              <input 
                type="number" 
                value={pointsPerGoodStrength}
                onChange={(e) => setPointsPerGoodStrength(Number(e.target.value))}
                className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
              />
            </div>
          </div>

          <button 
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="w-full mt-2 px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {savingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900">Pending Applications</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">Points</th>
                <th className="p-4 font-medium">BMI</th>
                <th className="p-4 font-medium">Applied Date</th>
                <th className="p-4 font-medium">Pledge</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No pending applications found.
                  </td>
                </tr>
              ) : (
                pendingApps.map(app => (
                  <tr key={app.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
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
                          className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(app.id, app.userId, 'rejected')}
                          className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
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
      </div>

      {processedApps.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden opacity-75">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Processed Applications</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                  <th className="p-4 font-medium">Student</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Applied Date</th>
                </tr>
              </thead>
              <tbody>
                {processedApps.map(app => (
                  <tr key={app.id} className="border-b border-slate-50">
                    <td className="p-4 font-bold text-slate-900">{app.userName}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {app.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">{new Date(app.appliedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

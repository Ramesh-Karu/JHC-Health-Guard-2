import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, orderBy, doc, getDoc, setDoc, updateDoc } from '../firebase';
import { 
  Activity, 
  Scale, 
  Ruler, 
  Award, 
  TrendingUp,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useAuth } from '../App';

export default function StudentTracking() {
  const { user, login } = useAuth();
  const [healthHistory, setHealthHistory] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requiredPoints, setRequiredPoints] = useState(1000);
  const [applying, setApplying] = useState(false);
  const [applicationError, setApplicationError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id) return;
        
        // Fetch Settings
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
        if (settingsDoc.exists() && settingsDoc.data().requiredBadgePoints) {
          setRequiredPoints(settingsDoc.data().requiredBadgePoints);
        }

        // Fetch Health Records
        const healthQuery = query(collection(db, 'health_records'), where('userId', '==', user.id), orderBy('date', 'desc'));
        const healthSnapshot = await getDocs(healthQuery);
        setHealthHistory(healthSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // Fetch Activities
        const activityQuery = query(collection(db, 'activities'), where('userId', '==', user.id), orderBy('date', 'desc'));
        const activitySnapshot = await getDocs(activityQuery);
        setActivities(activitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // Fetch Badges
        const badgeQuery = query(collection(db, 'badges'), where('userId', '==', user.id));
        const badgeSnapshot = await getDocs(badgeQuery);
        setBadges(badgeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'student_tracking_data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleApplyForBadge = async () => {
    if (!user) return;
    setApplying(true);
    setApplicationError('');
    try {
      const appId = `${user.id}_wellness_badge`;
      await setDoc(doc(db, 'badge_applications', appId), {
        userId: user.id,
        userName: user.fullName,
        userPhoto: user.photoUrl || '',
        points: user.points,
        bmi: latestHealth?.bmi,
        status: 'pending',
        appliedAt: new Date().toISOString(),
        pledge: "I assure that I maintain my health and I follow the guidelines. And if I get off from my healthy points, then it's my concern to leverage my opportunity to be a to be the holder of the wellness Badge."
      });

      await updateDoc(doc(db, 'users', user.id), {
        badgeStatus: 'pending'
      });

      login({ ...user, badgeStatus: 'pending' });
    } catch (err) {
      console.error("Error applying for badge:", err);
      setApplicationError("Failed to submit application. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  const chartData = [...healthHistory].reverse().map(r => ({
    date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    bmi: r.bmi,
    weight: r.weight,
    height: r.height
  }));

  const latestHealth = healthHistory[0];
  const hasGoodBmi = latestHealth?.bmi >= 18.5 && latestHealth?.bmi <= 24.9;
  const hasStrength = latestHealth?.gripStrength > 0;
  const hasCircumference = latestHealth?.hip > 0 && latestHealth?.waist > 0;
  const hasEnoughPoints = (user?.points || 0) >= requiredPoints;
  
  const isEligible = hasGoodBmi && hasStrength && hasCircumference && hasEnoughPoints;

  return (
    <div className="space-y-8 p-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Progress Tracker</h1>
        <p className="text-slate-500">Monitor your health and activity journey.</p>
      </div>

      {/* Wellness Badge Application Section */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex items-start gap-6 relative z-10">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${user?.wellnessBadge ? 'bg-emerald-500 shadow-emerald-200' : 'bg-slate-800 shadow-slate-300'}`}>
            <ShieldCheck className="text-white" size={32} />
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Wellness Badge</h2>
            <p className="text-slate-600 mb-6">
              Earn the prestigious Wellness Badge by maintaining a healthy lifestyle, participating in sports, and eating well.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasEnoughPoints ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                  {hasEnoughPoints ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{user?.points || 0} / {requiredPoints} Points</p>
                  <p className="text-xs text-slate-500">Health Points</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasGoodBmi ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                  {hasGoodBmi ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Healthy BMI</p>
                  <p className="text-xs text-slate-500">18.5 - 24.9</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasStrength ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                  {hasStrength ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Muscle Strength</p>
                  <p className="text-xs text-slate-500">Recorded in Health Check</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasCircumference ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                  {hasCircumference ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Hip & Waist</p>
                  <p className="text-xs text-slate-500">Recorded in Health Check</p>
                </div>
              </div>
            </div>

            {user?.wellnessBadge ? (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 font-medium flex items-center gap-3">
                <ShieldCheck size={24} />
                You are a proud holder of the Wellness Badge!
              </div>
            ) : user?.badgeStatus === 'pending' ? (
              <div className="bg-blue-50 text-blue-700 p-4 rounded-xl border border-blue-200 font-medium flex items-center gap-3">
                <AlertCircle size={24} />
                Your application is currently under review by an administrator.
              </div>
            ) : user?.badgeStatus === 'rejected' ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 font-medium flex items-center gap-3">
                <AlertCircle size={24} />
                Your previous application was not approved. Please ensure you meet all criteria and try again.
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2">Application Pledge</h3>
                <p className="text-sm text-slate-600 italic mb-6 border-l-4 border-slate-300 pl-4 py-1">
                  "I assure that I maintain my health and I follow the guidelines. And if I get off from my healthy points, then it's my concern to leverage my opportunity to be a to be the holder of the wellness Badge."
                </p>
                
                {applicationError && (
                  <p className="text-red-500 text-sm mb-4">{applicationError}</p>
                )}

                <button
                  onClick={handleApplyForBadge}
                  disabled={!isEligible || applying}
                  className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    isEligible 
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                      : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {applying ? 'Submitting...' : 'Apply for Wellness Badge'}
                </button>
                {!isEligible && (
                  <p className="text-xs text-slate-500 mt-3">
                    * You need to fulfill all health criteria and points to apply.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Scale className="text-blue-500" />
            <h3 className="font-bold text-slate-700">Weight</h3>
          </div>
          <p className="text-3xl font-bold">{healthHistory[0]?.weight || 0} kg</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Ruler className="text-blue-500" />
            <h3 className="font-bold text-slate-700">Height</h3>
          </div>
          <p className="text-3xl font-bold">{healthHistory[0]?.height || 0} cm</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Award className="text-blue-500" />
            <h3 className="font-bold text-slate-700">Total Points</h3>
          </div>
          <p className="text-3xl font-bold">{user?.points || 0}</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border shadow-sm">
        <h3 className="text-lg font-bold mb-6">My Badges</h3>
        <div className="flex gap-4">
          {badges.length > 0 ? badges.map((b: any, i: number) => (
            <div key={i} className="flex flex-col items-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-4xl">{b.icon}</span>
              <span className="font-bold text-emerald-800 text-sm">{b.name}</span>
            </div>
          )) : <p className="text-slate-500">No badges earned yet. Keep active!</p>}
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border shadow-sm">
        <h3 className="text-lg font-bold mb-6">BMI Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="bmi" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border shadow-sm">
        <h3 className="text-lg font-bold mb-6">Recent Activities</h3>
        <div className="space-y-4">
          {activities.slice(0, 5).map((activity: any) => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-4">
                <Activity className="text-blue-500" />
                <div>
                  <p className="font-bold">{activity.name}</p>
                  <p className="text-xs text-slate-500">{new Date(activity.date).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="font-bold text-blue-600">+{activity.points} pts</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
import HeartLoader from '../components/HeartLoader';

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <HeartLoader />
    </div>
  );

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
    <div className="space-y-6 p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">My Progress Tracker</h1>
        <p className="text-slate-500 mt-1">Monitor your health and activity journey.</p>
      </div>
 
      {/* Wellness Badge Application Section */}
      <div className="bg-white p-5 md:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${user?.wellnessBadge ? 'bg-emerald-500 shadow-emerald-200' : 'bg-slate-800 shadow-slate-300'}`}>
            <ShieldCheck className="text-white" size={32} />
          </div>
          
          <div className="flex-1 w-full">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Wellness Badge</h2>
            <p className="text-sm md:text-base text-slate-600 mb-6">
              Earn the prestigious Wellness Badge by maintaining a healthy lifestyle, participating in sports, and eating well.
            </p>
 
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8">
              {[
                { label: 'Health Points', value: `${user?.points || 0} / ${requiredPoints}`, sub: 'Points', active: hasEnoughPoints },
                { label: 'Healthy BMI', value: '18.5 - 24.9', sub: 'BMI Range', active: hasGoodBmi },
                { label: 'Muscle Strength', value: 'Recorded', sub: 'Health Check', active: hasStrength },
                { label: 'Hip & Waist', value: 'Recorded', sub: 'Health Check', active: hasCircumference },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:shadow-slate-100">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                    {item.active ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
 
            {user?.wellnessBadge ? (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-200 font-bold text-sm flex items-center gap-3 shadow-sm shadow-emerald-100">
                <ShieldCheck size={24} className="shrink-0" />
                You are a proud holder of the Wellness Badge!
              </div>
            ) : user?.badgeStatus === 'pending' ? (
              <div className="bg-blue-50 text-blue-700 p-4 rounded-2xl border border-blue-200 font-bold text-sm flex items-center gap-3 shadow-sm shadow-blue-100">
                <AlertCircle size={24} className="shrink-0" />
                Your application is currently under review by an administrator.
              </div>
            ) : user?.badgeStatus === 'rejected' ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 font-bold text-sm flex items-center gap-3 shadow-sm shadow-red-100">
                <AlertCircle size={24} className="shrink-0" />
                Your previous application was not approved. Please ensure you meet all criteria and try again.
              </div>
            ) : (
              <div className="bg-slate-50 p-5 md:p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-500" />
                  Application Pledge
                </h3>
                <p className="text-sm text-slate-600 italic mb-6 border-l-4 border-slate-300 pl-4 py-1 leading-relaxed">
                  "I assure that I maintain my health and I follow the guidelines. And if I get off from my healthy points, then it's my concern to leverage my opportunity to be a to be the holder of the wellness Badge."
                </p>
                
                {applicationError && (
                  <p className="text-red-500 text-sm mb-4 font-medium flex items-center gap-2">
                    <AlertCircle size={16} />
                    {applicationError}
                  </p>
                )}
 
                <button
                  onClick={handleApplyForBadge}
                  disabled={!isEligible || applying}
                  className={`w-full md:w-auto px-10 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                    isEligible 
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200 active:scale-[0.98]' 
                      : 'bg-slate-800 text-slate-400 cursor-not-allowed opacity-80'
                  }`}
                >
                  {applying ? 'Submitting Application...' : 'Apply for Wellness Badge'}
                </button>
                {!isEligible && (
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-4 flex items-center gap-2">
                    <AlertCircle size={12} />
                    * You need to fulfill all health criteria and points to apply.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
 
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[
          { icon: Scale, label: 'Weight', value: `${healthHistory[0]?.weight || 0} kg`, color: 'text-blue-500', bg: 'bg-blue-50' },
          { icon: Ruler, label: 'Height', value: `${healthHistory[0]?.height || 0} cm`, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { icon: Award, label: 'Total Points', value: user?.points || 0, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon size={20} />
              </div>
              <h3 className="font-bold text-slate-500 uppercase text-xs tracking-wider">{stat.label}</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">My Badges</h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
              {badges.length} Earned
            </span>
          </div>
          <div className="flex flex-wrap gap-4">
            {badges.length > 0 ? badges.map((b: any, i: number) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 w-[calc(50%-8px)] sm:w-32 transition-all hover:scale-105">
                <span className="text-4xl">{b.icon}</span>
                <span className="font-bold text-emerald-800 text-xs text-center">{b.name}</span>
              </div>
            )) : (
              <div className="w-full py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Award size={48} className="mb-2 opacity-20" />
                <p className="font-medium">No badges earned yet.</p>
                <p className="text-xs">Keep active to unlock achievements!</p>
              </div>
            )}
          </div>
        </div>
 
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">BMI Trend</h3>
          <div className="h-64 md:h-80 -ml-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="bmi" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
 
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Recent Activities</h3>
          <button className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-wider">View All</button>
        </div>
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity: any) => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm md:text-base">{activity.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date(activity.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600">+{activity.points}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Points</p>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <p className="font-medium">No activities recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

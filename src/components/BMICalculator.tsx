import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, Ruler, Activity, Info, User, Calendar, Zap, Heart, TrendingUp, Target, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'extra';

export default function BMICalculator() {
  const [weight, setWeight] = useState<string>(() => localStorage.getItem('bmi_weight') || '');
  const [height, setHeight] = useState<string>(() => localStorage.getItem('bmi_height') || '');
  const [age, setAge] = useState<string>(() => localStorage.getItem('bmi_age') || '25');
  const [gender, setGender] = useState<'male' | 'female'>(() => (localStorage.getItem('bmi_gender') as any) || 'male');
  const [activity, setActivity] = useState<ActivityLevel>(() => (localStorage.getItem('bmi_activity') as any) || 'moderate');

  useEffect(() => {
    localStorage.setItem('bmi_weight', weight);
    localStorage.setItem('bmi_height', height);
    localStorage.setItem('bmi_age', age);
    localStorage.setItem('bmi_gender', gender);
    localStorage.setItem('bmi_activity', activity);
  }, [weight, height, age, gender, activity]);

  const bmi = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // cm to m
    if (w > 0 && h > 0) {
      return parseFloat((w / (h * h)).toFixed(1));
    }
    return null;
  }, [weight, height]);

  const status = useMemo(() => {
    if (bmi === null) return null;
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500', bg: 'bg-blue-500', description: 'You are in the underweight range. Consider consulting a nutritionist.' };
    if (bmi < 25) return { label: 'Normal', color: 'text-emerald-500', bg: 'bg-emerald-500', description: 'You are in the normal weight range. Great job! Keep it up.' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-amber-500', bg: 'bg-amber-500', description: 'You are in the overweight range. Focus on balanced diet and exercise.' };
    return { label: 'Obese', color: 'text-red-500', bg: 'bg-red-500', description: 'You are in the obese range. It is recommended to consult a healthcare provider.' };
  }, [bmi]);

  const bmr = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);
    if (w > 0 && h > 0 && a > 0) {
      // Mifflin-St Jeor Equation
      if (gender === 'male') {
        return Math.round(10 * w + 6.25 * h - 5 * a + 5);
      } else {
        return Math.round(10 * w + 6.25 * h - 5 * a - 161);
      }
    }
    return null;
  }, [weight, height, age, gender]);

  const tdee = useMemo(() => {
    if (bmr === null) return null;
    const multipliers: Record<ActivityLevel, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      extra: 1.9,
    };
    return Math.round(bmr * multipliers[activity]);
  }, [bmr, activity]);

  const idealWeight = useMemo(() => {
    const h = parseFloat(height);
    if (h > 152.4) { // Devine Formula (only for height > 152.4cm / 5ft)
      const inchesOver5ft = (h - 152.4) / 2.54;
      if (gender === 'male') {
        return Math.round(50 + 2.3 * inchesOver5ft);
      } else {
        return Math.round(45.5 + 2.3 * inchesOver5ft);
      }
    }
    return null;
  }, [height, gender]);

  const weightToGoal = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (w > 0 && h > 0) {
      const minNormalWeight = 18.5 * h * h;
      const maxNormalWeight = 24.9 * h * h;
      if (w < minNormalWeight) return { type: 'gain', amount: (minNormalWeight - w).toFixed(1) };
      if (w > maxNormalWeight) return { type: 'lose', amount: (w - maxNormalWeight).toFixed(1) };
      return { type: 'maintain', amount: '0' };
    }
    return null;
  }, [weight, height]);

  const needleAngle = useMemo(() => {
    if (bmi === null) return 0;
    return Math.min(Math.max((bmi / 40) * 180, 0), 180);
  }, [bmi]);

  const chartData = [
    { name: 'Under', value: 18.5, color: '#3b82f6' },
    { name: 'Normal', value: 24.9, color: '#10b981' },
    { name: 'Over', value: 29.9, color: '#f59e0b' },
    { name: 'Obese', value: 40, color: '#ef4444' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[40px] p-6 md:p-10 shadow-2xl border border-slate-100 dark:border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-200 dark:shadow-none">
            <Scale size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Advanced BMI</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Complete Health Assessment</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl self-start">
          <button 
            onClick={() => setGender('male')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${gender === 'male' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            Male
          </button>
          <button 
            onClick={() => setGender('female')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${gender === 'female' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-500'}`}
          >
            Female
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Inputs */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[40px] border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Physical Data</h3>
            <div className="space-y-6">
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1">Weight (kg)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={weight} 
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full p-4 pl-12 rounded-2xl border-2 border-transparent bg-white dark:bg-slate-800 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none font-bold text-slate-900 dark:text-white shadow-sm"
                    placeholder="70"
                  />
                  <Scale className="absolute left-4 top-4 text-slate-400" size={20} />
                </div>
              </div>
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1">Height (cm)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={height} 
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full p-4 pl-12 rounded-2xl border-2 border-transparent bg-white dark:bg-slate-800 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none font-bold text-slate-900 dark:text-white shadow-sm"
                    placeholder="175"
                  />
                  <Ruler className="absolute left-4 top-4 text-slate-400" size={20} />
                </div>
              </div>
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1">Age (years)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={age} 
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full p-4 pl-12 rounded-2xl border-2 border-transparent bg-white dark:bg-slate-800 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none font-bold text-slate-900 dark:text-white shadow-sm"
                    placeholder="25"
                  />
                  <Calendar className="absolute left-4 top-4 text-slate-400" size={20} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[40px] border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Activity Level</h3>
            <div className="grid grid-cols-1 gap-2">
              {(['sedentary', 'light', 'moderate', 'active', 'extra'] as ActivityLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setActivity(level)}
                  className={`p-3 rounded-xl text-left text-sm font-bold capitalize transition-all border-2 ${
                    activity === level 
                      ? 'bg-rose-500 border-rose-500 text-white shadow-md' 
                      : 'bg-white dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="xl:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* BMI Gauge */}
            <div className="bg-slate-900 dark:bg-slate-800 rounded-[40px] p-8 text-white flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              {bmi !== null && status ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center w-full z-10"
                >
                  <div className="relative w-full h-48 mb-6 flex items-end justify-center overflow-hidden">
                    <svg viewBox="0 0 200 100" className="w-full h-full max-w-[280px]">
                      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="20" strokeLinecap="round" />
                      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#bmiGradient)" strokeWidth="20" strokeLinecap="round" />
                      <defs>
                        <linearGradient id="bmiGradient">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="46%" stopColor="#10b981" />
                          <stop offset="75%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                      <motion.line 
                        x1="100" y1="100" x2="100" y2="20" 
                        stroke="white" strokeWidth="6" strokeLinecap="round"
                        animate={{ rotate: needleAngle - 90 }}
                        style={{ originX: "100px", originY: "100px" }}
                      />
                      <circle cx="100" cy="100" r="8" fill="white" />
                    </svg>
                    <div className="absolute bottom-0 text-center font-black text-6xl text-white tracking-tighter">{bmi}</div>
                  </div>
                  <div className={`inline-block px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest mb-4 ${status.bg} text-white shadow-lg`}>
                    {status.label}
                  </div>
                  <p className="text-slate-400 font-medium px-4 leading-relaxed">{status.description}</p>
                </motion.div>
              ) : (
                <div className="text-slate-500 flex flex-col items-center gap-4 py-12">
                  <Activity size={64} className="opacity-20 animate-pulse" />
                  <p className="font-bold uppercase tracking-widest text-xs">Awaiting Data</p>
                </div>
              )}
            </div>

            {/* Health Metrics Grid */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-[32px] border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-xl text-white">
                    <Zap size={20} />
                  </div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">BMR (Basal Metabolism)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{bmr || '--'}</span>
                  <span className="text-sm font-bold text-slate-500">kcal/day</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Calories burned at rest</p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-[32px] border border-emerald-100 dark:border-emerald-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500 rounded-xl text-white">
                    <Heart size={20} />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">TDEE (Daily Energy)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{tdee || '--'}</span>
                  <span className="text-sm font-bold text-slate-500">kcal/day</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Calories burned with activity</p>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-[32px] border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-500 rounded-xl text-white">
                    <Target size={20} />
                  </div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Ideal Weight Range</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{idealWeight ? `${idealWeight - 5} - ${idealWeight + 5}` : '--'}</span>
                  <span className="text-sm font-bold text-slate-500">kg</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Based on Devine Formula</p>
              </div>
            </div>
          </div>

          {/* Goal Analysis */}
          {weightToGoal && weightToGoal.type !== 'maintain' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-8 rounded-[40px] border-2 flex flex-col md:flex-row items-center gap-8 ${
                weightToGoal.type === 'lose' 
                  ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30' 
                  : 'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30'
              }`}
            >
              <div className={`p-6 rounded-[32px] ${weightToGoal.type === 'lose' ? 'bg-amber-500' : 'bg-blue-500'} text-white shadow-xl`}>
                <TrendingUp size={40} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                  Weight Management Goal
                </h3>
                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  To reach a healthy BMI of 24.9, you should aim to {weightToGoal.type} approximately <span className="font-black text-slate-900 dark:text-white text-xl">{weightToGoal.amount} kg</span>.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 px-8 py-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Weight</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {weightToGoal.type === 'lose' 
                    ? (parseFloat(weight) - parseFloat(weightToGoal.amount)).toFixed(1)
                    : (parseFloat(weight) + parseFloat(weightToGoal.amount)).toFixed(1)} kg
                </p>
              </div>
            </motion.div>
          )}

          {/* Chart */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Info size={18} className="text-blue-500" />
              BMI Reference Distribution
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}} 
                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold'}} 
                  />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

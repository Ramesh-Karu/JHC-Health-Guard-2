import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Scale, Ruler, Activity, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function BMICalculator() {
  const [weight, setWeight] = useState<string>(() => localStorage.getItem('bmi_weight') || '');
  const [height, setHeight] = useState<string>(() => localStorage.getItem('bmi_height') || '');

  useEffect(() => {
    localStorage.setItem('bmi_weight', weight);
    localStorage.setItem('bmi_height', height);
  }, [weight, height]);

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
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500', bg: 'bg-blue-500', description: 'You are in the underweight range.' };
    if (bmi < 25) return { label: 'Normal', color: 'text-emerald-500', bg: 'bg-emerald-500', description: 'You are in the normal weight range. Great job!' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-amber-500', bg: 'bg-amber-500', description: 'You are in the overweight range.' };
    return { label: 'Obese', color: 'text-red-500', bg: 'bg-red-500', description: 'You are in the obese range.' };
  }, [bmi]);

  const needleAngle = useMemo(() => {
    if (bmi === null) return 0;
    // Map BMI 0-40 to 0-180 degrees
    return Math.min(Math.max((bmi / 40) * 180, 0), 180);
  }, [bmi]);

  const chartData = [
    { name: 'Under', value: 18.5, color: '#3b82f6' },
    { name: 'Normal', value: 24.9, color: '#10b981' },
    { name: 'Over', value: 29.9, color: '#f59e0b' },
    { name: 'Obese', value: 40, color: '#ef4444' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-2xl text-rose-600 dark:text-rose-400">
          <Scale size={24} />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">BMI Calculator</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="group">
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Weight (kg)</label>
            <div className="relative">
              <input 
                type="number" 
                value={weight} 
                onChange={(e) => setWeight(e.target.value)}
                className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                placeholder="e.g. 70"
              />
              <Scale className="absolute left-4 top-4 text-slate-400" size={20} />
            </div>
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Height (cm)</label>
            <div className="relative">
              <input 
                type="number" 
                value={height} 
                onChange={(e) => setHeight(e.target.value)}
                className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                placeholder="e.g. 175"
              />
              <Ruler className="absolute left-4 top-4 text-slate-400" size={20} />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6">
          {bmi !== null && status ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center w-full"
            >
              <div className="relative w-full h-40 mb-4 flex items-end justify-center overflow-hidden">
                <svg viewBox="0 0 200 100" className="w-full h-full max-w-[240px]">
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e2e8f0" strokeWidth="20" strokeLinecap="round" />
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gradient)" strokeWidth="20" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="gradient">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="46%" stopColor="#10b981" />
                      <stop offset="75%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <motion.line 
                    x1="100" y1="100" x2="100" y2="20" 
                    stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                    animate={{ rotate: needleAngle - 90 }}
                    style={{ originX: "100px", originY: "100px" }}
                    className="text-slate-900 dark:text-white"
                  />
                </svg>
                <div className="absolute bottom-0 text-center font-extrabold text-5xl text-slate-900 dark:text-white">{bmi}</div>
              </div>
              <p className={`text-2xl font-bold ${status.color} mb-2`}>{status.label}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 px-4">{status.description}</p>
            </motion.div>
          ) : (
            <div className="text-slate-400 dark:text-slate-600 flex flex-col items-center gap-2">
              <Activity size={48} className="opacity-20" />
              <p>Enter your details to calculate</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 h-48">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
          <Info size={16} />
          BMI Reference Range
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useQueryClient } from '@tanstack/react-query';
import { db, handleFirestoreError, OperationType, collection, addDoc, updateDoc, doc, increment, getDoc } from '../firebase';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../App';
import Toast from '../components/Toast';
import { useAllStudents, useAllHealthRecords, CACHE_KEYS } from '../lib/queries';

export default function TeacherHealthRecords() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: allStudents = [], isLoading: studentsLoading } = useAllStudents();
  const { data: allHealthRecords = [], isLoading: healthLoading } = useAllHealthRecords();

  const [pointSettings, setPointSettings] = useState({
    normalBMI: 50,
    goodStrength: 50
  });

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setPointSettings({
            normalBMI: data.pointsPerNormalBMI || 50,
            goodStrength: data.pointsPerGoodStrength || 50
          });
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterBmiCategory, setFilterBmiCategory] = useState('');
  const [filterHealthStatus, setFilterHealthStatus] = useState('');
  const [filterPoints, setFilterPoints] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [formData, setFormData] = useState({
    userId: '',
    height: '',
    weight: '',
    hip: '',
    waist: '',
    gripStrength: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const studentsWithHealth = useMemo(() => {
    if (!user?.class || !user?.division) return [];

    // Filter students in teacher's class
    const myStudents = allStudents.filter(s => 
      s.role === 'student' && 
      s.class === user.class && 
      s.division === user.division
    );

    return myStudents.map((student: any) => {
      const studentRecords = allHealthRecords.filter(r => r.userId === student.id);
      let latestBmi = null;
      let healthCategory = 'N/A';
      let latestDate = '';
      
      if (studentRecords.length > 0) {
        const latestRecord: any = [...studentRecords].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        latestBmi = latestRecord.bmi;
        healthCategory = latestRecord.category;
        latestDate = latestRecord.date;
      }

      return {
        ...student,
        latestBmi,
        healthCategory,
        latestDate
      };
    });
  }, [allStudents, allHealthRecords, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const heightInMeters = parseFloat(formData.height) / 100;
      const weightInKg = parseFloat(formData.weight);
      const hip = parseFloat(formData.hip);
      const waist = parseFloat(formData.waist);
      const gripStrength = parseFloat(formData.gripStrength);
      
      const bmi = weightInKg / (heightInMeters * heightInMeters);
      
      let category = 'Normal';
      if (bmi < 18.5) category = 'Underweight';
      else if (bmi >= 25 && bmi < 30) category = 'Overweight';
      else if (bmi >= 30) category = 'Obese';
      if (waist && hip && (waist / hip > 0.9)) category = 'At Risk (Waist/Hip)';

      let pointsAwarded = 0;
      if (category === 'Normal') pointsAwarded += pointSettings.normalBMI;
      if (gripStrength > 20) pointsAwarded += pointSettings.goodStrength;

      await addDoc(collection(db, 'health_records'), {
        ...formData,
        height: parseFloat(formData.height),
        weight: weightInKg,
        hip,
        waist,
        gripStrength,
        bmi,
        category,
        pointsAwarded,
        createdAt: new Date().toISOString()
      });
      
      if (pointsAwarded > 0) {
        await updateDoc(doc(db, 'users', formData.userId), {
          points: increment(pointsAwarded)
        });
      }
      
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ALL_HEALTH_RECORDS });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.STUDENT_HEALTH_RECORDS(formData.userId) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ADMIN_DASHBOARD });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ALL_USERS });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ALL_STUDENTS });

      setShowAddModal(false);
      setToast({ message: `Health record saved successfully! Awarded ${pointsAwarded} points.`, type: 'success' });
      setFormData({
        userId: '',
        height: '',
        weight: '',
        hip: '',
        waist: '',
        gripStrength: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'health_records');
    }
  };

  const uniqueClasses = Array.from(new Set(studentsWithHealth.map((s: any) => s.class).filter(Boolean)));
  const uniqueDivisions = Array.from(new Set(studentsWithHealth.map((s: any) => s.division).filter(Boolean)));

  const filteredStudents = useMemo(() => {
    return studentsWithHealth.filter((s: any) => {
      const nameMatch = s.fullName ? s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) : false;
      const indexMatch = s.indexNumber ? s.indexNumber.toLowerCase().includes(searchTerm.toLowerCase()) : false;
      const matchesSearch = nameMatch || indexMatch;
      const matchesClass = filterClass ? s.class === filterClass : true;
      const matchesDivision = filterDivision ? s.division === filterDivision : true;
      const matchesBmiCategory = filterBmiCategory ? s.healthCategory === filterBmiCategory : true;
      
      let matchesHealthStatus = true;
      if (filterHealthStatus === 'Healthy') {
        matchesHealthStatus = s.healthCategory === 'Normal';
      } else if (filterHealthStatus === 'Unhealthy') {
        matchesHealthStatus = s.healthCategory && s.healthCategory !== 'Normal' && s.healthCategory !== 'N/A';
      }

      let matchesPoints = true;
      const pts = s.points || 0;
      if (filterPoints === '0-100') matchesPoints = pts >= 0 && pts <= 100;
      else if (filterPoints === '101-500') matchesPoints = pts > 100 && pts <= 500;
      else if (filterPoints === '501-1000') matchesPoints = pts > 500 && pts <= 1000;
      else if (filterPoints === '>1000') matchesPoints = pts > 1000;

      const matchesDate = filterDate ? s.latestDate === filterDate : true;
      
      return matchesSearch && matchesClass && matchesDivision && matchesBmiCategory && matchesHealthStatus && matchesPoints && matchesDate;
    });
  }, [studentsWithHealth, searchTerm, filterClass, filterDivision, filterBmiCategory, filterHealthStatus, filterPoints, filterDate]);

  if (studentsLoading || healthLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Health Records</h1>
          <p className="text-slate-500 mt-1">Update health measurements for your students</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
        >
          <Plus size={20} />
          Add Record
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64"
            />
          </div>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="p-2 border border-slate-200 rounded-xl">
            <option value="">All Classes</option>
            {uniqueClasses.map((c: any) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)} className="p-2 border border-slate-200 rounded-xl">
            <option value="">All Divisions</option>
            {uniqueDivisions.map((d: any) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterBmiCategory} onChange={e => setFilterBmiCategory(e.target.value)} className="p-2 border border-slate-200 rounded-xl">
            <option value="">All BMI Categories</option>
            <option value="Normal">Normal</option>
            <option value="Underweight">Underweight</option>
            <option value="Overweight">Overweight</option>
            <option value="Obese">Obese</option>
            <option value="At Risk (Waist/Hip)">At Risk (Waist/Hip)</option>
          </select>
          <select value={filterHealthStatus} onChange={e => setFilterHealthStatus(e.target.value)} className="p-2 border border-slate-200 rounded-xl">
            <option value="">All Health Status</option>
            <option value="Healthy">Healthy</option>
            <option value="Unhealthy">Unhealthy</option>
          </select>
          <select value={filterPoints} onChange={e => setFilterPoints(e.target.value)} className="p-2 border border-slate-200 rounded-xl">
            <option value="">All Points</option>
            <option value="0-100">0 - 100</option>
            <option value="101-500">101 - 500</option>
            <option value="501-1000">501 - 1000</option>
            <option value=">1000">&gt; 1000</option>
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="p-2 border border-slate-200 rounded-xl" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">Index Number</th>
                <th className="p-4 font-medium">Class/Div</th>
                <th className="p-4 font-medium">Points</th>
                <th className="p-4 font-medium">Latest BMI</th>
                <th className="p-4 font-medium">Health Status</th>
                <th className="p-4 font-medium">Latest Date</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student: any) => (
                <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-900">{student.fullName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{student.indexNumber || 'N/A'}</td>
                  <td className="p-4 text-slate-600">{student.class ? `${student.class} - ${student.division}` : 'N/A'}</td>
                  <td className="p-4 font-bold text-blue-600">{student.points || 0}</td>
                  <td className="p-4 font-mono text-slate-700">
                    {student.latestBmi ? student.latestBmi.toFixed(1) : 'N/A'}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      student.healthCategory === 'Normal' ? 'bg-emerald-100 text-emerald-700' :
                      student.healthCategory === 'Underweight' ? 'bg-blue-100 text-blue-700' :
                      student.healthCategory === 'Overweight' ? 'bg-orange-100 text-orange-700' :
                      student.healthCategory === 'Obese' ? 'bg-red-100 text-red-700' :
                      student.healthCategory === 'At Risk (Waist/Hip)' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {student.healthCategory}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{student.latestDate || 'N/A'}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => {
                        setFormData({ ...formData, userId: student.id });
                        setShowAddModal(true);
                      }}
                      className="text-blue-500 hover:text-blue-700 font-medium text-sm"
                    >
                      Update Record
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">Add Health Record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
                <select
                  required
                  value={formData.userId || ''}
                  onChange={e => setFormData({...formData, userId: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Student</option>
                  {studentsWithHealth.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={formData.height || ''}
                    onChange={e => setFormData({...formData, height: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={formData.weight || ''}
                    onChange={e => setFormData({...formData, weight: e.target.value})}
                    className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date || ''}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  Save Record
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}

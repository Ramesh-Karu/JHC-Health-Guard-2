import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, addDoc, updateDoc, doc, increment, getDoc } from '../firebase';
import { Search, Save, User, FileUp } from 'lucide-react';
import Papa from 'papaparse';
import Toast from '../components/Toast';
import { CACHE_KEYS } from '../lib/queries';

export default function AdminHealthUpdate() {
  const queryClient = useQueryClient();
  const [indexNumber, setIndexNumber] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ height: '', weight: '', hip: '', waist: '', gripStrength: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
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

  const searchStudent = async () => {
    if (!indexNumber) return;
    setLoading(true);
    setStudent(null);
    try {
      const q = query(collection(db, 'users'), where('indexNumber', '==', indexNumber));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setStudent({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setToast({ message: 'Student not found', type: 'error' });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setSaving(true);
    try {
      const height = parseFloat(formData.height);
      const weight = parseFloat(formData.weight);
      const hip = parseFloat(formData.hip);
      const waist = parseFloat(formData.waist);
      const gripStrength = parseFloat(formData.gripStrength);
      
      const bmi = weight / ((height / 100) ** 2);
      
      let category = 'Normal';
      if (bmi < 18.5) category = 'Underweight';
      else if (bmi >= 25) category = 'Overweight';
      if (bmi >= 30) category = 'Obese';

      // Simple health assessment based on new metrics
      if (waist && hip && (waist / hip > 0.9)) category = 'At Risk (Waist/Hip)';

      let pointsAwarded = 0;
      if (category === 'Normal') pointsAwarded += pointSettings.normalBMI;
      if (gripStrength > 20) pointsAwarded += pointSettings.goodStrength; // Assuming >20kg is good strength

      await addDoc(collection(db, 'health_records'), {
        userId: student.id,
        height,
        weight,
        bmi,
        hip,
        waist,
        gripStrength,
        category,
        pointsAwarded,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });

      if (pointsAwarded > 0) {
        await updateDoc(doc(db, 'users', student.id), {
          points: increment(pointsAwarded)
        });
      }

      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.STUDENT_HEALTH_RECORDS(student.id) });
      setToast({ message: `Health data updated successfully! Awarded ${pointsAwarded} points.`, type: 'success' });
      setFormData({ height: '', weight: '', hip: '', waist: '', gripStrength: '' });
      setStudent(null);
      setIndexNumber('');
    } catch (err) {
      setToast({ message: 'Error updating health data', type: 'error' });
      handleFirestoreError(err, OperationType.CREATE, 'health_records');
    } finally {
      setSaving(false);
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        // Fetch all students once
        const studentsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        const studentMap = new Map(studentsSnapshot.docs.map(doc => [doc.data().indexNumber, doc.id]));

        for (const row of results.data as any[]) {
          if (row.indexNumber && row.height && row.weight) {
            try {
              const studentId = studentMap.get(row.indexNumber);
              if (studentId) {
                const height = parseFloat(row.height);
                const weight = parseFloat(row.weight);
                const hip = parseFloat(row.hip || 0);
                const waist = parseFloat(row.waist || 0);
                const gripStrength = parseFloat(row.gripStrength || 0);
                
                const bmi = weight / ((height / 100) ** 2);
                let category = 'Normal';
                if (bmi < 18.5) category = 'Underweight';
                else if (bmi >= 25) category = 'Overweight';
                if (bmi >= 30) category = 'Obese';
                if (waist && hip && (waist / hip > 0.9)) category = 'At Risk (Waist/Hip)';

                let pointsAwarded = 0;
                if (category === 'Normal') pointsAwarded += pointSettings.normalBMI;
                if (gripStrength > 20) pointsAwarded += pointSettings.goodStrength;

                await addDoc(collection(db, 'health_records'), {
                  userId: studentId,
                  height,
                  weight,
                  hip,
                  waist,
                  gripStrength,
                  bmi,
                  category,
                  pointsAwarded,
                  date: new Date().toISOString().split('T')[0],
                  createdAt: new Date().toISOString()
                });

                if (pointsAwarded > 0) {
                  await updateDoc(doc(db, 'users', studentId), {
                    points: increment(pointsAwarded)
                  });
                }
              }
            } catch (err) {
              console.error('Error importing health data:', err);
            }
          }
        }
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ALL_HEALTH_RECORDS });
        setToast({ message: 'CSV import completed successfully!', type: 'success' });
      }
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Health Data Update</h1>
          <p className="text-slate-500 dark:text-slate-400">Update student health metrics</p>
        </div>
        <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer w-full sm:w-auto justify-center transition-colors">
          <FileUp size={18} /> Import
          <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
        </label>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Index Number"
            value={indexNumber}
            onChange={(e) => setIndexNumber(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white font-medium"
          />
          <button 
            onClick={searchStudent}
            disabled={loading}
            className="px-6 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Search size={18} />
            {loading ? '...' : 'Search'}
          </button>
        </div>

        {student && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center gap-4 border border-blue-100 dark:border-blue-800/30">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
              <User size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{student.fullName}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Class: {student.class}</p>
            </div>
          </div>
        )}

        {student && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Height (cm)', key: 'height' },
                { label: 'Weight (kg)', key: 'weight' },
                { label: 'Hip (cm)', key: 'hip' },
                { label: 'Waist (cm)', key: 'waist' },
                { label: 'Grip Strength (kg)', key: 'gripStrength' },
              ].map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{field.label}</label>
                  <input
                    type="number"
                    required={field.key === 'height' || field.key === 'weight'}
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white font-medium"
                  />
                </div>
              ))}
            </div>
            <button 
              type="submit"
              disabled={saving}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 mt-4"
            >
              <Save size={20} />
              {saving ? 'Updating...' : 'Update Health Data'}
            </button>
          </form>
        )}
      </div>

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

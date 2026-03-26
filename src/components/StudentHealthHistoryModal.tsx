import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Scale, Ruler, Activity, TrendingUp } from 'lucide-react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, orderBy } from '../firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  student: any;
  onClose: () => void;
}

export default function StudentHealthHistoryModal({ student, onClose }: Props) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, 'health_records'),
          where('userId', '==', student.id),
          orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'health_records');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [student.id]);

  const chartData = [...history].reverse().map(r => ({
    date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    bmi: r.bmi,
    weight: r.weight,
    height: r.height
  }));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">{student.fullName} - Health History</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
              <X size={24} />
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center">Loading history...</div>
          ) : (
            <div className="space-y-8">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="bmi" stroke="#3b82f6" name="BMI" />
                    <Line yAxisId="right" type="monotone" dataKey="weight" stroke="#10b981" name="Weight (kg)" />
                    <Line yAxisId="right" type="monotone" dataKey="height" stroke="#8b5cf6" name="Height (cm)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium">BMI</th>
                      <th className="p-3 font-medium">Weight (kg)</th>
                      <th className="p-3 font-medium">Height (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record: any) => (
                      <tr key={record.id} className="border-b border-slate-100">
                        <td className="p-3">{record.date}</td>
                        <td className="p-3">{record.bmi?.toFixed(1)}</td>
                        <td className="p-3">{record.weight}</td>
                        <td className="p-3">{record.height}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

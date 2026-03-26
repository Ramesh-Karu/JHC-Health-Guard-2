import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, addDoc, doc, deleteDoc, setDoc, initializeApp, deleteApp, getAuth, createUserWithEmailAndPassword, firebaseConfig, getCountFromServer } from '../firebase';
import { Plus, Trash2, Users, UserPlus, Award } from 'lucide-react';
import { useAuth } from '../App';
import Toast from '../components/Toast';

import { useSports } from '../lib/queries';

export default function AdminSports() {
  const { data: sports = [], isLoading, refetch } = useSports();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSportModal, setShowAddSportModal] = useState(false);
  const [showAddCoachModal, setShowAddCoachModal] = useState(false);
  const [newSport, setNewSport] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [newCoach, setNewCoach] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    indexNumber: '',
    sportsManaged: []
  });

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      // Fetch Coaches
      const coachQuery = query(collection(db, 'users'), where('role', '==', 'coach'));
      const coachSnapshot = await getDocs(coachQuery);
      const coachData = coachSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoaches(coachData as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'coaches');
    } finally {
      setLoading(false);
    }
  };

  const addSport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'sports'), { name: newSport });
      setShowAddSportModal(false);
      setNewSport('');
      setToast({ message: 'Sport added successfully', type: 'success' });
      refetch();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sports');
    }
  };

  const addCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tempApp = initializeApp(firebaseConfig as any, 'temp-create-coach-' + Date.now());
      const tempAuth = getAuth(tempApp);
      
      const userCredential = await createUserWithEmailAndPassword(tempAuth, newCoach.email, newCoach.password);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        fullName: newCoach.fullName,
        email: newCoach.email,
        phone: newCoach.phone,
        indexNumber: newCoach.indexNumber,
        role: 'coach',
        createdAt: new Date().toISOString()
      });
      
      await deleteApp(tempApp);
      
      setShowAddCoachModal(false);
      setToast({ message: 'Coach added successfully', type: 'success' });
      setNewCoach({ fullName: '', email: '', password: '', phone: '', indexNumber: '', sportsManaged: [] });
      refetch();
    } catch (err: any) {
      console.error("Error adding coach:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      if (errorMessage.includes('auth/email-already-in-use')) {
        setToast({ message: 'Email is already taken.', type: 'error' });
      } else if (errorMessage.includes('auth/weak-password')) {
        setToast({ message: 'Password should be at least 6 characters.', type: 'error' });
      } else {
        setToast({ message: 'Failed to add coach. Please try again.', type: 'error' });
      }
    }
  };

  const deleteSport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sport?')) return;
    try {
      await deleteDoc(doc(db, 'sports', id));
      setToast({ message: 'Sport deleted successfully', type: 'success' });
      refetch();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sports/${id}`);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Sports Management</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowAddSportModal(true)} className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95">
            <Plus size={20} /> Add Sport
          </button>
          <button onClick={() => setShowAddCoachModal(true)} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95">
            <UserPlus size={20} /> Add Coach
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sports Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Sports Categories</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 font-medium">Sport</th>
                  <th className="p-3 font-medium">Students</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {sports.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{s.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">{s.studentCount || 0}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => deleteSport(s.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all active:scale-95 inline-flex">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sports.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                No sports found.
              </div>
            )}
          </div>
        </div>

        {/* Coaches Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Coaches</h2>
          <div className="space-y-4">
            {coaches.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{c.fullName}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{c.email}</div>
                </div>
                <div className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full font-bold tracking-wide">
                  {c.assignedClasses ? JSON.parse(c.assignedClasses).join(', ') : 'No sports'}
                </div>
              </div>
            ))}
            {coaches.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                No coaches found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Sport Modal */}
      {showAddSportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800"
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Add Sport</h2>
            <form onSubmit={addSport}>
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Sport Name</label>
                <input 
                  type="text" 
                  required 
                  value={newSport} 
                  onChange={e => setNewSport(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-medium" 
                  placeholder="e.g., Basketball" 
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowAddSportModal(false)} className="px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95">Add Sport</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Coach Modal */}
      {showAddCoachModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800"
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Add Coach</h2>
            <form onSubmit={addCoach} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g., John Doe" 
                  value={newCoach.fullName} 
                  onChange={e => setNewCoach({...newCoach, fullName: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white font-medium" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  required 
                  placeholder="e.g., coach@school.edu" 
                  value={newCoach.email} 
                  onChange={e => setNewCoach({...newCoach, email: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white font-medium" 
                />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-8">
                <button type="button" onClick={() => setShowAddCoachModal(false)} className="px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95">Add Coach</button>
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

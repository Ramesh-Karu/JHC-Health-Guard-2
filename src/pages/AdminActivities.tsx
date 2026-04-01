import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot } from '../firebase';
import { Plus, Trash2, Edit2, Check, X, Activity, Dumbbell, Trophy, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MasterActivity {
  id: string;
  type: 'exercise' | 'sport' | 'habit';
  name: string;
  points: number;
  description?: string;
  videoUrl?: string;
  difficulty?: string;
  ageGroup?: string;
}

export default function AdminActivities() {
  const [activities, setActivities] = useState<MasterActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<MasterActivity | null>(null);
  const [formData, setFormData] = useState<Partial<MasterActivity>>({
    type: 'sport',
    name: '',
    points: 100,
    description: '',
    videoUrl: '',
    difficulty: 'Beginner',
    ageGroup: 'All Ages'
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'master_activities'), (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MasterActivity)));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching master activities:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingActivity) {
        await updateDoc(doc(db, 'master_activities', editingActivity.id), formData);
      } else {
        await addDoc(collection(db, 'master_activities'), formData);
      }
      setIsModalOpen(false);
      setEditingActivity(null);
      setFormData({
        type: 'sport',
        name: '',
        points: 100,
        description: '',
        videoUrl: '',
        difficulty: 'Beginner',
        ageGroup: 'All Ages'
      });
    } catch (err) {
      handleFirestoreError(err, editingActivity ? OperationType.UPDATE : OperationType.CREATE, 'master_activities');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    try {
      await deleteDoc(doc(db, 'master_activities', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'master_activities');
    }
  };

  const openEditModal = (activity: MasterActivity) => {
    setEditingActivity(activity);
    setFormData({
      type: activity.type || 'sport',
      name: activity.name || '',
      points: activity.points || 0,
      description: activity.description || '',
      videoUrl: activity.videoUrl || '',
      difficulty: activity.difficulty || 'Beginner',
      ageGroup: activity.ageGroup || 'All Ages'
    });
    setIsModalOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exercise': return <Dumbbell className="text-blue-500" />;
      case 'sport': return <Trophy className="text-amber-500" />;
      case 'habit': return <Heart className="text-rose-500" />;
      default: return <Activity className="text-slate-500" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-6xl mx-auto pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activity Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Add, edit, or delete activities and set points limits.</p>
        </div>
        <button 
          onClick={() => {
            setEditingActivity(null);
            setFormData({ type: 'sport', name: '', points: 100, description: '', videoUrl: '', difficulty: 'Beginner', ageGroup: 'All Ages' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
        >
          <Plus size={18} />
          Add Activity
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['sport', 'exercise', 'habit'].map(type => (
          <div key={type} className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 capitalize flex items-center gap-2">
              {getTypeIcon(type)}
              {type}s
            </h2>
            <div className="space-y-3">
              {activities.filter(a => a.type === type).map(activity => (
                <div key={activity.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center group">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{activity.name}</p>
                    <p className="text-xs text-blue-600 font-bold">{activity.points} pts</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(activity)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(activity.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {activities.filter(a => a.type === type).length === 0 && (
                <p className="text-sm text-slate-400 italic p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">No {type}s added yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingActivity ? 'Edit Activity' : 'Add New Activity'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    >
                      <option value="sport">Sport</option>
                      <option value="exercise">Exercise</option>
                      <option value="habit">Habit</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Points</label>
                    <input 
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({...formData, points: Number(e.target.value)})}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Football, Pushups, Drink Water"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>

                {formData.type === 'exercise' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                      <textarea 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white h-24"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Video URL (Embed)</label>
                      <input 
                        type="text"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                        placeholder="https://www.youtube.com/embed/..."
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Difficulty</label>
                        <select 
                          value={formData.difficulty}
                          onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Age Group</label>
                        <input 
                          type="text"
                          value={formData.ageGroup}
                          onChange={(e) => setFormData({...formData, ageGroup: e.target.value})}
                          placeholder="e.g. All Ages, 12-15"
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                      </div>
                    </div>
                  </>
                )}

                <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none">
                  {editingActivity ? 'Update Activity' : 'Add Activity'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

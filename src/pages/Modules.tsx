import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, orderBy, getDocs } from '../firebase';
import { 
  ExternalLink, 
  BookOpen, 
  Layout
} from 'lucide-react';
import { Module } from '../types';

export default function Modules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = async () => {
    try {
      const q = query(collection(db, 'modules'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setModules(data as any);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Learning Modules</h1>
          <p className="text-slate-500 dark:text-slate-400">Explore educational content</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {modules.map((module) => (
          <motion.div 
            layout
            key={module.id}
            className="bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm group"
          >
            <div className="h-48 overflow-hidden relative">
              <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                {module.category}
              </div>
            </div>
            <div className="p-6">
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">{module.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed line-clamp-2">{module.description}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => module.link && window.open(module.link, '_blank')}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} />
                  View
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {!loading && modules.length === 0 && (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-700">
          <BookOpen size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No modules available</h3>
          <p className="text-slate-500 dark:text-slate-400">Check back later for new educational content.</p>
        </div>
      )}
    </div>
  );
}

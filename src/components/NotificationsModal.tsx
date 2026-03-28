import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import { db, onSnapshot, collection, query, where, or, and, orderBy, limit } from '../firebase';
import { useAuth } from '../App';
import { Notification } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function NotificationsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user || !isOpen) return;

    const q = query(
      collection(db, 'notifications'),
      or(
        where('targetType', '==', 'all'),
        and(where('targetType', '==', 'class'), where('targetId', '==', user.class || '')),
        and(where('targetType', '==', 'user'), where('targetId', '==', user.id))
      ),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(newNotifications);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-blue-500" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Notifications</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-2 flex-1">
          {notifications.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full">
              <Bell size={48} className="text-slate-200 dark:text-slate-700 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No new notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <div key={n.id} className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-2 font-medium">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

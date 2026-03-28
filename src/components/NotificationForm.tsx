import React, { useState } from 'react';
import { db, addDoc, collection, serverTimestamp } from '../firebase';
import { useAuth } from '../App';

export default function NotificationForm({ onClose }: { onClose?: () => void }) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'announcement' | 'health'>('announcement');
  const [targetType, setTargetType] = useState<'all' | 'class' | 'user'>('all');
  const [targetId, setTargetId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        message,
        type,
        targetType,
        targetId: targetType === 'all' ? null : targetId,
        createdAt: serverTimestamp()
      });
      setMessage('');
      setTargetId('');
      alert('Notification sent!');
      if (onClose) onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) return null;

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4 relative">
      {onClose && (
        <button 
          type="button"
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 dark:hover:text-white z-10"
        >
          Close
        </button>
      )}
      <h3 className="font-bold text-lg text-slate-900 dark:text-white">Create Notification</h3>
      <textarea 
        value={message} 
        onChange={e => setMessage(e.target.value)} 
        placeholder="Message" 
        className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:text-white"
        required
      />
      <select value={type} onChange={e => setType(e.target.value as any)} className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:text-white">
        <option value="announcement">Announcement</option>
        <option value="health">Health Alert</option>
      </select>
      {user.role === 'admin' && (
        <select value={targetType} onChange={e => setTargetType(e.target.value as any)} className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:text-white">
          <option value="all">All</option>
          <option value="class">Class</option>
          <option value="user">User</option>
        </select>
      )}
      {targetType !== 'all' && (
        <input 
          type="text" 
          value={targetId} 
          onChange={e => setTargetId(e.target.value)} 
          placeholder={`${targetType} ID`} 
          className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:text-white"
          required
        />
      )}
      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold">
        {loading ? 'Sending...' : 'Send Notification'}
      </button>
    </form>
  );
}

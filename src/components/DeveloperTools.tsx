import React, { useState } from 'react';
import { Code, Github, User, Database } from 'lucide-react';
import { seedDatabase } from '../firebase';

export default function DeveloperTools() {
  const [isSeeding, setIsSeeding] = useState(false);
  
  const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY;
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  const missingVars = requiredEnvVars.filter(v => !import.meta.env[v]);

  const handleReseed = async () => {
    if (!confirm('Are you sure you want to reseed the database? This will overwrite existing data.')) return;
    setIsSeeding(true);
    try {
      await seedDatabase();
      alert('Database reseeded successfully!');
    } catch (error) {
      console.error('Seeding failed:', error);
      alert('Failed to reseed database. Check console for details.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
          <User size={24} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Rameshnathan Karuvoolan</h3>
          <p className="text-xs text-slate-500">Developer</p>
        </div>
      </div>

      <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold mb-1">
          <span className="text-slate-500 uppercase tracking-wider">System Status</span>
          <div className={`w-2 h-2 rounded-full ${isFirebaseConfigured ? 'bg-emerald-500' : 'bg-red-500'}`} />
        </div>
        <p className="text-[10px] text-slate-400">
          {isFirebaseConfigured 
            ? 'Firebase is configured and ready.' 
            : `Missing: ${missingVars.join(', ')}`}
        </p>
      </div>
      
      <div className="space-y-2">
        <button 
          onClick={handleReseed}
          disabled={isSeeding}
          className="flex items-center gap-3 w-full p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-slate-700 font-medium disabled:opacity-50"
        >
          <Database size={20} />
          {isSeeding ? 'Seeding...' : 'Reseed Database'}
        </button>
        <a 
          href="https://github.com/Ramesh-Karu" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-slate-700 font-medium"
        >
          <Github size={20} />
          GitHub Profile
        </a>
      </div>
    </div>
  );
}

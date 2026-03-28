import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, auth, onAuthStateChanged, doc, onSnapshot, enableNetwork, disableNetwork, handleFirestoreError, OperationType } from '../firebase';
import { User } from '../types';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SyncContextType {
  isOnline: boolean;
  isQuotaExceeded: boolean;
  retrySync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync must be used within SyncProvider');
  return context;
};

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Automatic Network Management
  useEffect(() => {
    const manageNetwork = async () => {
      try {
        if (isQuotaExceeded) {
          if (isOnline) {
            console.log('Auto-disabling network: Quota exceeded.');
            await disableNetwork(db);
            setIsOnline(false);
          }
        } else {
          if (!isOnline && !isRetrying) {
            console.log('Auto-enabling network: Quota available.');
            await enableNetwork(db);
            setIsOnline(true);
          }
        }
      } catch (error) {
        console.error('Error managing network:', error);
      }
    };

    manageNetwork();
  }, [isQuotaExceeded, isOnline, isRetrying]);

  // Automatic Recovery Polling
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isQuotaExceeded) {
      // Attempt to recover every 60 seconds
      interval = setInterval(() => {
        console.log('Attempting automatic sync recovery...');
        retrySync();
      }, 60000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isQuotaExceeded]);

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (user: any) => {
      if (user) {
        const unsubscribe = onSnapshot(doc(db, 'users', user.uid), () => {
          // Connection successful
          setIsQuotaExceeded(false);
        }, (error) => {
          if (error.message.includes('Quota exceeded')) {
            setIsQuotaExceeded(true);
          }
        });
        return () => unsubscribe();
      }
    });

    return () => authUnsubscribe();
  }, []);

  const retrySync = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      // Temporarily enable to check if quota is restored
      await enableNetwork(db);
      // The onSnapshot listener above will catch if it's still exceeded or if it's back
      // We wait a few seconds to let the listener trigger
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error('Error during auto-recovery attempt:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <SyncContext.Provider value={{ isOnline, isQuotaExceeded, retrySync }}>
      {children}
    </SyncContext.Provider>
  );
};

export const SyncStatusIndicator: React.FC<{ inline?: boolean }> = ({ inline = false }) => {
  const { isOnline, isQuotaExceeded } = useSync();
  const [showDetails, setShowDetails] = useState(false);

  const content = (
    <div className={`${inline ? 'w-full' : 'bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-64 pointer-events-auto'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900 dark:text-white">Sync Status</h3>
        {!inline && (
          <button onClick={() => setShowDetails(false)} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Network</span>
          <span className={`text-sm font-medium ${isOnline ? 'text-green-500' : 'text-amber-500'}`}>
            {isOnline ? 'Online (Syncing)' : 'Offline (Local Only)'}
          </span>
        </div>

        {isQuotaExceeded && (
          <div className="flex flex-col gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} />
              <span className="font-bold">Quota Exceeded</span>
            </div>
            <p className="text-[10px] opacity-80">
              Firebase limits reached. Syncing will resume automatically when limits reset.
            </p>
            <div className="flex items-center gap-2 mt-1 py-1 px-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold">Auto-retrying in background...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (inline) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none">
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDetails(!showDetails)}
        className={`p-3 rounded-full shadow-lg pointer-events-auto transition-colors ${
          isOnline 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}
      >
        {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
      </motion.button>
    </div>
  );
};

const X = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

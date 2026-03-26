import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { healthyEatingTips } from '../healthyEatingTips';

const BirdToy = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: '50%', side: 'left' });
  const [showHelp, setShowHelp] = useState(false);
  const [currentTip, setCurrentTip] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track occurrences in session
  const [showCount, setShowCount] = useState(() => {
    return parseInt(sessionStorage.getItem('birdToyCount') || '0');
  });

  const scheduleAppearance = () => {
    if (showCount >= 3) return;

    // Random delay between 30s and 2 minutes for the next appearance
    const delay = Math.random() * 90000 + 30000;
    timerRef.current = setTimeout(() => {
      const newTop = `${Math.random() * 80 + 10}%`;
      const newSide = Math.random() > 0.5 ? 'left' : 'right';
      const randomTip = healthyEatingTips[Math.floor(Math.random() * healthyEatingTips.length)];
      
      setCurrentTip(randomTip);
      setPosition({ top: newTop, side: newSide });
      setIsVisible(true);
      
      const newCount = showCount + 1;
      setShowCount(newCount);
      sessionStorage.setItem('birdToyCount', newCount.toString());
      
      // Auto hide after 10 seconds
      setTimeout(() => setIsVisible(false), 10000);
      
      // Schedule next if limit not reached
      if (newCount < 3) {
        scheduleAppearance();
      }
    }, delay);
  };

  useEffect(() => {
    scheduleAppearance();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showCount]);

  const handleClick = () => {
    setShowHelp(true);
  };

  const handleOutsideClick = () => {
    setShowHelp(false);
  };

  useEffect(() => {
    if (showHelp) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showHelp]);

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ x: position.side === 'left' ? -40 : 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: position.side === 'left' ? -40 : 40, opacity: 0 }}
            className={`fixed ${position.side === 'left' ? 'left-0' : 'right-0'} z-50 flex items-center`}
            style={{ top: position.top }}
            onClick={(e) => { e.stopPropagation(); handleClick(); }}
          >
            {/* Blue Owl Toy */}
            <div className="w-10 h-10 bg-blue-500 rounded-full shadow-lg flex items-center justify-center relative border-2 border-white">
              <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-2 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm4 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
              </svg>
            </div>
            {/* Small Dot */}
            <div className="w-2 h-2 bg-red-500 rounded-full -ml-1 animate-pulse"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
            onClick={handleOutsideClick}
          >
            <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-xs text-center border-4 border-blue-100">
              <h3 className="text-lg font-bold text-blue-600 mb-2">Healthy Tip!</h3>
              <p className="text-slate-700 font-medium">{currentTip}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BirdToy;

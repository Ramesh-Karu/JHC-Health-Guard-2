import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Heart, Activity, Stethoscope, Microscope, Dna, ShieldPlus, Droplets, BicepsFlexed } from 'lucide-react';

export function AmbientBackground() {
  const icons = [Heart, Activity, Stethoscope, Microscope, Dna, ShieldPlus, Droplets, BicepsFlexed];

  const floatingIcons = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      Icon: icons[i % icons.length],
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 16 + 12, // 12px to 28px for small subtle icons
      delay: Math.random() * 5,
      yOffset: Math.random() * -60 - 30, // Float up slightly
      xOffset: Math.random() * 40 - 20, // Drift left/right slightly
      duration: Math.random() * 20 + 20, // 20s to 40s (slow)
      scaleDuration: Math.random() * 4 + 3,
      opacityMax: Math.random() * 0.15 + 0.1, // 0.1 to 0.25 visibility
    }));
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden" 
      style={{ 
        zIndex: -1,
        maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 80px, black 160px, black 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 80px, black 160px, black 100%)'
      }}
    >
      {floatingIcons.map((item) => (
        <motion.div
          key={item.id}
          className="absolute text-blue-500 dark:text-blue-400"
          style={{
            left: item.left,
            top: item.top,
            filter: 'blur(1px) drop-shadow(0 0 10px rgba(59, 130, 246, 0.3))'
          }}
          initial={{ 
            opacity: 0, 
            y: 0, 
            x: 0,
            scale: 0.8
          }}
          animate={{
            opacity: [0, item.opacityMax, 0],
            y: [0, item.yOffset],
            x: [0, item.xOffset],
            scale: [0.8, 1.1, 0.8]
          }}
          transition={{
            opacity: {
              duration: item.scaleDuration,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: item.delay,
              ease: "easeInOut"
            },
            y: {
              duration: item.duration,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: "easeInOut",
              delay: item.delay
            },
            x: {
              duration: item.duration * 1.2,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: "easeInOut",
              delay: item.delay
            },
            scale: {
               duration: item.scaleDuration * 1.5,
               repeat: Infinity,
               repeatType: 'reverse',
               delay: item.delay,
               ease: "easeInOut"
            }
          }}
        >
          <item.Icon size={item.size} />
        </motion.div>
      ))}
    </div>
  );
}

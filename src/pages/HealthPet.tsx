import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../App';
import { Heart, Zap, Coffee, Activity, ArrowLeft, Moon, Sun, Sparkles, ShieldCheck, Brain, X, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { flashcards, Flashcard } from '../data/flashcards';

interface PetState {
  hunger: number;
  happiness: number;
  energy: number;
  health: number;
  level: number;
  experience: number;
  upgradePoints: number;
  lastUpdated: string;
  cardsAnsweredToday?: number;
  lastCardDate?: string;
}

interface FloatingText {
  id: number;
  text: string;
  color: string;
}

export default function HealthPet() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pet, setPet] = useState<PetState | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = tomorrow.getTime() - now.getTime();
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = () => {
    try {
      const storageKey = `health_pet_${user!.id}`;
      const savedPet = localStorage.getItem(storageKey);
      
      const now = new Date();
      
      if (savedPet) {
        const data = JSON.parse(savedPet) as PetState;
        const lastUpdated = new Date(data.lastUpdated);
        const lastCardDate = data.lastCardDate ? new Date(data.lastCardDate) : new Date(0);
        
        const isSameDay = lastCardDate.getDate() === now.getDate() && 
                          lastCardDate.getMonth() === now.getMonth() && 
                          lastCardDate.getFullYear() === now.getFullYear();
        
        const cardsAnsweredToday = isSameDay ? (data.cardsAnsweredToday || 0) : 0;
        const upgradePoints = data.upgradePoints || 0;

        const hoursPassed = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60));
        
        if (hoursPassed > 0 || !isSameDay) {
          const newHunger = Math.max(0, data.hunger - (hoursPassed * 2));
          const newHappiness = Math.max(0, data.happiness - (hoursPassed * 2));
          const newEnergy = Math.min(100, data.energy + (hoursPassed * 5));
          const newHealth = (newHunger === 0 || newHappiness === 0) ? Math.max(0, data.health - hoursPassed) : data.health;
          
          const updatedPet = {
            ...data,
            hunger: newHunger,
            happiness: newHappiness,
            energy: newEnergy,
            health: newHealth,
            cardsAnsweredToday,
            upgradePoints,
            lastUpdated: now.toISOString()
          };
          
          localStorage.setItem(storageKey, JSON.stringify(updatedPet));
          setPet(updatedPet);
        } else {
          setPet({ ...data, cardsAnsweredToday, upgradePoints });
        }
      } else {
        const newPet: PetState = {
          hunger: 50,
          happiness: 50,
          energy: 100,
          health: 100,
          level: 1,
          experience: 0,
          upgradePoints: 0,
          cardsAnsweredToday: 0,
          lastCardDate: now.toISOString(),
          lastUpdated: now.toISOString()
        };
        localStorage.setItem(storageKey, JSON.stringify(newPet));
        setPet(newPet);
      }
    } catch (error) {
      console.error("Error loading pet from local storage:", error);
      setToast({ message: 'Failed to load pet data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const addFloatingText = (text: string, color: string) => {
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, text, color }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
    }, 1500);
  };

  const updatePetState = (updates: Partial<PetState>) => {
    if (!pet || !user) return;

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);

    try {
      let newExp = (pet.experience || 0) + (updates.experience || 0);
      if (newExp < 0) newExp = 0;
      
      let newLevel = pet.level;
      let expRemainder = newExp;
      
      const expNeeded = newLevel * 1000;
      if (newExp >= expNeeded) {
        newLevel += 1;
        expRemainder = newExp - expNeeded;
        setToast({ message: `Level Up! Your pet is now level ${newLevel}!`, type: 'success' });
        addFloatingText('LEVEL UP!', 'text-emerald-500');
      }

      const newState: PetState = {
        ...pet,
        ...updates,
        hunger: Math.min(100, Math.max(0, updates.hunger ?? pet.hunger)),
        happiness: Math.min(100, Math.max(0, updates.happiness ?? pet.happiness)),
        energy: Math.min(100, Math.max(0, updates.energy ?? pet.energy)),
        health: Math.min(100, Math.max(0, updates.health ?? pet.health)),
        level: newLevel,
        experience: expRemainder,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(`health_pet_${user.id}`, JSON.stringify(newState));
      setPet(newState);
    } catch (error) {
      console.error("Error saving pet to local storage:", error);
      setToast({ message: 'Failed to save pet data.', type: 'error' });
    }
  };

  const calculateXp = (currentHealth: number) => {
    return Math.floor(100 + (currentHealth / 100) * 100);
  };

  const handleFeed = () => {
    if (isSleeping) return;
    if (pet?.hunger === 100) {
      setToast({ message: 'Your pet is already full!', type: 'error' });
      return;
    }
    
    const xpLoss = 50; // Cost to feed
    if (pet!.experience < xpLoss) {
      setToast({ message: 'Not enough XP! Take a quiz to earn more.', type: 'error' });
      return;
    }

    addFloatingText('+30 Food', 'text-orange-500');
    addFloatingText(`-${xpLoss} XP`, 'text-rose-500');
    
    updatePetState({ 
      hunger: pet!.hunger + 30, 
      health: pet!.health + 5, 
      experience: -xpLoss 
    });
  };

  const handlePlay = () => {
    if (isSleeping) return;
    if (pet?.energy < 20) {
      setToast({ message: 'Your pet is too tired to play!', type: 'error' });
      return;
    }
    
    const xpLoss = 30; // Cost to play
    if (pet!.experience < xpLoss) {
      setToast({ message: 'Not enough XP! Take a quiz to earn more.', type: 'error' });
      return;
    }

    addFloatingText('+30 Happy', 'text-pink-500');
    addFloatingText(`-${xpLoss} XP`, 'text-rose-500');
    
    updatePetState({ 
      happiness: pet!.happiness + 30, 
      energy: pet!.energy - 20, 
      experience: -xpLoss 
    });
  };

  const handleSleep = () => {
    if (isSleeping) return;
    if (pet?.energy === 100) {
      setToast({ message: 'Your pet is not tired!', type: 'error' });
      return;
    }

    const xpLoss = 20; // Cost to sleep
    if (pet!.experience < xpLoss) {
      setToast({ message: 'Not enough XP! Take a quiz to earn more.', type: 'error' });
      return;
    }

    setIsSleeping(true);
    addFloatingText('Zzz...', 'text-blue-400');
    addFloatingText(`-${xpLoss} XP`, 'text-rose-500');
    
    setTimeout(() => {
      updatePetState({ 
        energy: 100, 
        hunger: Math.max(0, pet!.hunger - 10),
        experience: -xpLoss
      });
      setIsSleeping(false);
      addFloatingText('Woke up!', 'text-amber-500');
    }, 3000);
  };

  const handleUpgrade = async () => {
    if (!pet || pet.upgradePoints < 100) {
      setToast({ message: 'Need 100 upgrade points!', type: 'error' });
      return;
    }
    
    updatePetState({ 
      upgradePoints: pet.upgradePoints - 100,
      level: pet.level + 1
    });
    setToast({ message: 'Companion upgraded!', type: 'success' });
  };

  const handleOpenQuiz = () => {
    if (isSleeping) return;
    if ((pet?.cardsAnsweredToday || 0) >= 10) {
      setToast({ message: 'Daily limit reached! Come back tomorrow.', type: 'error' });
      return;
    }
    const randomCard = flashcards[Math.floor(Math.random() * flashcards.length)];
    setCurrentCard(randomCard);
    setSelectedOption(null);
    setIsAnswered(false);
    setShowQuiz(true);
  };

  const handleAnswer = (index: number) => {
    if (isAnswered || !currentCard) return;
    
    setSelectedOption(index);
    setIsAnswered(true);
    
    const isCorrect = index === currentCard.correctIndex;
    const cardsAnswered = (pet?.cardsAnsweredToday || 0) + 1;
    
    if (isCorrect) {
      const xpGain = calculateXp(pet!.health) * 2; // Double XP for quiz
      addFloatingText('+10 Health', 'text-emerald-500');
      addFloatingText(`+${xpGain} XP`, 'text-indigo-500');
      addFloatingText('+10 Upgrade Pts', 'text-amber-500');
      
      updatePetState({
        health: pet!.health + 10,
        happiness: pet!.happiness + 10,
        experience: xpGain,
        upgradePoints: (pet!.upgradePoints || 0) + 10,
        cardsAnsweredToday: cardsAnswered,
        lastCardDate: new Date().toISOString()
      });
    } else {
      addFloatingText('+10 XP', 'text-indigo-500');
      updatePetState({
        experience: 10,
        cardsAnsweredToday: cardsAnswered,
        lastCardDate: new Date().toISOString()
      });
    }
  };

  const handleNextCard = () => {
    if ((pet?.cardsAnsweredToday || 0) >= 10) {
      setShowQuiz(false);
      return;
    }
    const randomCard = flashcards[Math.floor(Math.random() * flashcards.length)];
    setCurrentCard(randomCard);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const getPetEmoji = () => {
    if (!pet) return '🥚';
    if (pet.health === 0) return '👻';
    if (pet.level === 1) return '🥚';
    if (pet.level === 2) return '🐣';
    if (pet.level === 3) return '🐥';
    if (pet.level === 4) return '🐔';
    return '🦅';
  };

  const getStatusColor = (value: number) => {
    if (value > 60) return 'bg-emerald-500';
    if (value > 30) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getTextColor = (value: number) => {
    if (value > 60) return 'text-emerald-500';
    if (value > 30) return 'text-amber-500';
    return 'text-rose-500';
  };

  const ProgressBar = ({ label, value, colorClass, textColorClass, icon: Icon }: { label: string, value: number, colorClass: string, textColorClass: string, icon: any }) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-300">
        <span className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 ${textColorClass}`}>
            <Icon size={14} />
          </div>
          {label}
        </span>
        <span className="font-semibold">{Math.round(value)}%</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full rounded-full ${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', bounce: 0, duration: 0.8 }}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading Companion...</p>
        </div>
      </div>
    );
  }

  const expNeeded = pet ? pet.level * 1000 : 1000;
  const expPercentage = pet ? (pet.experience / expNeeded) * 100 : 0;

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 space-y-8 pb-24 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/others')} 
          className="p-2.5 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-100 dark:border-slate-800 hover:scale-105 transition-transform"
        >
          <ArrowLeft size={20} className="text-slate-700 dark:text-slate-300" />
        </button>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
          <Sparkles size={16} className="text-indigo-500" />
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">Level {pet?.level}</span>
          <span className="text-slate-300">|</span>
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{pet?.upgradePoints || 0} Pts</span>
          <button 
            onClick={handleUpgrade}
            disabled={!pet || pet.upgradePoints < 100}
            className="ml-2 px-3 py-1 bg-indigo-500 text-white rounded-full text-xs font-bold hover:bg-indigo-600 disabled:opacity-50"
          >
            Upgrade
          </button>
        </div>
      </div>

      {/* Main Pet Display - High UI Glassmorphism */}
      <div className="relative h-80 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-200/40 dark:shadow-none border border-white/50 dark:border-slate-800 flex flex-col items-center justify-center">
        
        {/* Dynamic Modern Background */}
        <AnimatePresence>
          {isSleeping ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900 flex items-center justify-center"
            >
              <div className="absolute w-full h-full bg-gradient-to-b from-indigo-900/50 to-slate-900"></div>
              <div className="absolute w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]"></div>
              <Moon className="absolute top-8 right-8 text-indigo-200 opacity-80" size={32} />
              {/* Modern subtle stars */}
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 flex items-center justify-center"
            >
              <div className="absolute w-72 h-72 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-[80px] -top-10 -right-10"></div>
              <div className="absolute w-64 h-64 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-[80px] -bottom-10 -left-10"></div>
              <Sun className="absolute top-8 right-8 text-amber-400 opacity-80" size={36} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Pet Character */}
        <div className="relative z-10 flex flex-col items-center">
           <motion.div 
             animate={
               isSleeping ? { y: [0, 4, 0], scale: [1, 1.02, 1] } :
               isAnimating ? { scale: [1, 1.15, 0.95, 1.05, 1], rotate: [0, -8, 8, -4, 0] } : 
               { y: [0, -8, 0] }
             }
             transition={
               isSleeping ? { repeat: Infinity, duration: 4, ease: "easeInOut" } :
               isAnimating ? { duration: 0.5 } : 
               { repeat: Infinity, duration: 3, ease: "easeInOut" }
             }
             className="text-9xl filter drop-shadow-2xl"
           >
             {getPetEmoji()}
           </motion.div>
           {/* Soft Elegant Shadow */}
           <motion.div 
             animate={isSleeping ? { scale: [1, 1.05, 1], opacity: [0.15, 0.2, 0.15] } : { scale: [1, 0.9, 1], opacity: [0.15, 0.1, 0.15] }}
             transition={{ repeat: Infinity, duration: isSleeping ? 4 : 3, ease: "easeInOut" }}
             className="w-24 h-3 bg-slate-400 dark:bg-black/60 rounded-[100%] mt-6 filter blur-md"
           />
        </div>

        {/* Sleeping Zzzs */}
        <AnimatePresence>
          {isSleeping && (
            <motion.div 
              initial={{ opacity: 0, y: 0, x: 0 }}
              animate={{ opacity: [0, 1, 0], y: -50, x: 20 }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute top-1/3 right-1/3 font-medium text-xl text-indigo-300/80 z-20"
            >
              Zzz
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Texts */}
        <AnimatePresence>
          {floatingTexts.map(ft => (
            <motion.div 
              key={ft.id} 
              initial={{opacity: 1, y: 0, scale: 0.9}} 
              animate={{opacity: 0, y: -60, scale: 1}} 
              exit={{opacity: 0}} 
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-lg drop-shadow-sm z-30 ${ft.color}`}
            >
              {ft.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Experience Bar - Sleek */}
      <div className="px-2">
        <div className="flex justify-between text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
          <span>Experience</span>
          <span>{pet?.experience} / {expNeeded}</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${expPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          />
        </div>
      </div>

      {/* Stats Grid - Modern Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <ProgressBar label="Health" value={pet?.health || 0} colorClass={getStatusColor(pet?.health || 0)} textColorClass={getTextColor(pet?.health || 0)} icon={Heart} />
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <ProgressBar label="Hunger" value={pet?.hunger || 0} colorClass={getStatusColor(pet?.hunger || 0)} textColorClass={getTextColor(pet?.hunger || 0)} icon={Coffee} />
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <ProgressBar label="Happiness" value={pet?.happiness || 0} colorClass={getStatusColor(pet?.happiness || 0)} textColorClass={getTextColor(pet?.happiness || 0)} icon={Activity} />
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <ProgressBar label="Energy" value={pet?.energy || 0} colorClass={getStatusColor(pet?.energy || 0)} textColorClass={getTextColor(pet?.energy || 0)} icon={Zap} />
        </div>
      </div>

      {/* Action Buttons - High UI */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={handleFeed}
          disabled={!pet || pet.health === 0 || isSleeping}
          className="relative overflow-hidden flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent dark:from-orange-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-3 text-orange-500 relative z-10">
            <Coffee size={22} />
          </div>
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 relative z-10">Feed</span>
          <span className="text-[10px] font-bold text-rose-500 relative z-10">-50 XP</span>
        </button>
        
        <button 
          onClick={handlePlay}
          disabled={!pet || pet.health === 0 || isSleeping}
          className="relative overflow-hidden flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-transparent dark:from-pink-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center mb-3 text-pink-500 relative z-10">
            <Activity size={22} />
          </div>
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 relative z-10">Play</span>
          <span className="text-[10px] font-bold text-rose-500 relative z-10">-30 XP</span>
        </button>

        <button 
          onClick={handleSleep}
          disabled={!pet || pet.health === 0 || isSleeping}
          className="relative overflow-hidden flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3 text-blue-500 relative z-10">
            <Moon size={22} />
          </div>
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 relative z-10">Sleep</span>
          <span className="text-[10px] font-bold text-rose-500 relative z-10">-20 XP</span>
        </button>

        <button 
          onClick={handleOpenQuiz}
          disabled={!pet || pet.health === 0 || isSleeping || (pet?.cardsAnsweredToday || 0) >= 10}
          className="relative overflow-hidden flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-3 text-emerald-500 relative z-10">
            <Brain size={22} />
          </div>
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 relative z-10">Quiz</span>
          {(pet?.cardsAnsweredToday || 0) >= 10 && (
            <span className="text-xs text-slate-400 mt-1">{timeLeft}</span>
          )}
        </button>
      </div>
      
      {/* Info Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-5 rounded-3xl text-sm text-indigo-800 dark:text-indigo-200 border border-indigo-100/50 dark:border-indigo-800/30 shadow-sm flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Keep your companion healthy! The healthier your pet is, the more XP you earn when interacting with it. Answer daily health quizzes to earn double XP!
        </p>
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && currentCard && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                  <Brain className="w-5 h-5" />
                  <span>Health Quiz ({pet?.cardsAnsweredToday || 0}/10)</span>
                </div>
                <button 
                  onClick={() => setShowQuiz(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-6">
                  {currentCard.question}
                </h3>
                
                <div className="space-y-3">
                  {currentCard.options.map((option, index) => {
                    let buttonClass = "w-full text-left p-4 rounded-2xl border transition-all duration-200 ";
                    let icon = null;
                    
                    if (!isAnswered) {
                      buttonClass += "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300";
                    } else {
                      if (index === currentCard.correctIndex) {
                        buttonClass += "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300";
                        icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
                      } else if (index === selectedOption) {
                        buttonClass += "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300";
                        icon = <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
                      } else {
                        buttonClass += "border-slate-200 dark:border-slate-700 opacity-50 text-slate-500 dark:text-slate-400";
                      }
                    }
                    
                    return (
                      <button
                        key={index}
                        disabled={isAnswered}
                        onClick={() => handleAnswer(index)}
                        className={buttonClass + " flex justify-between items-center gap-3"}
                      >
                        <span>{option}</span>
                        {icon}
                      </button>
                    );
                  })}
                </div>
                
                {isAnswered && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800"
                  >
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      <span className="font-semibold block mb-1">Explanation:</span>
                      {currentCard.explanation}
                    </p>
                    
                    <button
                      onClick={handleNextCard}
                      className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
                    >
                      {(pet?.cardsAnsweredToday || 0) >= 10 ? 'Finish for Today' : 'Next Question'}
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

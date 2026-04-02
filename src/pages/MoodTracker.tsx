import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smile, 
  Meh, 
  Frown, 
  CloudRain, 
  Sun, 
  TrendingUp, 
  Calendar, 
  Activity, 
  Brain, 
  ChevronLeft,
  Plus,
  History,
  Info,
  BarChart3,
  MessageSquare,
  Zap,
  Coffee,
  Moon,
  Dumbbell,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

interface MoodEntry {
  id: string;
  timestamp: number;
  score: number; // 1-10
  label: string;
  note: string;
  activities: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

const MOOD_OPTIONS = [
  { score: 10, label: 'Radiant', icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { score: 8, label: 'Happy', icon: Smile, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { score: 6, label: 'Good', icon: Meh, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { score: 4, label: 'Tired', icon: CloudRain, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { score: 2, label: 'Sad', icon: Frown, color: 'text-rose-400', bg: 'bg-rose-400/10' },
];

const ACTIVITIES = [
  { id: 'exercise', label: 'Exercise', icon: Dumbbell },
  { id: 'sleep', label: 'Good Sleep', icon: Moon },
  { id: 'diet', label: 'Healthy Diet', icon: Coffee },
  { id: 'social', label: 'Socializing', icon: MessageSquare },
  { id: 'work', label: 'Productive', icon: Zap },
];

export default function MoodTracker() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [currentMood, setCurrentMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('wellness_mood_entries');
    if (saved) {
      setEntries(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage whenever entries change
  useEffect(() => {
    localStorage.setItem('wellness_mood_entries', JSON.stringify(entries));
  }, [entries]);

  const analyzeSentiment = (text: string): 'positive' | 'neutral' | 'negative' => {
    const positiveWords = ['happy', 'great', 'good', 'amazing', 'productive', 'excited', 'love', 'wonderful'];
    const negativeWords = ['sad', 'bad', 'tired', 'stressed', 'angry', 'frustrated', 'terrible', 'worst'];
    
    const words = text.toLowerCase().split(/\W+/);
    let score = 0;
    words.forEach(word => {
      if (positiveWords.includes(word)) score++;
      if (negativeWords.includes(word)) score--;
    });

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  };

  const handleAddEntry = () => {
    if (currentMood === null) return;

    const moodOption = MOOD_OPTIONS.find(m => m.score === currentMood);
    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      score: currentMood,
      label: moodOption?.label || 'Unknown',
      note,
      activities: selectedActivities,
      sentiment: analyzeSentiment(note)
    };

    setEntries([newEntry, ...entries]);
    setCurrentMood(null);
    setNote('');
    setSelectedActivities([]);
  };

  const chartData = useMemo(() => {
    return [...entries]
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(e => ({
        time: new Date(e.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        score: e.score,
        fullDate: new Date(e.timestamp).toLocaleString()
      }));
  }, [entries]);

  const averageMood = useMemo(() => {
    if (entries.length === 0) return 0;
    return (entries.reduce((acc, curr) => acc + curr.score, 0) / entries.length).toFixed(1);
  }, [entries]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl relative">
      {/* Header */}
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 rounded-t-3xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/others')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ChevronLeft className="text-slate-600 dark:text-slate-400" />
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="text-blue-500" size={20} />
            Mood Tracker
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column: Input */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Mood Input Card */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Activity className="text-blue-500" size={20} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Daily Check-in</h2>
              </div>
              
              <div className="grid grid-cols-5 gap-2 md:gap-4 mb-10">
                {MOOD_OPTIONS.map((mood) => (
                  <button
                    key={mood.score}
                    onClick={() => setCurrentMood(mood.score)}
                    className={`flex flex-col items-center gap-2 transition-all duration-300 group ${
                      currentMood === mood.score ? 'scale-105' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${
                      currentMood === mood.score 
                        ? `${mood.bg} ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900` 
                        : 'bg-slate-50 dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700'
                    }`}>
                      <mood.icon className={currentMood === mood.score ? mood.color : 'text-slate-400'} size={28} />
                    </div>
                    <span className={`text-[10px] md:text-xs font-bold ${currentMood === mood.score ? 'text-blue-500' : 'text-slate-500'}`}>
                      {mood.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">What have you been doing?</label>
                  <div className="flex flex-wrap gap-2">
                    {ACTIVITIES.map((activity) => (
                      <button
                        key={activity.id}
                        onClick={() => {
                          setSelectedActivities(prev => 
                            prev.includes(activity.id) 
                              ? prev.filter(a => a !== activity.id)
                              : [...prev, activity.id]
                          );
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          selectedActivities.includes(activity.id)
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 dark:shadow-none'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <activity.icon size={16} />
                        {activity.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <MessageSquare size={16} />
                    Journal Note (Advanced Sentiment Analysis)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Describe your thoughts..."
                    className="w-full h-32 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  />
                </div>

                <button
                  onClick={handleAddEntry}
                  disabled={currentMood === null}
                  className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Log Mood Data
                </button>
              </div>
            </section>

            {/* Analytics Chart */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="text-blue-500" />
                  Mood Trends
                </h2>
                <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-500">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  Sentiment Score
                </div>
              </div>

              <div className="h-64 w-full">
                {entries.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="time" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                      />
                      <YAxis 
                        domain={[0, 10]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: 'none', 
                          borderRadius: '12px',
                          color: '#fff'
                        }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorScore)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                    <BarChart3 size={48} className="opacity-20" />
                    <p className="text-sm font-medium">Log at least 2 entries to see trends</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Stats & History */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <section className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 dark:shadow-none">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Activity size={20} />
                </div>
                <h3 className="font-bold">Wellness Index</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Average Mood</p>
                  <p className="text-4xl font-black">{averageMood}<span className="text-lg text-blue-200 font-bold">/10</span></p>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-2">Total Insights</p>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-blue-600 flex items-center justify-center text-[10px] font-bold">
                          {i}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-bold">{entries.length} Logs</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent History */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History size={18} className="text-blue-500" />
                  Recent Logs
                </h3>
              </div>

              <div className="space-y-4">
                {entries.slice(0, 5).map((entry) => {
                  const MoodIcon = MOOD_OPTIONS.find(m => m.score === entry.score)?.icon || Meh;
                  const moodColor = MOOD_OPTIONS.find(m => m.score === entry.score)?.color || 'text-slate-400';
                  
                  return (
                    <div key={entry.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MoodIcon className={moodColor} size={18} />
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{entry.label}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {entry.note && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2 italic">"{entry.note}"</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {entry.activities.map(a => (
                          <span key={a} className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-bold">
                            {a}
                          </span>
                        ))}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          entry.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-600' :
                          entry.sentiment === 'negative' ? 'bg-rose-100 text-rose-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {entry.sentiment.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {entries.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-400 font-medium italic">No logs yet today</p>
                  </div>
                )}

                {entries.length > 5 && (
                  <button className="w-full py-2 text-sm font-bold text-blue-500 hover:text-blue-600 transition-colors">
                    View Full History
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Data Privacy Notice */}
        <div className="mt-12 p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="text-blue-500" size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Privacy & Data Safety</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              All your mood data is stored <span className="font-bold text-blue-500">locally on your device</span> to protect your privacy and safety. 
              Please note that if the app is deleted, or the cache/data of the app is cleared through system settings, all your recorded history will be permanently erased.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

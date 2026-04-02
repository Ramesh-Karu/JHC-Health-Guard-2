import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { 
  Camera as CameraIcon, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  ChevronRight,
  Timer,
  Volume2,
  VolumeX,
  History,
  Save,
  Sparkles,
  Play,
  Square,
  Maximize,
  Minimize
} from 'lucide-react';
import { takePhoto, isNative } from '../lib/capacitorCamera';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from '../firebase';
import { getPostureInsights } from '../services/aiService';

interface PostureMetrics {
  neckAngle: number;
  shoulderTilt: number;
  slouchScore: number;
  overallScore: number;
}

interface PostureIssue {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  exercises: string[];
}

interface ScanHistory {
  id: string;
  date: any;
  overallScore: number;
  aiCoachSummary?: string;
}

export default function PostureScanner() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [feedback, setFeedback] = useState('Position yourself in the frame');
  const [metrics, setMetrics] = useState<PostureMetrics>({ neckAngle: 0, shoulderTilt: 0, slouchScore: 0, overallScore: 0 });
  const [status, setStatus] = useState<'Good' | 'Moderate' | 'Needs Improvement'>('Good');
  const [isPhotoMode, setIsPhotoMode] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [detectedIssues, setDetectedIssues] = useState<PostureIssue[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [showFloatingInsight, setShowFloatingInsight] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Session Mode State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionAverageScore, setSessionAverageScore] = useState(0);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const lastAlertTime = useRef(0);

  const poseRef = useRef<Pose | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Load History
  useEffect(() => {
    const fetchHistory = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, 'posture_scans'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('date', 'desc'),
          limit(5)
        );
        const snapshot = await getDocs(q);
        const historyData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ScanHistory[];
        setHistory(historyData);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };
    fetchHistory();
  }, []);

  // Session Timer
  useEffect(() => {
    let interval: any;
    if (isSessionActive) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  const speak = useCallback((text: string) => {
    if (!isAudioEnabled) return;
    const now = Date.now();
    if (now - lastAlertTime.current < 10000) return; // Limit alerts to every 10 seconds

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
    lastAlertTime.current = now;
  }, [isAudioEnabled]);

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      if (poseRef.current) {
        const p = poseRef.current;
        poseRef.current = null;
        p.close().catch(err => console.error("Pose cleanup error:", err));
      }
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    let isProcessing = false;
    let isDestroyed = false;

    const initPose = async () => {
      if (poseRef.current) {
        // If already initialized, just start the loop
        startLoop();
        return;
      }

      try {
        const pose = new Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults((results) => {
          if (isDestroyed || !isMountedRef.current || !canvasRef.current) return;
          
          const canvasCtx = canvasRef.current.getContext('2d');
          if (!canvasCtx) return;

          const width = canvasRef.current.width;
          const height = canvasRef.current.height;

          canvasCtx.clearRect(0, 0, width, height);
          
          if (results.poseLandmarks) {
            drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: 'rgba(255, 255, 255, 0.2)', lineWidth: 2 });
            drawPostureOverlay(canvasCtx, results.poseLandmarks);
            analyzePosture(results.poseLandmarks);
          }
        });

        if (!isDestroyed) {
          poseRef.current = pose;
          startLoop();
        } else {
          pose.close();
        }
      } catch (err) {
        console.error("Pose initialization error:", err);
      }
    };

    const startLoop = () => {
      const loop = async () => {
        if (isDestroyed || !isMountedRef.current || isPhotoMode) return;

        if (webcamRef.current?.video && webcamRef.current.video.readyState === 4 && !isProcessing) {
          isProcessing = true;
          try {
            if (poseRef.current) {
              await poseRef.current.send({ image: webcamRef.current.video });
            }
          } catch (err) {
            // Only log if not aborted/destroyed
            if (!isDestroyed) console.error("Pose send error:", err);
          } finally {
            isProcessing = false;
          }
        }
        
        if (!isDestroyed && !isPhotoMode) {
          animationFrameRef.current = requestAnimationFrame(loop);
        }
      };
      loop();
    };

    initPose();

    return () => {
      isDestroyed = true;
      isMountedRef.current = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      // We don't necessarily want to close the pose on every re-render if it's stable
      // But if facingMode changes, we might need a fresh start or just let it be
    };
  }, [isPhotoMode, photoUrl, facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setFeedback('Switching camera...');
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const drawPostureOverlay = (ctx: CanvasRenderingContext2D, landmarks: any) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    const getPoint = (idx: number) => ({
      x: landmarks[idx].x * width,
      y: landmarks[idx].y * height
    });

    const leftShoulder = getPoint(11);
    const rightShoulder = getPoint(12);
    const nose = getPoint(0);
    const leftEar = getPoint(7);
    const rightEar = getPoint(8);

    // 1. Draw Shoulder Line
    ctx.beginPath();
    ctx.moveTo(leftShoulder.x, leftShoulder.y);
    ctx.lineTo(rightShoulder.x, rightShoulder.y);
    ctx.strokeStyle = Math.abs(leftShoulder.y - rightShoulder.y) < 20 ? '#10b981' : '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 2. Draw Neck/Head Alignment
    const midShoulder = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
    ctx.beginPath();
    ctx.moveTo(midShoulder.x, midShoulder.y);
    ctx.lineTo(nose.x, nose.y);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#3b82f6';
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw circles at key points
    [leftShoulder, rightShoulder, nose].forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  const calculateAngle = (p1: any, p2: any, p3: any) => {
    const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const analyzePosture = (landmarks: any) => {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    const nose = landmarks[0];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    // 1. Shoulder Tilt (Symmetry)
    const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y) * 100;
    
    // 2. Forward Head Posture (Angle between ear and shoulder)
    // Using a vertical reference for the neck angle
    const midShoulder = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
    const midEar = { x: (leftEar.x + rightEar.x) / 2, y: (leftEar.y + rightEar.y) / 2 };
    
    // Angle relative to vertical
    const neckAngle = Math.abs(Math.atan2(midEar.x - midShoulder.x, midEar.y - midShoulder.y) * 180 / Math.PI);

    // 3. Slouching (Distance between shoulders and hips)
    const shoulderHeight = (leftShoulder.y + rightShoulder.y) / 2;
    const hipHeight = (leftHip.y + rightHip.y) / 2;
    const torsoHeight = hipHeight - shoulderHeight;
    const slouchScore = torsoHeight < 0.3 ? (0.3 - torsoHeight) * 500 : 0;

    const newOverallScore = Math.max(0, 100 - (shoulderTilt * 2) - (neckAngle * 1.5) - slouchScore);
    
    setMetrics({
      neckAngle: Math.round(neckAngle),
      shoulderTilt: Math.round(shoulderTilt),
      slouchScore: Math.round(slouchScore),
      overallScore: Math.round(newOverallScore)
    });

    if (isSessionActive) {
      setSessionScores(prev => [...prev, newOverallScore]);
    }

    // Determine Issues
    const issues: PostureIssue[] = [];
    if (neckAngle > 15) {
      issues.push({
        id: 'fhp',
        title: 'Forward Head Posture',
        description: 'Your head is leaning forward, putting strain on your neck.',
        severity: neckAngle > 25 ? 'high' : 'medium',
        exercises: ['Chin Tucks (3 sets of 10)', 'Neck Stretches', 'Chest Opener']
      });
      if (neckAngle > 25) speak("Please tuck your chin in");
    }
    if (shoulderTilt > 5) {
      issues.push({
        id: 'tilt',
        title: 'Shoulder Imbalance',
        description: 'One shoulder is higher than the other, suggesting muscle tension.',
        severity: shoulderTilt > 10 ? 'high' : 'medium',
        exercises: ['Shoulder Rolls', 'Side Neck Stretch', 'Wall Slides']
      });
    }
    if (slouchScore > 15) {
      issues.push({
        id: 'slouch',
        title: 'Slouching Detected',
        description: 'Your spine is compressed. Try to lengthen your torso.',
        severity: slouchScore > 30 ? 'high' : 'medium',
        exercises: ['Cat-Cow Stretch', 'Plank', 'Prone Cobra']
      });
      if (slouchScore > 30) speak("Sit up straight");
    }

    setDetectedIssues(issues);

    if (newOverallScore > 85) {
      setStatus('Good');
      setFeedback('Excellent posture! Keep it up.');
    } else if (newOverallScore > 65) {
      setStatus('Moderate');
      setFeedback('Moderate alignment. Try to sit taller.');
    } else {
      setStatus('Needs Improvement');
      setFeedback('Poor posture detected. Check suggestions.');
    }
  };

  const handleSaveScan = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      let coachSummary = aiSummary;
      if (!coachSummary) {
        setIsAiLoading(true);
        coachSummary = await getPostureInsights(metrics, detectedIssues);
        setAiSummary(coachSummary);
        setIsAiLoading(false);
      }

      await addDoc(collection(db, 'posture_scans'), {
        userId: auth.currentUser.uid,
        date: serverTimestamp(),
        overallScore: metrics.overallScore,
        neckAngle: metrics.neckAngle,
        shoulderTilt: metrics.shoulderTilt,
        slouchScore: metrics.slouchScore,
        issues: detectedIssues.map(i => i.title),
        aiCoachSummary: coachSummary
      });
      
      // Update local history
      setHistory(prev => [{
        id: Date.now().toString(),
        date: new Date(),
        overallScore: metrics.overallScore,
        aiCoachSummary: coachSummary || undefined
      }, ...prev].slice(0, 5));

      setFeedback('Scan saved successfully!');
    } catch (err) {
      console.error("Error saving scan:", err);
      setFeedback('Failed to save scan.');
    } finally {
      setIsSaving(false);
    }
  };

  const getAiCoachSummary = async () => {
    setIsAiLoading(true);
    try {
      const summary = await getPostureInsights(metrics, detectedIssues);
      setAiSummary(summary);
    } catch (err) {
      console.error("Error getting AI summary:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleSession = () => {
    if (isSessionActive) {
      // End session
      const avg = sessionScores.length > 0 
        ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
        : 0;
      setSessionAverageScore(avg);
      setIsSessionActive(false);
      speak(`Session complete. Your average score was ${avg}.`);
    } else {
      // Start session
      setSessionTime(0);
      setSessionScores([]);
      setIsSessionActive(true);
      speak("Posture monitoring session started.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCapacitorCamera = async () => {
    const result = await takePhoto();
    if (result) {
      setIsPhotoMode(true);
      setPhotoUrl(result.dataUrl);
      
      const img = new Image();
      img.src = result.dataUrl;
      img.onload = async () => {
        if (canvasRef.current) {
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
        }
        if (poseRef.current) {
          await poseRef.current.send({ image: img });
        }
      };
    }
  };

  return (
    <div className={cn("space-y-6", isFullScreen && "fixed inset-0 z-[100] bg-slate-950 p-0 m-0 space-y-0")}>
      {/* Main Scanner View */}
      <div className={cn(
        "relative w-full bg-slate-900 overflow-hidden shadow-2xl transition-all duration-500",
        isFullScreen 
          ? "h-full rounded-0 border-0" 
          : "h-[500px] md:h-[650px] rounded-[2.5rem] border-4 border-white dark:border-slate-800"
      )}>
        {isPhotoMode && photoUrl ? (
          <img src={photoUrl} className="absolute inset-0 w-full h-full object-cover" alt="Captured posture" />
        ) : (
          <Webcam 
            ref={webcamRef} 
            className="absolute inset-0 w-full h-full object-cover"
            videoConstraints={{ facingMode: facingMode }}
            onUserMedia={() => setFeedback('Scanning...')}
          />
        )}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
        
        {/* Floating Insight Popup */}
        <AnimatePresence>
          {showFloatingInsight && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md"
            >
              <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-white shadow-lg flex items-center gap-3">
                <div className="p-1.5 bg-blue-500/30 rounded-lg text-blue-300">
                  <Sparkles size={14} />
                </div>
                <p className="text-xs font-medium leading-tight flex-1">
                  {aiSummary || feedback}
                </p>
                <button 
                  onClick={() => setShowFloatingInsight(false)}
                  className="text-white/40 hover:text-white p-1"
                >
                  <Square size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay UI */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-1.5 pointer-events-auto">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={cn(
                "px-3 py-1 rounded-xl backdrop-blur-md border flex items-center gap-2 shadow-sm",
                status === 'Good' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
                status === 'Moderate' ? "bg-amber-500/20 border-amber-500/30 text-amber-400" :
                "bg-rose-500/20 border-rose-500/30 text-rose-400"
              )}
            >
              {status === 'Good' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span className="font-bold text-xs tracking-tight">{status}</span>
            </motion.div>
            
            <div className="bg-black/30 backdrop-blur-md border border-white/10 px-3 py-1 rounded-xl text-white/90 text-[10px] font-bold flex items-center gap-2 w-fit">
              SCORE: <span className="text-blue-400 text-sm">{metrics.overallScore}</span>
            </div>
          </div>

          <div className="flex gap-1.5 pointer-events-auto">
            <button 
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className="bg-black/30 backdrop-blur-md text-white p-2 rounded-xl hover:bg-white/10 transition-all border border-white/10"
            >
              {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="bg-black/30 backdrop-blur-md text-white p-2 rounded-xl hover:bg-white/10 transition-all border border-white/10"
            >
              <History size={16} />
            </button>
            <button 
              onClick={toggleCamera}
              className="bg-black/30 backdrop-blur-md text-white p-2 rounded-xl hover:bg-white/10 transition-all border border-white/10"
              title="Switch Camera"
            >
              <RefreshCw size={16} className={cn(facingMode === 'environment' && "rotate-180 transition-transform")} />
            </button>
            <button 
              onClick={toggleFullScreen}
              className="bg-black/30 backdrop-blur-md text-white p-2 rounded-xl hover:bg-white/10 transition-all border border-white/10"
              title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
            {isNative && !isPhotoMode && (
              <button 
                onClick={handleCapacitorCamera}
                className="bg-black/30 backdrop-blur-md text-white p-2 rounded-xl hover:bg-white/10 transition-all border border-white/10"
              >
                <CameraIcon size={16} />
              </button>
            )}
            {isPhotoMode && (
              <button 
                onClick={() => setIsPhotoMode(false)}
                className="bg-black/30 backdrop-blur-md text-white p-2 rounded-xl hover:bg-white/10 transition-all border border-white/10"
              >
                <RefreshCw size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Session Info Overlay */}
        {isSessionActive && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 px-8 py-4 rounded-full flex items-center gap-4">
              <Timer className="text-blue-400 animate-pulse" size={24} />
              <span className="text-3xl font-black text-white font-mono">{formatTime(sessionTime)}</span>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-white shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                <p className="text-xs font-bold truncate">{feedback}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button 
                  onClick={toggleSession}
                  className={cn(
                    "p-2 rounded-xl transition-all flex items-center justify-center",
                    isSessionActive ? "bg-rose-500/80" : "bg-blue-600/80"
                  )}
                >
                  {isSessionActive ? <Square size={14} /> : <Play size={14} />}
                </button>
                <button 
                  onClick={handleSaveScan}
                  disabled={isSaving}
                  className="p-2 bg-emerald-600/80 rounded-xl transition-all flex items-center justify-center disabled:opacity-50"
                >
                  <Save size={14} />
                </button>
              </div>
            </div>
            
            <div className="flex justify-around mt-2 pt-2 border-t border-white/5">
              <div className="text-center">
                <p className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Neck</p>
                <p className="text-[10px] font-bold">{metrics.neckAngle}°</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Tilt</p>
                <p className="text-[10px] font-bold">{metrics.shoulderTilt}%</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Slouch</p>
                <p className="text-[10px] font-bold">{metrics.slouchScore}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Coach Section */}
      {!isFullScreen && (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">AI Posture Coach</h3>
                  <p className="text-indigo-100 text-sm font-medium">Personalized insights powered by Gemini</p>
                </div>
              </div>
              <button 
                onClick={getAiCoachSummary}
                disabled={isAiLoading}
                className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all shadow-lg disabled:opacity-50"
              >
                {isAiLoading ? 'Analyzing...' : 'Get New Insight'}
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 min-h-[100px] flex items-center justify-center">
              {isAiLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  <p className="text-sm font-medium animate-pulse">Consulting AI Coach...</p>
                </div>
              ) : aiSummary ? (
                <p className="text-lg font-medium leading-relaxed italic">"{aiSummary}"</p>
              ) : (
                <p className="text-white/60 font-medium">Click "Get New Insight" for a personalized posture analysis.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analysis & Suggestions */}
      {!isFullScreen && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">AI Analysis Report</h3>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-500 text-sm font-bold flex items-center gap-1"
            >
              {showDetails ? 'Hide Details' : 'View Details'}
              <ChevronRight size={16} className={cn("transition-transform", showDetails && "rotate-90")} />
            </button>
          </div>

          <AnimatePresence>
            {detectedIssues.length > 0 ? (
              <div className="grid gap-4">
                {detectedIssues.map((issue) => (
                  <motion.div 
                    key={issue.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-3 rounded-2xl",
                        issue.severity === 'high' ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
                      )}>
                        <AlertCircle size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{issue.title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{issue.description}</p>
                        
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Recommended Exercises</p>
                          <div className="flex flex-wrap gap-2">
                            {issue.exercises.map((ex, i) => (
                              <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700">
                                {ex}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl p-8 text-center"
              >
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Perfect Alignment!</h4>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">No significant posture issues detected. Keep maintaining this healthy form.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-3xl p-6 border border-blue-100 dark:border-blue-900/30">
            <div className="flex gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600">
                <Info size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Why Posture Matters?</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Good posture reduces strain on muscles and ligaments, prevents backaches, and even increases lung capacity by up to 30%.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal/Overlay */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Scan History</h3>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <ChevronRight size={24} className="rotate-90" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 thin-scrollbar">
                  {history.length > 0 ? history.map((scan) => (
                    <div key={scan.id} className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-slate-400 dark:text-slate-500">
                          {scan.date?.toDate ? scan.date.toDate().toLocaleDateString() : new Date(scan.date).toLocaleDateString()}
                        </span>
                        <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black">
                          SCORE: {scan.overallScore}
                        </div>
                      </div>
                      {scan.aiCoachSummary && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{scan.aiCoachSummary}"</p>
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-12">
                      <History size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                      <p className="text-slate-500 dark:text-slate-400 font-medium">No scan history found.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

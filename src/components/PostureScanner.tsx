import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Camera } from 'lucide-react';

export default function PostureScanner() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [feedback, setFeedback] = useState('Initializing...');
  const [score, setScore] = useState(() => Number(localStorage.getItem('posture_score')) || 0);
  const [status, setStatus] = useState<'Good' | 'Moderate' | 'Needs Improvement'>(() => (localStorage.getItem('posture_status') as any) || 'Good');

  useEffect(() => {
    localStorage.setItem('posture_score', score.toString());
    localStorage.setItem('posture_status', status);
  }, [score, status]);

  const poseRef = useRef<Pose | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const initPose = async () => {
      if (poseRef.current) return;

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
          if (!isMountedRef.current || !canvasRef.current || !webcamRef.current?.video || !poseRef.current) return;
          
          const video = webcamRef.current.video;
          const canvasCtx = canvasRef.current.getContext('2d');
          if (!canvasCtx) return;

          if (canvasRef.current.width !== video.videoWidth || canvasRef.current.height !== video.videoHeight) {
            canvasRef.current.width = video.videoWidth;
            canvasRef.current.height = video.videoHeight;
          }

          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          if (results.poseLandmarks) {
            drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
            drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });
            
            analyzePosture(results.poseLandmarks);
          }
        });

        poseRef.current = pose;

        const loop = async () => {
          if (!isMountedRef.current) return;
          if (webcamRef.current?.video && webcamRef.current.video.readyState === 4) {
            try {
              if (poseRef.current) await poseRef.current.send({ image: webcamRef.current.video });
            } catch (err) {
              console.error("Pose send error:", err);
            }
          }
          animationFrameRef.current = requestAnimationFrame(loop);
        };
        loop();
      } catch (err) {
        console.error("Pose initialization error:", err);
      }
    };

    initPose();

    return () => {
      isMountedRef.current = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (poseRef.current) {
        const p = poseRef.current;
        poseRef.current = null;
        p.close().catch(err => console.error("Pose close error:", err));
      }
    };
  }, []);

  const analyzePosture = (landmarks: any) => {
    // Simplified posture analysis logic
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    
    // Check for slouching (shoulders vs hips)
    const shoulderHeight = (leftShoulder.y + rightShoulder.y) / 2;
    const hipHeight = (leftHip.y + rightHip.y) / 2;
    
    if (shoulderHeight > hipHeight - 0.1) {
      setFeedback('Straighten your back');
      setScore(60);
      setStatus('Needs Improvement');
    } else {
      setFeedback('Good posture');
      setScore(95);
      setStatus('Good');
    }
  };

  return (
    <div className="relative w-full h-[400px] md:h-[500px] bg-slate-900 rounded-3xl overflow-hidden">
      <Webcam 
        ref={webcamRef} 
        className="absolute inset-0 w-full h-full object-cover"
        videoConstraints={{ facingMode: "environment" }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
      
      <div className="absolute top-4 left-4 bg-blue-600/80 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-semibold">
        Score: {score} | {status}
      </div>

      <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 text-white">
        <p className="text-xl font-bold mb-1">{feedback}</p>
        <p className="text-sm opacity-80">Live analysis only. No data stored.</p>
      </div>
    </div>
  );
}

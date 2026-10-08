import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import { useRoute, useLocation } from "wouter";
import { useWorkout, useCreateSession } from "@/hooks/use-workouts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Maximize2, RotateCcw, CheckCircle2, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Helper for drawing skeleton
function drawSkeleton(keypoints: poseDetection.Keypoint[], ctx: CanvasRenderingContext2D) {
  const color = "#a855f7"; // Primary Purple
  ctx.fillStyle = color;
  ctx.strokeStyle = "#2dd4bf"; // Secondary Teal
  ctx.lineWidth = 4;

  poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet).forEach(([i, j]) => {
    const kp1 = keypoints[i];
    const kp2 = keypoints[j];

    // Check confidence score
    const score1 = kp1.score != null ? kp1.score : 1;
    const score2 = kp2.score != null ? kp2.score : 1;
    const scoreThreshold = 0.3;

    if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
      ctx.beginPath();
      ctx.moveTo(kp1.x, kp1.y);
      ctx.lineTo(kp2.x, kp2.y);
      ctx.stroke();
    }
  });

  for (const kp of keypoints) {
    const score = kp.score != null ? kp.score : 1;
    if (score >= 0.3) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

export default function WorkoutSession() {
  const [, params] = useRoute("/workout/:id");
  const workoutId = parseInt(params?.id || "0");
  const { data: workout, isLoading } = useWorkout(workoutId);
  const { mutate: saveSession } = useCreateSession();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [model, setModel] = useState<poseDetection.PoseDetector | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState("Get Ready...");
  const [timer, setTimer] = useState(0);
  const [score, setScore] = useState(0);
  const [sequenceBuffer, setSequenceBuffer] = useState<number[][]>([]);
  const [hfUrl, setHfUrl] = useState("https://muhammadzakariyyausmani-fitness-ai-api.hf.space");
  const [aiStatus, setAiStatus] = useState("Initializing...");

  // Initialize TF.js and Model
  useEffect(() => {
    let active = true;
    const loadModel = async () => {
      try {
        await tf.ready();
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.BlazePose,
          { 
            runtime: 'tfjs',
            modelType: 'lite'
          }
        );
        if (active) setModel(detector);
      } catch (err) {
        console.error("Failed to load pose detection model", err);
      }
    };
    loadModel();
    return () => { active = false; };
  }, []);

  // Detection Loop
  useEffect(() => {
    let animationFrameId: number;

    const detect = async () => {
      if (model && webcamRef.current && webcamRef.current.video && canvasRef.current) {
        const video = webcamRef.current.video;
        
        if (video.readyState === 4) {
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;

          canvasRef.current.width = videoWidth;
          canvasRef.current.height = videoHeight;

          const poses = await model.estimatePoses(video);
          
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, videoWidth, videoHeight);
            if (poses.length > 0) {
              drawSkeleton(poses[0].keypoints, ctx);
              
              // 1. Extract Landmarks for the Buffer
              const kp = poses[0].keypoints;
              const currentFrameLandmarks = kp.flatMap(p => [p.x / videoWidth, p.y / videoHeight, p.z || 0, p.score || 1]);
              
              // 2. Update Buffer (Keep last 30 frames)
              setSequenceBuffer(prev => {
                const newBuffer = [...prev, currentFrameLandmarks];
                return newBuffer.slice(-30);
              });
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(detect);
    };

    if (model) {
      detect();
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [model]);

  // AI Prediction Loop (Every 1 second)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && sequenceBuffer.length === 30 && hfUrl) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`${hfUrl}/run/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: [sequenceBuffer]
            })
          });
          
          if (!response.ok) {
            setAiStatus("AI System Busy...");
            return;
          }

          const data = await response.json();
          const result = data.data[0];
          
          if (result && result.exercise) {
            setAiStatus("AI Online");
            setFeedback(`Detected: ${result.exercise.toUpperCase()} (${result.confidence}%)`);
            if (result.confidence > 80) {
              setScore(s => Math.min(s + 1, 100));
            }
          } else if (result && result.error) {
            setAiStatus("AI Error: " + result.error);
          }
        } catch (error) {
          console.error("AI Prediction Error:", error);
          setAiStatus("AI Offline - Reconnecting...");
        }
      }, 1000);
    } else if (sequenceBuffer.length < 30) {
      setAiStatus("Calibrating Pose...");
    } else {
      setAiStatus("Ready to Start");
    }
    return () => clearInterval(interval);
  }, [isRecording, sequenceBuffer, hfUrl]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const finishWorkout = () => {
    setIsRecording(false);
    saveSession({
      workoutId,
      userId: 0, // Backend handles this from session
      duration: timer,
      score: Math.round(score),
    }, {
      onSuccess: () => {
        toast({ title: "Workout Complete!", description: `Great job! Score: ${Math.round(score)}` });
        setLocation("/member-dashboard");
      }
    });
  };

  if (isLoading || !workout) return <div className="p-8 text-center">Loading workout...</div>;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full gap-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setLocation("/member-dashboard")} className="hover:bg-accent">
          <ChevronLeft className="w-5 h-5 mr-2" /> Back
        </Button>
        <div className="text-center">
          <h1 className="text-xl font-bold font-display">{workout.title}</h1>
          <p className="text-sm text-muted-foreground">{workout.difficulty} • {formatTime(timer)}</p>
        </div>
        <div className="w-24 text-right font-mono text-xl text-primary font-bold">
          {Math.round(score)} pts
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
        {/* Webcam Area */}
        <div className="lg:col-span-2 relative bg-black rounded-2xl overflow-hidden shadow-2xl shadow-black border border-border">
          {/* AI Status Badge */}
          <div className="absolute top-4 left-4 z-20">
            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${
              aiStatus === "AI Online" ? "bg-green-500/20 text-green-400 border border-green-500/30" : 
              aiStatus.includes("Offline") ? "bg-red-500/20 text-red-400 border border-red-500/30" :
              "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                aiStatus === "AI Online" ? "bg-green-400" : 
                aiStatus.includes("Offline") ? "bg-red-400" : 
                "bg-blue-400"
              }`} />
              {aiStatus}
            </div>
          </div>

          <Webcam
            ref={webcamRef}
            className="absolute inset-0 w-full h-full object-cover mirror-x"
            mirrored
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover mirror-x pointer-events-none"
          />
          
          {/* Overlay Stats */}
          <div className="absolute top-4 left-4 bg-background/50 backdrop-blur px-4 py-2 rounded-lg border border-border">
            <span className={`font-bold ${
              feedback.includes("Great") ? "text-green-400" : "text-yellow-400"
            }`}>
              {feedback}
            </span>
          </div>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
            <Button 
              size="lg" 
              className={`rounded-full w-16 h-16 shadow-xl border-4 ${isRecording ? 'bg-red-500 hover:bg-red-600 border-red-900' : 'bg-primary hover:bg-primary/90 border-primary/50'}`}
              onClick={toggleRecording}
            >
              {isRecording ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </Button>
            
            {isRecording && (
              <Button 
                size="lg" 
                variant="destructive"
                className="rounded-full w-16 h-16 shadow-xl"
                onClick={finishWorkout}
              >
                <CheckCircle2 className="w-8 h-8" />
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <Card className="bg-card border-border flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <h3 className="font-bold text-lg mb-4">Routine</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {(workout.exercises as any[]).map((ex, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted border border-border hover:bg-accent transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{ex.name}</p>
                    <p className="text-xs text-muted-foreground">{ex.sets} sets × {ex.reps} reps</p>
                  </div>
                  {i === 0 && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Active</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 mt-auto">
             <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-xl">
               <h4 className="font-bold text-secondary mb-1">Coach Tip</h4>
               <p className="text-sm text-secondary/80">Keep your back straight and engage your core during squats.</p>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

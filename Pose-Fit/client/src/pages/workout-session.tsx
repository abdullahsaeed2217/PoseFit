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

  // Initialize TF.js and Model
  useEffect(() => {
    let active = true;
    const loadModel = async () => {
      try {
        await tf.ready();
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
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
        
        // Ensure video is ready
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
              
              // Simple feedback logic demo (e.g., check squat depth)
              // Keypoints: 11 (left hip), 13 (left knee), 15 (left ankle)
              const kp = poses[0].keypoints;
              const hip = kp[11];
              const knee = kp[13];
              
              if (hip.score! > 0.5 && knee.score! > 0.5) {
                if (hip.y > knee.y - 20) { // Simple squat depth check
                  setFeedback("Great Depth! Keep going!");
                  if (isRecording) setScore(s => Math.min(s + 0.5, 100)); // Increment score slowly
                } else {
                  setFeedback("Go Lower!");
                }
              }
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
  }, [model, isRecording]);

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
        <Button variant="ghost" onClick={() => setLocation("/member-dashboard")} className="hover:bg-white/10">
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
        <div className="lg:col-span-2 relative bg-black rounded-2xl overflow-hidden shadow-2xl shadow-black border border-white/10">
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
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-4 py-2 rounded-lg border border-white/10">
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
        <Card className="glass-panel border-white/5 flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <h3 className="font-bold text-lg mb-4">Routine</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {(workout.exercises as any[]).map((ex, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
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

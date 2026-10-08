import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, Activity } from "lucide-react";

export default function AiPostureDetector() {
  const [model, setModel] = useState<poseDetection.PoseDetector | null>(null);
  const [hfToken, setHfToken] = useState(import.meta.env.VITE_HF_TOKEN || "");
  const [feedback, setFeedback] = useState("Stand in view to start");
  const [formFeedback, setFormFeedback] = useState("Waiting for movement...");
  const [aiStatus, setAiStatus] = useState("Initializing...");
  const [reps, setReps] = useState(0);
  const [bodyAngles, setBodyAngles] = useState({
    leftArm: -1, rightArm: -1, leftLeg: -1, rightLeg: -1, spine: -1
  });
  const [bufferSize, setBufferSize] = useState(0);
  const [hfUrl] = useState("https://muhammadzakariyyausmani-fitness-ai-api.hf.space");

  const stabilityRef = useRef({ lastDetected: "IDLE", count: 0 });
  const currentExerciseRef = useRef("Scanning...");
  const exercisePhase = useRef("up");
  const sequenceRef = useRef<number[][]>([]);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastExerciseRef = useRef("");

  // Auto-Reset Counter only when switching exercises
  useEffect(() => {
    const isMainExercise = feedback !== "Scanning..." && feedback !== "IDLE (STANDING)" && feedback !== "⚠️ WALK BACK";
    if (isMainExercise && feedback !== lastExerciseRef.current) {
        setReps(0);
        exercisePhase.current = "up";
        lastExerciseRef.current = feedback;
    }
  }, [feedback]);

  // Detection Loop
  useEffect(() => {
    let animationFrameId: number;
    const detect = async () => {
      if (model && webcamRef.current?.video && canvasRef.current) {
        const video = webcamRef.current.video;
        if (video.readyState === 4 && video.videoWidth > 0) {
          canvasRef.current.width = video.videoWidth;
          canvasRef.current.height = video.videoHeight;
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const poses = await model.estimatePoses(canvasRef.current);
            if (poses[0]) {
              drawSkeleton(poses[0].keypoints, ctx);
              const kps = poses[0].keypoints;
              const kpMap = new Map();
              kps.forEach(k => { if (k.name) kpMap.set(k.name, k); });
              
              // --- THE VISION ENGINE (Skeleton Alignment) ---
              const kp = (name: string, idx: number) => kpMap.get(name) || kps[idx];
              const lArm = calculateAngle(kp('left_shoulder', 11), kp('left_elbow', 13), kp('left_wrist', 15));
              const rArm = calculateAngle(kp('right_shoulder', 12), kp('right_elbow', 14), kp('right_wrist', 16));
              const lLeg = calculateAngle(kp('left_hip', 23), kp('left_knee', 25), kp('left_ankle', 27));
              const rLeg = calculateAngle(kp('right_hip', 24), kp('right_knee', 26), kp('right_ankle', 28));
              setBodyAngles({ leftArm: lArm, rightArm: rArm, leftLeg: lLeg, rightLeg: rLeg, spine: -1 });

              // Draw high-visibility structure
              drawSkeleton(kps, ctx);

              // --- INTELLIGENT VERIFIER (Geometric Logic) ---
              const head = kp('nose', 0);
              const feet = kp('left_ankle', 27);
              const mlGuess = (currentExerciseRef.current || "Scanning").toUpperCase();
              let instantGuess = "IDLE (STANDING)";

              if (kp('left_shoulder', 11) && kp('right_shoulder', 12) && Math.abs(kp('left_shoulder', 11).x - kp('right_shoulder', 12).x) > (video.videoWidth * 0.7)) {
                instantGuess = "TOO CLOSE";
              } else if (head && feet) {
                const isHorizontal = Math.abs(head.x - feet.x) > Math.abs(head.y - feet.y) || Math.abs(head.y - feet.y) < (video.videoHeight * 0.5);
                if (isHorizontal) {
                  instantGuess = "PUSH-UP";
                } else {
                  const isFlexing = kp('left_wrist', 15).y < kp('left_shoulder', 11).y && kp('right_wrist', 16).y < kp('right_shoulder', 12).y;
                  if (isFlexing && (lArm < 100 || rArm < 100)) instantGuess = "FLEXING - SHOWING BODY";
                  else if (kp('left_wrist', 15).y < head.y) instantGuess = "TRICEP EXTENSION";
                  else if (lLeg < 140 || rLeg < 140) instantGuess = "SQUAT";
                  else if (mlGuess.includes("CURL") || lArm < 120 || rArm < 120) instantGuess = "BICEP CURL";
                }
              }

              if (instantGuess === stabilityRef.current.lastDetected) stabilityRef.current.count++;
              else { stabilityRef.current.lastDetected = instantGuess; stabilityRef.current.count = 0; }

              const threshold = (instantGuess.includes("PUSH") || instantGuess.includes("SQUAT") || instantGuess.includes("FLEX")) ? 1 : 4;
              if (stabilityRef.current.count >= threshold && feedback !== instantGuess) setFeedback(instantGuess);

              // --- EFFICIENT COACH ENGINE (Phase-Lock Algorithm) ---
              const cur = stabilityRef.current.lastDetected;
              if (cur.includes("SQUAT")) {
                if (lLeg < 100 && exercisePhase.current === "up") { exercisePhase.current = "down"; setFormFeedback("Hold... now stand!"); }
                else if (lLeg > 150 && exercisePhase.current === "down") { exercisePhase.current = "up"; setReps(r => r + 1); setFormFeedback("Perfect Rep!"); }
              } else if (cur.includes("PUSH-UP")) {
                if (lArm < 90 && exercisePhase.current === "up") { exercisePhase.current = "down"; setFormFeedback("Push back up!"); }
                else if (lArm > 150 && exercisePhase.current === "down") { exercisePhase.current = "up"; setReps(r => r + 1); setFormFeedback("Strong rep!"); }
              } else if (cur.includes("CURL")) {
                if (lArm < 70 && exercisePhase.current === "up") { exercisePhase.current = "down"; setFormFeedback("Lower slowly!"); }
                else if (lArm > 140 && exercisePhase.current === "down") { exercisePhase.current = "up"; setReps(r => r + 1); setFormFeedback("Good squeeze!"); }
              } else if (cur.includes("TRICEP")) {
                if (lArm < 60 && exercisePhase.current === "up") { exercisePhase.current = "down"; setFormFeedback("Extend up!"); }
                else if (lArm > 150 && exercisePhase.current === "down") { exercisePhase.current = "up"; setReps(r => r + 1); setFormFeedback("Great work!"); }
              }

              // ML Data
              let frameData = kps.flatMap(p => {
                const rx = p.x / video.videoWidth, ry = p.y / video.videoHeight;
                return [rx, ry, p.z || 0, p.score || 0];
              });
              while (frameData.length < 132) frameData.push(0);
              sequenceRef.current.push(frameData.slice(0, 132));
              if (sequenceRef.current.length > 15) sequenceRef.current.shift();
              setBufferSize(sequenceRef.current.length);
              setAiStatus((kps[32]?.score ?? 0) > 0.3 ? "AI Active" : "AI Warning - Move back");
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(detect);
    };
    detect();
    return () => cancelAnimationFrame(animationFrameId);
  }, [model]);

  // Prediction Loop
  useEffect(() => {
    const intv = setInterval(async () => {
      if (sequenceRef.current.length >= 15 && hfToken) {
        try {
          const res = await fetch(`${hfUrl}/gradio_api/call/predict`, {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${hfToken}` },
            body: JSON.stringify({ data: [sequenceRef.current] })
          });
          const { event_id } = await res.json();
          const stream = await fetch(`${hfUrl}/gradio_api/call/predict/${event_id}`);
          const reader = stream.body?.getReader();
          if (reader) {
            const { value } = await reader.read();
            const text = new TextDecoder().decode(value);
            if (text.includes("data:")) {
              const json = JSON.parse(text.split("data:")[1].split("\n")[0]);
              currentExerciseRef.current = (Array.isArray(json) ? json[0] : json).exercise;
            }
          }
        } catch (e) {}
      }
    }, 1000);
    return () => clearInterval(intv);
  }, [hfToken, hfUrl]);

  useEffect(() => {
    const init = async () => {
      try {
        await tf.ready();
        await tf.setBackend('webgl');
        const d = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, { 
          runtime: 'tfjs', 
          modelType: 'full' 
        });
        setModel(d); 
        setAiStatus("AI Ready");
      } catch (e) {
        console.error("Init Error:", e);
        setAiStatus("Error");
      }
    };
    init();
  }, []);

  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden font-sans">
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-500" />
          <h1 className="font-black uppercase tracking-tighter text-xl italic">AI COMMAND CENTER</h1>
        </div>
        <div className="flex items-center gap-4 bg-white/5 px-4 py-1 rounded-full border border-white/10">
          <div className={`w-2 h-2 rounded-full animate-pulse ${aiStatus.includes("Active") ? "bg-green-500" : "bg-amber-500"}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{aiStatus}</span>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left: Performance */}
        <div className="col-span-3 border-r border-white/5 p-6 flex flex-col gap-6 bg-zinc-950/50">
          <div className="bg-blue-600 rounded-3xl p-8 shadow-2xl shadow-blue-600/20">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Total Reps</p>
            <h2 className="text-8xl font-black tracking-tighter">{reps}</h2>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Live Exercise</p>
            <p className="text-2xl font-black uppercase italic text-blue-400">{feedback}</p>
          </div>
          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Coach Advice</p>
            <p className="text-lg font-bold leading-tight">{formFeedback}</p>
          </div>
        </div>

        {/* Center: Camera */}
        <div className="col-span-6 bg-black relative flex items-center justify-center border-x border-white/5">
          <Webcam 
            ref={webcamRef} 
            className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale scale-x-[-1]" 
            mirrored={false} 
          />
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full object-cover z-10 scale-x-[-1]" 
          />
          <div className="absolute inset-0 z-20 border-[40px] border-black pointer-events-none">
            <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-blue-500/50" />
            <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-blue-500/50" />
            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-blue-500/50" />
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-blue-500/50" />
          </div>
        </div>

        {/* Right: Biometrics */}
        <div className="col-span-3 border-l border-white/5 p-6 flex flex-col gap-6 bg-zinc-950/50">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500">Body Analysis</h3>
          <div className="space-y-4">
            <Metric label="L-Elbow" value={bodyAngles.leftArm} />
            <Metric label="R-Elbow" value={bodyAngles.rightArm} />
            <Metric label="Lower" value={bodyAngles.leftLeg} />
          </div>
          <div className="mt-auto bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3 font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-white/40 uppercase">Buffer</span>
              <span className="text-blue-400 font-bold">{bufferSize}/15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 uppercase">Token</span>
              <span className="text-white">...{hfToken.slice(-4)}</span>
            </div>
            <Button onClick={() => setReps(0)} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 h-8 text-[10px] font-black uppercase">Reset</Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string, value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
        <span>{label}</span>
        <span className="text-white">{value === -1 ? "--" : `${value}°`}</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500" style={{ width: `${value === -1 ? 0 : (value/180)*100}%` }} />
      </div>
    </div>
  );
}

const calculateAngle = (a: any, b: any, c: any) => {
  const getV = (p: any, axis: 'x'|'y') => p?.[axis] ?? p?.position?.[axis] ?? p?.normalized?.[axis];
  const ax = getV(a, 'x'), ay = getV(a, 'y'), bx = getV(b, 'x'), by = getV(b, 'y'), cx = getV(c, 'x'), cy = getV(c, 'y');
  if ([ax, ay, bx, by, cx, cy].some(v => v === undefined || !Number.isFinite(v))) return -1;
  const radians = Math.atan2(cy - by, cx - bx) - Math.atan2(ay - by, ax - bx);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return Math.round(angle);
};

const drawSkeleton = (kps: any, ctx: CanvasRenderingContext2D) => {
  const pts = kps.reduce((acc: any, p: any) => { if (p.name) acc[p.name] = p; return acc; }, {});
  const drawLine = (p1: string, p2: string) => {
    const a = pts[p1], b = pts[p2];
    if (a?.score > 0.3 && b?.score > 0.3) {
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = "rgba(59, 130, 246, 0.6)"; ctx.lineWidth = 3; ctx.stroke();
    }
  };
  ['left_shoulder','right_shoulder','left_elbow','left_wrist','right_elbow','right_wrist','left_hip','right_hip','left_knee','left_ankle','right_knee','right_ankle'].forEach(p => {
    const pt = pts[p]; if (pt?.score > 0.3) { ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, 2*Math.PI); ctx.fillStyle = "#3b82f6"; ctx.fill(); }
  });
  drawLine('left_shoulder','right_shoulder'); drawLine('left_shoulder','left_elbow'); drawLine('left_elbow','left_wrist');
  drawLine('right_shoulder','right_elbow'); drawLine('right_elbow','right_wrist'); drawLine('left_shoulder','left_hip');
  drawLine('right_shoulder','right_hip'); drawLine('left_hip','right_hip'); drawLine('left_hip','left_knee');
  drawLine('left_knee','left_ankle'); drawLine('right_hip','right_knee'); drawLine('right_knee','right_ankle');
};
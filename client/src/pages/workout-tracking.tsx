import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, Timer, Activity, Flame, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function WorkoutTracking() {
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const handleStart = () => {
    setIsActive(true);
    setFeedback(null);
    setTime(0);
  };

  const handleStop = () => {
    setIsActive(false);
    const minutes = time / 60;
    
    if (minutes < 25) {
      setFeedback("The Workout is Normal Warmup");
    } else if (minutes >= 25 && minutes < 45) {
      setFeedback("The Workout is very Good");
    } else {
      setFeedback("Today's Workout is very Intense");
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto py-10 px-4 space-y-8 max-w-4xl">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-black font-display tracking-tight text-white flex items-center gap-3">
          Workout <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Tracking</span>
        </h1>
        <p className="text-muted-foreground text-lg">Real-time session management and performance analysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent md:col-span-2">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-white">Active Session</CardTitle>
                <CardDescription>Track your current workout duration in real-time.</CardDescription>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Timer className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0 flex flex-col items-center justify-center space-y-12 py-16">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative text-7xl md:text-8xl font-black font-mono tracking-tighter text-white">
                {formatTime(time)}
              </div>
            </div>

            <div className="flex gap-4 w-full max-w-sm">
              {!isActive ? (
                <Button 
                  onClick={handleStart} 
                  className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  Start Workout
                </Button>
              ) : (
                <Button 
                  onClick={handleStop} 
                  variant="destructive"
                  className="flex-1 h-14 rounded-2xl font-bold text-lg shadow-lg shadow-destructive/20 transition-all active:scale-95"
                >
                  <Square className="w-5 h-5 mr-2 fill-current" />
                  Finish Workout
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-panel border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
                  <Flame className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Est. Calories</div>
                  <div className="text-xl font-bold text-white">{Math.round(time * 0.15)} kcal</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Activity className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Intensity</div>
                  <div className="text-xl font-bold text-white">
                    {time > 2700 ? "High" : time > 1500 ? "Moderate" : "Low"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Progress</div>
                  <div className="text-xl font-bold text-white">Daily Goal</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {feedback && (
        <Card className="glass-panel border-primary/20 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden">
          <div className="p-8 flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 animate-pulse">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white mb-1">Workout Complete!</h3>
              <p className="text-primary-foreground/70 text-lg font-medium">{feedback}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

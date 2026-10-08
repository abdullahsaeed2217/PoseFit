import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-auth";
import { 
  Timer, 
  Play, 
  Square, 
  Activity, 
  Flame, 
  TrendingUp, 
  Dumbbell, 
  CheckCircle2,
  Clock,
  History,
  Target
} from "lucide-react";
import { format } from "date-fns";
import { Workout } from "@shared/schema";

export default function WorkoutTracking() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [selectedWorkout, setSelectedWorkout] = useState<string>("");
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: workouts } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
  });

  const createSessionMutation = useMutation({
    mutationFn: async (session: any) => {
      await apiRequest("POST", "/api/sessions", session);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Session Recorded",
        description: "Your workout has been saved to your analytics.",
      });
    },
  });

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
    let feedbackText = "";
    
    if (minutes < 25) {
      feedbackText = "The Workout is Normal Warmup";
    } else if (minutes >= 25 && minutes < 45) {
      feedbackText = "The Workout is very Good";
    } else {
      feedbackText = "Today's Workout is very Intense";
    }
    
    setFeedback(feedbackText);

    if (user) {
      createSessionMutation.mutate({
        userId: user.id,
        workoutId: selectedWorkout ? parseInt(selectedWorkout) : null,
        duration: time,
        score: Math.round(time * 0.15), // Points based on calories
        feedback: feedbackText,
      });
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentWorkout = workouts?.find(w => w.id.toString() === selectedWorkout);

  return (
    <div className="container mx-auto py-10 px-4 space-y-8 max-w-4xl">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-black font-display tracking-tight text-foreground flex items-center gap-3">
          <Timer className="w-10 h-10 text-primary" />
          Workout <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Tracking</span>
        </h1>
        <p className="text-muted-foreground text-lg">Real-time session management and performance analysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="glass-panel border-border bg-card">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">Select Today's Session</CardTitle>
                  <CardDescription>Choose a workout to begin tracking.</CardDescription>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Dumbbell className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Workout List</label>
                <Select value={selectedWorkout} onValueChange={setSelectedWorkout}>
                  <SelectTrigger className="h-14 bg-background border-border rounded-xl text-foreground">
                    <SelectValue placeholder="Choose a workout..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {workouts?.map((workout) => (
                      <SelectItem key={workout.id} value={workout.id.toString()} className="text-foreground focus:bg-primary/20">
                        {workout.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentWorkout && (
                <div className="p-6 rounded-2xl bg-muted/50 border border-border space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-foreground">{currentWorkout.title}</h3>
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                      {currentWorkout.difficulty}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{currentWorkout.description}</p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {Array.isArray(currentWorkout.exercises) && currentWorkout.exercises.map((ex: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {ex.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center justify-center py-10 space-y-8 border-t border-border mt-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                  <div className="relative text-7xl md:text-8xl font-black font-mono tracking-tighter text-foreground tabular-nums">
                    {formatTime(time)}
                  </div>
                </div>

                <div className="flex gap-4 w-full max-w-sm">
                  {!isActive ? (
                    <Button 
                      onClick={handleStart} 
                      disabled={!selectedWorkout}
                      className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
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
              </div>
            </CardContent>
          </Card>

          {feedback && (
            <Card className="glass-panel border-primary/20 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden animate-in zoom-in-95">
              <div className="p-8 flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground mb-1">Session Summary</h3>
                  <p className="text-primary-foreground/70 text-lg font-medium">{feedback}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="glass-panel border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
                  <Flame className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Est. Calories</div>
                  <div className="text-xl font-bold text-foreground">{Math.round(time * 0.15)} kcal</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Activity className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Intensity</div>
                  <div className="text-xl font-bold text-foreground">
                    {time > 2700 ? "High" : time > 1500 ? "Moderate" : "Low"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">Progress</div>
                  <div className="text-xl font-bold text-foreground">Daily Goal</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { Session, Workout } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Clock, Target, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export function WorkoutSummary({ session, workout }: { session: Session, workout?: Workout }) {
  const stats = (session.exerciseData as any) || [];
  
  return (
    <Card className="glass-panel border-white/5 overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-display font-bold text-white">
              {workout?.title || "Workout"} Summary
            </CardTitle>
            <CardDescription>
              Completed on {session.completedAt ? format(new Date(session.completedAt), "PPP") : "Unknown Date"}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{session.score}%</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Accuracy Score</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Duration</span>
            </div>
            <div className="text-2xl font-bold">
              {Math.floor((session.duration || 0) / 60)}m {(session.duration || 0) % 60}s
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="w-4 h-4" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Efficiency</span>
            </div>
            <div className="text-2xl font-bold">High</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="w-4 h-4" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Volume</span>
            </div>
            <div className="text-2xl font-bold">{stats.length} Exercises</div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Detailed Performance
          </h3>
          <div className="space-y-4">
            {stats.map((ex: any, i: number) => (
              <div key={i} className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{ex.name}</span>
                  <span className="text-xs text-muted-foreground">{ex.sets} sets • {ex.reps} reps</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest">
                    <span className="text-muted-foreground">Posture Accuracy</span>
                    <span className={ex.accuracy >= 80 ? "text-green-400" : "text-yellow-400"}>
                      {ex.accuracy}%
                    </span>
                  </div>
                  <Progress value={ex.accuracy} className="h-1.5" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {ex.accuracy >= 80 ? (
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-yellow-400" />
                  )}
                  <span className="text-[10px] text-muted-foreground italic">
                    {ex.accuracy >= 80 ? "Excellent form maintained." : "Form slipped slightly in later reps."}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

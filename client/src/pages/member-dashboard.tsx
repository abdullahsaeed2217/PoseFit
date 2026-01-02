import { useWorkouts, useSessions } from "@/hooks/use-workouts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, TrendingUp, Clock, Calendar, ChevronRight, Activity, Dumbbell, Star } from "lucide-react";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Leaderboard } from "@/components/leaderboard";

export default function MemberDashboard() {
  const { data: user } = useUser();
  const { data: workouts, isLoading: loadingWorkouts } = useWorkouts();
  const { data: sessions, isLoading: loadingSessions } = useSessions();

  if (loadingWorkouts || loadingSessions) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary animate-bounce" />
          </div>
          <p className="text-muted-foreground font-medium">Loading your stats...</p>
        </div>
      </div>
    );
  }

  // Calculate simple stats
  const totalSessions = sessions?.length || 0;
  const totalDuration = sessions?.reduce((acc, curr) => acc + (curr.duration || 0), 0) || 0;
  const avgScore = totalSessions > 0 
    ? Math.round((sessions?.reduce((acc, curr) => acc + (curr.score || 0), 0) || 0) / totalSessions) 
    : 0;

  // Recent activity data for chart
  const chartData = sessions?.slice(0, 7).map((s, i) => ({
    name: `Session ${i + 1}`,
    score: s.score || 0,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
            Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{user?.name}</span>
          </h1>
          <p className="text-muted-foreground text-lg">Ready to crush your goals today?</p>
        </div>
        <Link href="/workouts">
          <Button className="btn-primary-gradient px-8 py-6 rounded-xl text-lg group">
            Find a Workout <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel border-white/5 bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{user?.totalPoints || 0}</span>
              <span className="text-sm text-yellow-400 font-medium flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400" /> XP
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/5 bg-gradient-to-br from-card to-secondary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Minutes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{Math.round(totalDuration / 60)}</span>
              <span className="text-sm text-muted-foreground">mins</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/5 bg-gradient-to-br from-card to-indigo-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Avg Form Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{avgScore}%</span>
            </div>
            {/* Simple progress bar */}
            <div className="h-2 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" 
                style={{ width: `${avgScore}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommended Workouts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recommended For You</h2>
            <Link href="/workouts" className="text-primary hover:text-primary/80 font-medium text-sm">View All</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workouts?.slice(0, 4).map((workout) => (
              <Card key={workout.id} className="group relative overflow-hidden border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                      ${workout.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' : 
                        workout.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-green-500/20 text-green-400'}
                    `}>
                      {workout.difficulty}
                    </span>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{workout.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{workout.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link href={`/workout/${workout.id}`} className="w-full">
                    <Button className="w-full bg-white/5 hover:bg-primary hover:text-white border border-white/10 transition-all">
                      <Play className="w-4 h-4 mr-2" /> Start Workout
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="space-y-6">
          <Leaderboard />
          
          <Card className="glass-panel border-white/5 h-[400px]">
            <CardHeader>
              <CardTitle className="text-lg">Recent Form Scores</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" hide />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#1a1b26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {chartData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'hsl(263, 85%, 60%)' : 'hsl(172, 66%, 50%)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

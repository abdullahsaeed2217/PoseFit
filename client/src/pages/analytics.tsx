import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts";
import { 
  Loader2, 
  TrendingUp, 
  Activity, 
  Target, 
  Award, 
  BarChart3, 
  ArrowUpRight, 
  Dumbbell,
  ChevronRight,
  Zap,
  Clock,
  Calendar as CalendarIcon,
  Search,
  User as UserIcon,
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import { useUser } from "@/hooks/use-auth";
import { useState, useMemo } from "react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function Analytics() {
  const { data: user } = useUser();
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: workouts } = useQuery<any[]>({
    queryKey: ["/api/workouts"],
  });

  const { data: allUsers } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === "admin" || user?.role === "trainer",
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery<any[]>({
    queryKey: selectedMemberId ? ["/api/sessions", { userId: selectedMemberId }] : ["/api/sessions"],
    queryFn: async ({ queryKey }) => {
      const [_path, params] = queryKey as [string, { userId?: number }?];
      const url = params?.userId ? `${_path}?userId=${params.userId}` : _path;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
    enabled: !!user,
  });

  const members = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(u => u.role === "member" && (u.status === "approved" || u.status === "pending"));
  }, [allUsers]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  const displayedSessions = sessions || [];

  const activityData = useMemo(() => {
    if (!displayedSessions) return [];
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    return last7Days.map(day => {
      const daySessions = displayedSessions.filter(s => 
        new Date(s.completedAt).toDateString() === day.toDateString()
      );
      return {
        name: format(day, "EEE"),
        value: daySessions.length * 10,
        count: daySessions.length
      };
    });
  }, [displayedSessions]);

  const stats = useMemo(() => {
    if (!displayedSessions) return { progress: 0, active: 0, goals: 0, achievements: 0 };
    return {
      progress: Math.min(100, Math.round((displayedSessions.length / 10) * 100)),
      active: displayedSessions.length,
      goals: displayedSessions.filter(s => (s.duration || 0) > 1800).length,
      achievements: Math.floor(displayedSessions.length / 3)
    };
  }, [displayedSessions]);

  if (!user || sessionsLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const selectedMember = members.find(m => m.id === selectedMemberId);

  // Trainer/Admin Member List View
  if ((user.role === "admin" || user.role === "trainer") && !selectedMemberId) {
    return (
      <div className="p-8 space-y-8 bg-background min-h-screen">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-primary" />
            Member <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Records</span>
          </h1>
          <p className="text-muted-foreground text-lg">Select a member to view their detailed performance analytics and workout history.</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search members by name..." 
            className="pl-10 bg-background border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <Card 
              key={member.id} 
              className="bg-card border-border hover:bg-accent/50 transition-all cursor-pointer group"
              onClick={() => setSelectedMemberId(member.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                    <UserIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 overflow-hidden">
          <h3 className="text-lg font-bold text-foreground truncate">{member.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">@{member.username}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-6 flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Points</p>
                    <p className="text-xl font-black text-primary">{member.totalPoints || 0}</p>
                  </div>
          <Badge variant="outline" className="text-[10px]">View Analytics</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredMembers.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              No members found matching your search.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10 bg-background min-h-screen">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-primary" />
            {selectedMember ? `${selectedMember.name}'s` : 'Your'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Analytics</span>
          </h1>
          {(user.role === "admin" || user.role === "trainer") && (
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedMemberId(null)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Members
            </Button>
          )}
        </div>
        <p className="text-muted-foreground text-lg">
          {selectedMember 
            ? `Viewing performance metrics and workout history for ${selectedMember.name}.`
            : `Comprehensive insights and performance metrics for your ${user.role} profile.`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Overall Progress</p>
                <h3 className="text-3xl font-black text-foreground">{stats.progress}%</h3>
              </div>
              <div className="p-2 bg-primary/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Sessions</p>
                <h3 className="text-3xl font-black text-foreground">{stats.active}</h3>
              </div>
              <div className="p-2 bg-secondary/20 rounded-lg">
                <Activity className="w-5 h-5 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Intense Workouts</p>
                <h3 className="text-3xl font-black text-foreground">{stats.goals}</h3>
              </div>
              <div className="p-2 bg-pink-500/20 rounded-lg">
                <Target className="w-5 h-5 text-pink-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Achievements</p>
                <h3 className="text-3xl font-black text-foreground">{stats.achievements}</h3>
              </div>
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Daily engagement levels for the past 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '8px' }}
                  itemStyle={{ color: '#8b5cf6' }}
                />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle>Session History</CardTitle>
            <CardDescription>Detailed record of recent activities. Click a session to view details.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-4">
              {displayedSessions?.slice().reverse().map((session: any) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border hover:bg-muted hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => setSelectedSession(session)}
                  data-testid={`session-item-${session.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20 group-hover:bg-primary/30 transition-colors">
                      <Dumbbell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{session.workoutId && workouts ? workouts.find((w: any) => w.id === session.workoutId)?.title : "Quick Session"}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{format(new Date(session.completedAt), "MMM d, yyyy · p")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-bold text-primary">{Math.floor((session.duration || 0) / 60)}m { (session.duration || 0) % 60}s</div>
                      <div className="text-[10px] text-muted-foreground font-medium uppercase">{session.score || 0} Points</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
              {(!displayedSessions || displayedSessions.length === 0) && (
                <div className="text-center py-10 text-muted-foreground text-sm">No workout sessions recorded yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-2xl bg-background border-border">
          {selectedSession && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg border border-primary/20">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  Workout Report
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Completed on {format(new Date(selectedSession.completedAt), "MMMM d, yyyy 'at' h:mm a")}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-4 py-6">
                <div className="p-4 rounded-xl bg-muted/50 border border-border text-center space-y-1">
                  <Clock className="w-5 h-5 text-secondary mx-auto mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Duration</p>
                  <p className="text-xl font-black text-foreground">{Math.floor((selectedSession.duration || 0) / 60)}m { (selectedSession.duration || 0) % 60}s</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-border text-center space-y-1">
                  <Zap className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Calories</p>
                  <p className="text-xl font-black text-foreground">{Math.round((selectedSession.duration || 0) * 0.15)} kcal</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-border text-center space-y-1">
                  <Award className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Points</p>
                  <p className="text-xl font-black text-foreground">{selectedSession.score || 0}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Performance Intensity
                  </h4>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground font-medium">Intensity Level</span>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {selectedSession.feedback?.includes("Intense") ? "High Intensity" : selectedSession.feedback?.includes("Good") ? "Moderate" : "Low Intensity"}
                      </Badge>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000"
                        style={{ width: `${Math.min(100, (selectedSession.duration / 3600) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-secondary" />
                    Trainer Feedback
                  </h4>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20 italic text-sm text-foreground">
                    "{selectedSession.feedback || "Keep up the consistent effort to see better results!"}"
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

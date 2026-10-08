import { useState } from "react";
import { useWorkouts, useCreateWorkout, useSessions } from "@/hooks/use-workouts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Dumbbell, Activity, Trash2, ChevronRight, MessageSquare, TrendingUp, Clock } from "lucide-react";
import { useUser, useAllUsers } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { User, Session } from "@shared/schema";

import { Leaderboard } from "@/components/leaderboard";

export default function TrainerDashboard() {
  const { data: user } = useUser();
  const { data: workouts } = useWorkouts();
  const { data: sessions } = useSessions();
  const { data: allUsers } = useAllUsers();
  const { mutate: createWorkout, isPending } = useCreateWorkout();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [exercises] = useState([
    { name: "Squats", reps: 10, sets: 3 },
    { name: "Jumping Jacks", reps: 20, sets: 3 }
  ]);

    const members = allUsers?.filter((u: User) => u.role === "member" && u.status === "approved") || [];
  const selectedMember = members.find((m: User) => m.id.toString() === selectedMemberId);
  const memberSessions = sessions?.filter((s: Session) => s.userId.toString() === selectedMemberId) || [];

  const feedbackMutation = useMutation({
    mutationFn: async ({ sessionId, feedback }: { sessionId: number, feedback: string }) => {
      await apiRequest("PATCH", `/api/sessions/${sessionId}/feedback`, { feedback });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({ title: "Feedback Saved", description: "Your feedback has been sent to the member." });
      setActiveSessionId(null);
      setFeedbackText("");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWorkout({
      title,
      description,
      difficulty,
      exercises,
      trainerId: user?.id || null,
    }, {
      onSuccess: () => {
        setOpen(false);
        toast({ title: "Workout Created", description: "Your new workout is live for members." });
        setTitle("");
        setDescription("");
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Trainer Hub</h1>
          <p className="text-muted-foreground">Manage your routines and analyze member performance.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary-gradient px-6 py-6 rounded-xl gap-2">
              <Plus className="w-5 h-5" /> Create Workout
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>New Workout Routine</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted/50" required />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-muted/50" required />
              </div>
              <div className="grid gap-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isPending} className="w-full">Publish</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Member Selection */}
        <Card className="bg-card border-border lg:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Members
            </CardTitle>
            <CardDescription>Select a member to view performance</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {members.map((member: User) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id.toString())}
                  className={`w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-center justify-between group ${selectedMemberId === member.id.toString() ? 'bg-primary/10' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.username}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform ${selectedMemberId === member.id.toString() ? 'text-primary' : ''}`} />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedMember ? (
            <div className="grid grid-cols-1 gap-8">
              <Leaderboard />
              <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-[2rem] p-12 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <Activity className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Select a member from the left to view detailed analysis and provide feedback.</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {memberSessions.length > 0 
                        ? Math.round(memberSessions.reduce((acc: number, s: Session) => acc + (s.score || 0), 0) / memberSessions.length)
                        : 0}%
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workouts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{memberSessions.length}</div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">
                      {Math.round(memberSessions.reduce((acc: number, s: Session) => acc + (s.duration || 0), 0) / 60)}m
                    </div>
                  </CardContent>
                </Card>
              </div>

              <h3 className="text-xl font-bold mt-8 mb-4 text-foreground">Recent Sessions & Posture Logs</h3>
              <div className="space-y-4">
                {memberSessions.map((session: Session) => (
                  <Card key={session.id} className="bg-card border-border shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-4">
                            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase">
                              {workouts?.find((w: any) => w.id === session.workoutId)?.title || "Deleted Workout"}
                            </div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(session.completedAt!).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Accuracy Score</p>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xl font-bold text-foreground">{session.score}%</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Duration</p>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-secondary" />
                                <span className="text-xl font-bold text-foreground">{Math.floor(session.duration! / 60)}:{String(session.duration! % 60).padStart(2, '0')}</span>
                              </div>
                            </div>
                          </div>

                          {session.feedback && (
                            <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl">
                              <div className="flex items-center gap-2 mb-1">
                                <MessageSquare className="w-3 h-3 text-primary" />
                                <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Your Feedback</span>
                              </div>
                              <p className="text-sm italic text-foreground">"{session.feedback}"</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col justify-center">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-border hover:bg-muted"
                            onClick={() => {
                              setActiveSessionId(session.id);
                              setFeedbackText(session.feedback || "");
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {session.feedback ? "Edit Feedback" : "Add Feedback"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={activeSessionId !== null} onOpenChange={(o) => !o && setActiveSessionId(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Provide Expert Feedback</DialogTitle>
            <DialogDescription>Your tips will help the member improve their posture and form.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Feedback</Label>
            <Textarea 
              placeholder="e.g., Focus on keeping your knees tracking over your toes during squats..." 
              className="bg-muted/50 mt-2 h-32"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button 
              className="w-full" 
              onClick={() => {
                if (activeSessionId) {
                  feedbackMutation.mutate({ sessionId: activeSessionId, feedback: feedbackText });
                }
              }}
              disabled={feedbackMutation.isPending}
            >
              {feedbackMutation.isPending ? "Saving..." : "Send Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

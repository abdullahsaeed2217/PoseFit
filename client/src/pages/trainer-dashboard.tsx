import { useState } from "react";
import { useWorkouts, useCreateWorkout } from "@/hooks/use-workouts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Dumbbell, Activity, Trash2 } from "lucide-react";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function TrainerDashboard() {
  const { data: user } = useUser();
  const { data: workouts, isLoading } = useWorkouts();
  const { mutate: createWorkout, isPending } = useCreateWorkout();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  
  // Exercise builder state - simplified for MVP
  // In a real app, this would be a dynamic list builder
  const [exercises, setExercises] = useState([
    { name: "Squats", reps: 10, sets: 3 },
    { name: "Jumping Jacks", reps: 20, sets: 3 }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWorkout({
      title,
      description,
      difficulty,
      exercises,
      trainerId: user?.id,
    }, {
      onSuccess: () => {
        setOpen(false);
        toast({ title: "Workout Created", description: "Your new workout is live for members." });
        setTitle("");
        setDescription("");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create workout.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Trainer Dashboard</h1>
          <p className="text-muted-foreground">Manage your workout plans and track member progress.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary-gradient px-6 py-6 rounded-xl gap-2">
              <Plus className="w-5 h-5" /> Create New Workout
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Create Workout Plan</DialogTitle>
              <DialogDescription>Design a new routine for your members.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Workout Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="bg-background/50 border-white/10"
                  placeholder="e.g., HIIT Cardio Blast"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea 
                  id="desc" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="bg-background/50 border-white/10"
                  placeholder="Describe the focus of this workout..."
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="bg-background/50 border-white/10">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Beginner (Easy)</SelectItem>
                    <SelectItem value="medium">Intermediate (Medium)</SelectItem>
                    <SelectItem value="hard">Advanced (Hard)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg border border-white/5">
                <h4 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Included Exercises (Fixed for Demo)</h4>
                <ul className="space-y-2 text-sm">
                  {exercises.map((ex, i) => (
                    <li key={i} className="flex justify-between items-center bg-background/50 p-2 rounded border border-white/5">
                      <span>{ex.name}</span>
                      <span className="text-muted-foreground">{ex.sets} sets x {ex.reps} reps</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-2 italic">* In a full version, you would add exercises dynamically here.</p>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
                  {isPending ? "Creating..." : "Publish Workout"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">128</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
          </CardContent>
        </Card>
        <Card className="glass-panel border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Workouts Created</CardTitle>
            <Dumbbell className="w-4 h-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{workouts?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total active plans</p>
          </CardContent>
        </Card>
        <Card className="glass-panel border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Completion Rate</CardTitle>
            <Activity className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">84%</div>
            <p className="text-xs text-muted-foreground mt-1">High engagement!</p>
          </CardContent>
        </Card>
      </div>

      {/* Workout List Management */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Your Workout Library</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workouts?.map((workout) => (
            <Card key={workout.id} className="border-white/10 hover:border-white/20 transition-all bg-card/30">
              <CardHeader>
                <div className="flex justify-between mb-2">
                   <span className={`
                      px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                      ${workout.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' : 
                        workout.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-green-500/20 text-green-400'}
                    `}>
                      {workout.difficulty}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
                <CardTitle>{workout.title}</CardTitle>
                <CardDescription className="line-clamp-2">{workout.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>{(workout.exercises as any[]).length} exercises included</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

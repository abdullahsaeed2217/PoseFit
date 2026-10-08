import { useState } from "react";
import { useWorkouts } from "@/hooks/use-workouts";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Clock, Search, Filter, Edit, Trash2, Eye, Dumbbell, BarChart2, Zap, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const difficultyConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  easy:   { label: "Easy",   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  medium: { label: "Medium", color: "text-yellow-600 dark:text-yellow-400",   bg: "bg-yellow-500/10",  border: "border-yellow-500/20"  },
  hard:   { label: "Hard",   color: "text-red-500",                           bg: "bg-red-500/10",     border: "border-red-500/20"     },
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const cfg = difficultyConfig[difficulty] ?? difficultyConfig.easy;
  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

export default function WorkoutsPage() {
  const { data: user } = useUser();
  const { data: workouts, isLoading } = useWorkouts();
  const [search, setSearch] = useState("");
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [editingWorkout, setEditingWorkout] = useState<any>(null);
  const { toast } = useToast();

  const filteredWorkouts = workouts?.filter(w =>
    w.title.toLowerCase().includes(search.toLowerCase()) ||
    w.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      difficulty: formData.get("difficulty") as string,
    };
    try {
      await apiRequest("PATCH", `/api/workouts/${editingWorkout.id}`, data);
      await queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      setEditingWorkout(null);
      toast({ title: "Workout updated successfully" });
    } catch {
      toast({ title: "Failed to update workout", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const exercises: any[] = Array.isArray(selectedWorkout?.exercises) ? selectedWorkout.exercises : [];
  const estimatedMinutes = exercises.length > 0
    ? exercises.reduce((acc: number, ex: any) => {
        if (ex.duration) return acc + Math.ceil(ex.duration / 60);
        if (ex.sets && ex.reps) return acc + Math.ceil((ex.sets * ex.reps * 3) / 60);
        return acc + 2;
      }, 0)
    : null;

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-display tracking-tight text-foreground">
            Training <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Library</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-1">Choose your challenge and start your session.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search workouts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background border-border rounded-xl h-12"
              data-testid="input-search-workouts"
            />
          </div>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-border bg-muted/50">
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Workout Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredWorkouts?.map((workout) => (
          <Card
            key={workout.id}
            className="group relative overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="p-6 relative z-10">
              <div className="flex justify-between items-start mb-4 relative z-20">
                <DifficultyBadge difficulty={workout.difficulty} />
                <div className="flex items-center gap-2">
                  {user?.role === "trainer" && user.id === workout.trainerId && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground relative z-20"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingWorkout(workout); }}
                        data-testid={`button-edit-workout-${workout.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive relative z-30"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (window.confirm("Are you sure you want to delete this workout?")) {
                            try {
                              await apiRequest("DELETE", `/api/workouts/${workout.id}`);
                              await queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
                              toast({ title: "Workout deleted successfully" });
                            } catch {
                              toast({ title: "Failed to delete workout", variant: "destructive" });
                            }
                          }
                        }}
                        data-testid={`button-delete-workout-${workout.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">
                      {Array.isArray(workout.exercises) ? workout.exercises.length : 0} exercises
                    </span>
                  </div>
                </div>
              </div>
              <CardTitle
                className="text-2xl font-bold group-hover:text-primary transition-colors duration-300 leading-tight mb-2 cursor-pointer relative z-20"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedWorkout(workout); }}
                data-testid={`workout-title-${workout.id}`}
              >
                {workout.title}
              </CardTitle>
              <CardDescription
                className="text-muted-foreground/80 line-clamp-3 leading-relaxed cursor-pointer relative z-20"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedWorkout(workout); }}
                data-testid={`workout-description-${workout.id}`}
              >
                {workout.description}
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-6 pt-0 flex gap-2 relative z-20">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl bg-muted/50 hover:bg-muted border border-border font-semibold transition-all duration-300"
                onClick={() => setSelectedWorkout(workout)}
                data-testid={`button-view-info-${workout.id}`}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredWorkouts?.length === 0 && (
        <div className="text-center py-20 bg-muted/50 rounded-3xl border border-dashed border-border">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No Workouts Found</h3>
          <p className="text-muted-foreground">Try adjusting your search filters.</p>
        </div>
      )}

      {/* ─── View Info Dialog ─── */}
      <Dialog open={!!selectedWorkout} onOpenChange={() => setSelectedWorkout(null)}>
        <DialogContent className="max-w-xl bg-card border-border flex flex-col p-0 gap-0 max-h-[88vh] overflow-hidden rounded-2xl shadow-2xl">
          {selectedWorkout && (() => {
            const exList: any[] = Array.isArray(selectedWorkout.exercises) ? selectedWorkout.exercises : [];
            const mins = exList.length > 0
              ? exList.reduce((acc: number, ex: any) => {
                  if (ex.duration) return acc + Math.ceil(ex.duration / 60);
                  if (ex.sets && ex.reps) return acc + Math.ceil((ex.sets * ex.reps * 3) / 60);
                  return acc + 2;
                }, 0)
              : null;
            const cfg = difficultyConfig[selectedWorkout.difficulty] ?? difficultyConfig.easy;

            return (
              <>
                {/* ── Dialog Header ──
                    NOTE: DialogContent renders an absolute X button at right-4 top-4.
                    We use pt-6 pr-14 to ensure no overlap with that button. */}
                <div className="px-6 pt-6 pr-14 pb-5 flex-shrink-0">
                  {/* Top row: badge + inline stats — right padding clears the X button */}
                  <div className="flex items-center gap-3 flex-wrap mb-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                      {cfg.label}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Dumbbell className="w-3.5 h-3.5 text-primary" />
                      {exList.length} exercise{exList.length !== 1 ? "s" : ""}
                    </span>
                    {mins !== null && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Clock className="w-3.5 h-3.5 text-secondary" />
                        ~{mins} min estimated
                      </span>
                    )}
                  </div>

                  {/* Title — full width, no overlap risk */}
                  <DialogTitle className="text-2xl font-black text-foreground leading-snug mb-2">
                    {selectedWorkout.title}
                  </DialogTitle>

                  {/* Description */}
                  <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                    {selectedWorkout.description}
                  </DialogDescription>

                  {/* Quick stats row */}
                  <div className="grid grid-cols-3 gap-3 mt-5">
                    <div className="bg-muted/50 border border-border rounded-xl px-3 py-3 text-center">
                      <BarChart2 className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Difficulty</p>
                      <p className={`text-sm font-bold mt-0.5 capitalize ${cfg.color}`}>{selectedWorkout.difficulty}</p>
                    </div>
                    <div className="bg-muted/50 border border-border rounded-xl px-3 py-3 text-center">
                      <Dumbbell className="w-4 h-4 mx-auto mb-1 text-secondary" />
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Exercises</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{exList.length}</p>
                    </div>
                    <div className="bg-muted/50 border border-border rounded-xl px-3 py-3 text-center">
                      <Clock className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Est. Time</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{mins !== null ? `~${mins}m` : "—"}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ── Scrollable Exercise List ── */}
                <div className="flex-1 overflow-y-auto px-7 py-5 min-h-0">
                  {exList.length > 0 ? (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Exercise Breakdown
                      </p>
                      <div className="space-y-2.5">
                        {exList.map((exercise: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-muted/40 border border-border hover:bg-muted/70 transition-colors group"
                            data-testid={`exercise-item-${index}`}
                          >
                            {/* Left: number + name */}
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                {index + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground text-sm truncate leading-snug">
                                  {exercise.name || exercise.title || `Exercise ${index + 1}`}
                                </p>
                                {exercise.description && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">{exercise.description}</p>
                                )}
                              </div>
                            </div>

                            {/* Right: stats badges */}
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-4">
                              {exercise.sets && (
                                <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5 rounded-md">
                                  {exercise.sets} sets
                                </Badge>
                              )}
                              {exercise.reps && (
                                <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5 rounded-md">
                                  {exercise.reps} reps
                                </Badge>
                              )}
                              {exercise.duration && (
                                <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5 rounded-md">
                                  {exercise.duration}s
                                </Badge>
                              )}
                              {!exercise.sets && !exercise.reps && !exercise.duration && (
                                <span className="text-xs text-muted-foreground italic">No details</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary footer inside scroll area */}
                      <div className="mt-5 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Complete all <strong className="text-foreground">{exList.length} exercises</strong> in sequence for best results.
                          Maintain proper form and take 30–60 second rest between sets.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="py-12 text-center">
                      <Dumbbell className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="font-semibold text-foreground text-sm">No exercise details available</p>
                      <p className="text-xs text-muted-foreground mt-1">This workout has not been broken down into individual exercises yet.</p>
                    </div>
                  )}
                </div>

                {/* ── Dialog Footer ── */}
                <div className="flex items-center justify-between px-7 py-4 border-t border-border flex-shrink-0 bg-muted/20">
                  <p className="text-xs text-muted-foreground">
                    Created by {selectedWorkout.trainerId ? "Trainer" : "System"}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedWorkout(null)}>
                      Close
                    </Button>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setSelectedWorkout(null)}>
                      Got it
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ─── Edit Workout Dialog (trainer only) ─── */}
      <Dialog open={!!editingWorkout} onOpenChange={() => setEditingWorkout(null)}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-foreground">Edit Workout</DialogTitle>
            <DialogDescription>Update the workout details below.</DialogDescription>
          </DialogHeader>
          {editingWorkout && (
            <form onSubmit={handleEdit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Title</label>
                <Input name="title" defaultValue={editingWorkout.title} className="bg-background border-border" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingWorkout.description}
                  className="w-full min-h-[100px] rounded-md bg-background border border-border p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Difficulty</label>
                <select
                  name="difficulty"
                  defaultValue={editingWorkout.difficulty}
                  className="w-full h-10 rounded-md bg-background border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setEditingWorkout(null)}>Cancel</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">Save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

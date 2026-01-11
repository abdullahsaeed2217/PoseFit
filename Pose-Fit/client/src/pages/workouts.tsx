import { useState } from "react";
import { useWorkouts } from "@/hooks/use-workouts";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Clock, Search, Filter } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";

export default function WorkoutsPage() {
  const { data: workouts, isLoading } = useWorkouts();
  const [search, setSearch] = useState("");

  const filteredWorkouts = workouts?.filter(w => 
    w.title.toLowerCase().includes(search.toLowerCase()) ||
    w.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-display tracking-tight text-white">
            Training <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Library</span>
          </h1>
          <p className="text-muted-foreground text-lg">Choose your challenge and start your session.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search workouts..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 rounded-xl h-12 focus:ring-primary/50"
            />
          </div>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-white/10 bg-white/5">
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredWorkouts?.map((workout) => (
          <Card key={workout.id} className="group relative overflow-hidden glass-panel border-white/5 bg-gradient-to-br from-card to-transparent hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className={`
                  px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border
                  ${workout.difficulty === 'hard' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                    workout.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}
                `}>
                  {workout.difficulty}
                </span>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">15m</span>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors duration-300 leading-tight mb-2">
                {workout.title}
              </CardTitle>
              <CardDescription className="text-muted-foreground/80 line-clamp-3 leading-relaxed">
                {workout.description}
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-6 pt-0">
              <Link href={`/workout/${workout.id}`} className="w-full">
                <Button className="w-full h-12 rounded-xl bg-white/5 hover:bg-primary hover:text-white border border-white/10 transition-all duration-300 font-bold group/btn">
                  <Play className="w-4 h-4 mr-2 fill-current group-hover/btn:scale-110 transition-transform" /> 
                  Begin Session
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredWorkouts?.length === 0 && (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-bold text-white">No Workouts Found</h3>
          <p className="text-muted-foreground">Try adjusting your search filters.</p>
        </div>
      )}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Award, TrendingUp, Loader2, Star, Target } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useQuery<any[]>({
    queryKey: ["/api/leaderboard"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
          <Trophy className="w-10 h-10 text-amber-500" />
          Global
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
            Leaderboard
          </span>
        </h1>
        <p className="text-muted-foreground text-lg italic">
          The elite circle of PoseFit performers. Keep pushing limits!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Rankings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                Rankings
              </CardTitle>
              <CardDescription>
                Real-time performance rankings based on total workout points
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {leaderboard?.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`
                    flex items-center justify-between p-4 rounded-2xl border
                    transition-all hover:scale-[1.01]
                    ${index === 0 ? "bg-amber-500/20 border-amber-500/30" :
                      index === 1 ? "bg-slate-400/10 border-slate-400/20" :
                      index === 2 ? "bg-orange-600/10 border-orange-600/20" :
                      "bg-muted/50 border-border"}
                  `}
                >
                  <div className="flex items-center gap-4">

                    {/* Rank Number */}
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center
                      font-black text-lg
                      ${index === 0 ? "bg-amber-500 text-black" :
                        index === 1 ? "bg-slate-400 text-black" :
                        index === 2 ? "bg-orange-600 text-black" :
                        "bg-muted text-muted-foreground"}
                    `}>
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">
                        {entry.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name */}
                    <div>
                      <p className="font-black text-foreground">
                        {entry.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] py-0 px-2">
                          Member
                        </Badge>
                        {index === 0 && (
                          <Badge className="text-[9px] bg-amber-500 text-black font-bold">
                            LEGEND
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <p className="text-xl font-black text-primary">
                      {entry.totalPoints || 0}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Total Points
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">
                Season Stats
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">

              {/* Total Points */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">
                    {leaderboard?.reduce(
                      (acc, curr) => acc + (curr.totalPoints || 0),
                      0
                    ).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Community Points
                  </p>
                </div>
              </div>

              {/* Competitors */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/10 border border-secondary/20">
                <div className="p-3 bg-secondary/20 rounded-lg">
                  <Award className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">
                    {leaderboard?.length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Active Competitors
                  </p>
                </div>
              </div>

              {/* Rank */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-pink-500/10 border border-pink-500/20">
                <div className="p-3 bg-pink-500/20 rounded-lg">
                  <Target className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">#1</p>
                  <p className="text-xs text-muted-foreground">
                    Global Rank
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
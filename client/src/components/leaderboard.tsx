import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Medal, Crown, Star, TrendingUp } from "lucide-react";

export function Leaderboard() {
  const { data: rankings, isLoading } = useQuery<User[]>({
    queryKey: [api.leaderboard.list.path],
  });

  if (isLoading) return <div className="h-64 animate-pulse bg-white/5 rounded-[2rem]" />;

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold font-display text-foreground">Elite Rankings</CardTitle>
            <CardDescription className="text-muted-foreground">Top performers by accuracy and points</CardDescription>
          </div>
          <Trophy className="w-8 h-8 text-amber-600 dark:text-yellow-500" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {rankings?.map((user, index) => (
            <div key={user.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 font-bold">
                  {index === 0 ? <Crown className="w-6 h-6 text-amber-500" /> :
                   index === 1 ? <Medal className="w-6 h-6 text-slate-400" /> :
                   index === 2 ? <Medal className="w-6 h-6 text-amber-700 dark:text-amber-600" /> :
                   <span className="text-muted-foreground">{index + 1}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{user.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{user.username}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-foreground">{user.totalPoints || 0}</span>
                </div>
                <div className="flex items-center gap-1 justify-end text-[10px] text-emerald-600 dark:text-green-400 font-bold uppercase">
                  <TrendingUp className="w-2 h-2" />
                  XP
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Dumbbell, Activity, LogOut, User as UserIcon, LayoutDashboard, ScanLine, MessageSquare, Timer, CreditCard, BarChart3, Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Notification } from "@shared/schema";

import { ThemeToggle } from "@/components/theme-toggle";

export function LayoutShell({ children, headerAction }: { children: React.ReactNode, headerAction?: React.ReactNode }) {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();
  
  const { data: notifications } = useQuery<Notification[]>({
    queryKey: [api.notifications.list.path],
    refetchInterval: 5000,
    enabled: !!user,
  });
  
  const unreadChatCount = notifications?.filter(n => !n.read && n.type === "chat").length || 0;

  if (!user) return <>{children}</>;

  const dashboardLink = user.role === "admin" 
    ? "/admin-dashboard" 
    : user.role === "trainer" 
      ? "/trainer-dashboard" 
      : "/member-dashboard";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Sidebar / Navigation */}
      <aside className="w-full md:w-64 bg-card border-r border-border flex flex-col sticky top-0 md:h-screen z-40">
        <div className="p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-display font-bold text-foreground tracking-tight">
              PoseFit
            </span>
          </div>
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            {headerAction}
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <Link href={dashboardLink}>
            <div className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-medium
              ${location === dashboardLink 
                ? "bg-primary/10 text-primary border border-primary/20" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:text-white"}
            `}>
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </div>
          </Link>
          
          <Link href="/workouts">
            <div className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-medium
              ${location === "/workouts" 
                ? "bg-primary/10 text-primary border border-primary/20" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:text-white"}
            `}>
              <Dumbbell className="w-5 h-5" />
              Workouts
            </div>
          </Link>

          {(user.role === "trainer" || user.role === "member" || user.role === "admin") && (
            <Link href="/chat">
              <div 
                data-testid={`link-chat-${user.role}`}
                className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-medium group
                ${location === "/chat" 
                  ? "bg-gradient-to-r from-primary/20 to-secondary/10 text-primary border border-primary/30 shadow-lg shadow-primary/10" 
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:text-white"}
              `}>
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center transition-all relative
                  ${location === "/chat" 
                    ? "bg-primary/20 text-primary" 
                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"}
                `}>
                  <MessageSquare className="w-4 h-4" />
                  {unreadChatCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white animate-pulse">
                      {unreadChatCount > 9 ? '9+' : unreadChatCount}
                    </span>
                  )}
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Messages</span>
                    {unreadChatCount > 0 && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {unreadChatCount} new
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] ${location === "/chat" ? "text-primary/70" : "text-muted-foreground/60"}`}>
                    {user.role === "trainer" ? "Chat with Members" : user.role === "admin" ? "Admin Support" : "Connect with Trainers"}
                  </span>
                </div>
              </div>
            </Link>
          )}

          {user.role === "admin" && (
            <Link href="/subscriptions">
              <div 
                className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-medium group
                ${location === "/subscriptions" 
                  ? "bg-gradient-to-r from-indigo-500/20 to-secondary/10 text-indigo-500 border border-indigo-500/30 shadow-lg shadow-indigo-500/10" 
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:text-white"}
              `}>
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center transition-all
                  ${location === "/subscriptions" 
                    ? "bg-indigo-500/20 text-indigo-500" 
                    : "bg-muted text-muted-foreground group-hover:bg-indigo-500/10 group-hover:text-indigo-500"}
                `}>
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-sm">Subscriptions</span>
                  <span className={`text-[10px] ${location === "/subscriptions" ? "text-indigo-500/70" : "text-muted-foreground/60"}`}>
                    Manage Member Fees
                  </span>
                </div>
              </div>
            </Link>
          )}

          <Link href="/leaderboard">
            <div 
              className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-medium group
              ${location === "/leaderboard" 
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:text-white"}
            `}>
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all
                ${location === "/leaderboard" 
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" 
                  : "bg-muted text-muted-foreground group-hover:bg-amber-500/10 group-hover:text-amber-600 dark:group-hover:text-amber-400"}
              `}>
                <Trophy className="w-4 h-4" />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-sm">Leaderboard</span>
                <span className={`text-[10px] ${location === "/leaderboard" ? "text-amber-600/70 dark:text-amber-400/70" : "text-muted-foreground/60"}`}>
                  Top Performers
                </span>
              </div>
            </div>
          </Link>

          <Link href="/analytics">
            <div 
              className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-medium group
              ${location === "/analytics" 
                ? "bg-gradient-to-r from-emerald-500/20 to-secondary/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:text-white"}
            `}>
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all
                ${location === "/analytics" 
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                  : "bg-muted text-muted-foreground group-hover:bg-amber-500/10 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"}
              `}>
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-sm">Reports & Analytics</span>
                <span className={`text-[10px] ${location === "/analytics" ? "text-emerald-600/70 dark:text-emerald-400/70" : "text-muted-foreground/60"}`}>
                  Performance Insights
                </span>
              </div>
            </div>
          </Link>

          {user.role === "member" && (
            <Link href="/workout-tracking">
              <div className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-medium
                ${location === "/workout-tracking" 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:text-white"}
              `}>
                <Timer className="w-5 h-5" />
                Workout Tracking
              </div>
            </Link>
          )}

          {user.role === "member" && (
            <Link href="/ai-posture">
              <div className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-medium
                ${location === "/ai-posture" 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:text-white"}
              `}>
                <ScanLine className="w-5 h-5" />
                AI Posture
              </div>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="hidden md:flex items-center justify-end p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50 h-16">
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {headerAction}
          </div>
        </header>
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}

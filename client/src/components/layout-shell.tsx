import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Dumbbell, Activity, LogOut, User as UserIcon, LayoutDashboard, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LayoutShell({ children, headerAction }: { children: React.ReactNode, headerAction?: React.ReactNode }) {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  const dashboardLink = user.role === "trainer" ? "/trainer-dashboard" : "/member-dashboard";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Sidebar / Navigation */}
      <aside className="w-full md:w-64 bg-card border-r border-border flex flex-col sticky top-0 md:h-screen z-40">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-display font-bold text-white tracking-tight">
              PoseToFit
            </span>
          </div>
          <div className="md:hidden flex items-center gap-2">
            {headerAction}
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href={dashboardLink}>
            <div className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-medium
              ${location === dashboardLink 
                ? "bg-primary/10 text-primary border border-primary/20" 
                : "text-muted-foreground hover:bg-white/5 hover:text-white"}
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
                : "text-muted-foreground hover:bg-white/5 hover:text-white"}
            `}>
              <Dumbbell className="w-5 h-5" />
              Workouts
            </div>
          </Link>

          {user.role === "admin" && (
            <Link href="/admin-dashboard?tab=subscriptions">
              <div className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-medium
                ${location.includes("tab=subscriptions")
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"}
              `}>
                <CreditCard className="w-5 h-5" />
                Member Subscription
              </div>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
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
        <header className="hidden md:flex items-center justify-end p-4 border-b border-white/5 bg-card/50 backdrop-blur-md sticky top-0 z-50 h-16">
          <div className="flex items-center gap-4">
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

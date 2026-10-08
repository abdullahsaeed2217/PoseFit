import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LayoutShell } from "@/components/layout-shell";
import { useUser } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Analytics from "@/pages/analytics";
import LeaderboardPage from "@/pages/leaderboard";
import HomePage from "@/pages/home";
import AuthPage from "@/pages/auth";
import MemberDashboard from "@/pages/member-dashboard";
import TrainerDashboard from "@/pages/trainer-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import WorkoutSession from "@/pages/workout-session";
import WorkoutsPage from "@/pages/workouts";
import WorkoutTracking from "@/pages/workout-tracking";
import AiPostureDetector from "@/pages/ai-posture-detector";
import ChatPage from "@/pages/chat";
import SubscriptionsPage from "@/pages/subscriptions";
import NotFound from "@/pages/not-found";

import { NotificationBell } from "@/components/notifications";

import { Button } from "@/components/ui/button";

function Router() {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (user && user.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
        <div className="max-w-md space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/10 mb-4">
            <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">Approval Pending</h1>
          <p className="text-muted-foreground text-lg">
            Your account status is pending to admin. Please check your approval status by signing in after 2 hours.
          </p>
          <Button
            variant="outline"
            className="mt-8 border-white/10"
            onClick={() => window.location.href = "/auth"}
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />

      {/* Member Routes */}
      <Route path="/member-dashboard">
        <LayoutShell headerAction={<NotificationBell />}>
          <MemberDashboard />
        </LayoutShell>
      </Route>
      <Route path="/workouts">
        <LayoutShell headerAction={<NotificationBell />}>
          <WorkoutsPage />
        </LayoutShell>
      </Route>
      <Route path="/workout/:id">
        <LayoutShell headerAction={<NotificationBell />}>
          <WorkoutSession />
        </LayoutShell>
      </Route>

      <Route path="/workout-tracking">
        <LayoutShell headerAction={<NotificationBell />}>
          <WorkoutTracking />
        </LayoutShell>
      </Route>

      <Route path="/ai-posture">
        <LayoutShell headerAction={<NotificationBell />}>
          <AiPostureDetector />
        </LayoutShell>
      </Route>

      <Route path="/chat">
        <LayoutShell headerAction={<NotificationBell />}>
          <ChatPage />
        </LayoutShell>
      </Route>

      <Route path="/analytics">
        <LayoutShell headerAction={<NotificationBell />}>
          <Analytics />
        </LayoutShell>
      </Route>

      <Route path="/leaderboard">
        <LayoutShell headerAction={<NotificationBell />}>
          <LeaderboardPage />
        </LayoutShell>
      </Route>

      {/* Trainer Routes */}
      <Route path="/trainer-dashboard">
        <LayoutShell headerAction={<NotificationBell />}>
          <TrainerDashboard />
        </LayoutShell>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin-dashboard">
        <LayoutShell headerAction={<NotificationBell />}>
          <AdminDashboard />
        </LayoutShell>
      </Route>

      <Route path="/subscriptions">
        <LayoutShell headerAction={<NotificationBell />}>
          <SubscriptionsPage />
        </LayoutShell>
      </Route>

      {/* Root Redirect for authenticated users */}
      <Route path="/dashboard">
        {!user ? <Redirect to="/auth" /> : <Redirect to={
          user.role === "admin" ? "/admin-dashboard" :
            user.role === "trainer" ? "/trainer-dashboard" : "/member-dashboard"
        } />}
      </Route>

      <Route path="/auth">
        {user ? (
          <Redirect to={
            user.role === "admin" ? "/admin-dashboard" :
              user.role === "trainer" ? "/trainer-dashboard" : "/member-dashboard"
          } />
        ) : (
          <AuthPage />
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

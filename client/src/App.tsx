import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LayoutShell } from "@/components/layout-shell";
import { useUser } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import HomePage from "@/pages/home";
import AuthPage from "@/pages/auth";
import MemberDashboard from "@/pages/member-dashboard";
import TrainerDashboard from "@/pages/trainer-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import WorkoutSession from "@/pages/workout-session";
import NotFound from "@/pages/not-found";

import { NotificationBell } from "@/components/notifications";

function Router() {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
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
          <MemberDashboard />
        </LayoutShell>
      </Route>
      <Route path="/workout/:id">
        <LayoutShell headerAction={<NotificationBell />}>
          <WorkoutSession />
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

      {/* Root Redirect for authenticated users */}
      <Route path="/dashboard">
        {!user ? <Redirect to="/auth" /> : <Redirect to={
          user.role === "admin" ? "/admin-dashboard" : 
          user.role === "trainer" ? "/trainer-dashboard" : "/member-dashboard"
        } />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

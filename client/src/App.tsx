import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LayoutShell } from "@/components/layout-shell";
import { useUser } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import AuthPage from "@/pages/auth";
import MemberDashboard from "@/pages/member-dashboard";
import TrainerDashboard from "@/pages/trainer-dashboard";
import WorkoutSession from "@/pages/workout-session";
import NotFound from "@/pages/not-found";

// Protected Route Wrapper
function ProtectedRoute({ 
  component: Component, 
  allowedRoles 
}: { 
  component: React.ComponentType, 
  allowedRoles?: ("member" | "trainer")[] 
}) {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    // Redirect to their appropriate dashboard if role mismatch
    return <Redirect to={user.role === "trainer" ? "/trainer-dashboard" : "/member-dashboard"} />;
  }

  return (
    <LayoutShell>
      <Component />
    </LayoutShell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Member Routes */}
      <Route path="/member-dashboard">
        <ProtectedRoute component={MemberDashboard} allowedRoles={["member"]} />
      </Route>
      <Route path="/workouts">
        <ProtectedRoute component={MemberDashboard} allowedRoles={["member"]} />
      </Route>
      <Route path="/workout/:id">
        <ProtectedRoute component={WorkoutSession} allowedRoles={["member"]} />
      </Route>

      {/* Trainer Routes */}
      <Route path="/trainer-dashboard">
        <ProtectedRoute component={TrainerDashboard} allowedRoles={["trainer"]} />
      </Route>

      {/* Root Redirect */}
      <Route path="/">
        {() => {
          const { data: user, isLoading } = useUser();
          if (isLoading) return <div className="min-h-screen bg-background" />;
          if (!user) return <Redirect to="/auth" />;
          return <Redirect to={user.role === "trainer" ? "/trainer-dashboard" : "/member-dashboard"} />;
        }}
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

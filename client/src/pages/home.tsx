import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Activity, Shield, User, Dumbbell } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat relative">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-4xl px-4 text-center">
        <div className="mb-12 space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-2xl shadow-primary/30 mb-4">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white tracking-tight">PoseToFit</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered personal training. Experience the future of fitness with real-time pose estimation and expert guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <Link href="/auth?role=admin">
            <Button className="w-full h-32 flex flex-col gap-3 glass-panel border-purple-500/20 hover:border-purple-500/50 transition-all group">
              <Shield className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-lg font-bold">Admin Portal</span>
            </Button>
          </Link>

          <Link href="/auth?role=trainer">
            <Button className="w-full h-32 flex flex-col gap-3 glass-panel border-blue-500/20 hover:border-blue-500/50 transition-all group">
              <Dumbbell className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-lg font-bold">Trainer Login</span>
            </Button>
          </Link>

          <Link href="/auth?role=member">
            <Button className="w-full h-32 flex flex-col gap-3 glass-panel border-green-500/20 hover:border-green-500/50 transition-all group">
              <User className="w-8 h-8 text-green-400 group-hover:scale-110 transition-transform" />
              <span className="text-lg font-bold">User Login</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

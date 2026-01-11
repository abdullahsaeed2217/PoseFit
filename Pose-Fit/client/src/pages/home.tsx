import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Activity, Shield, User, Dumbbell, Play, Star, Trophy, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] text-white selection:bg-primary/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#3b0764,transparent)] opacity-40" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tight">PoseToFit</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
        </div>
        <Link href="/auth">
          <Button variant="outline" className="border-white/10 bg-white/5 backdrop-blur hover:bg-white/10">
            Get Started
          </Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase">
                <Star className="w-3 h-3 fill-current" /> Next-Gen Fitness
              </div>
              <h1 className="text-6xl md:text-8xl font-display font-bold leading-[1.1] tracking-tight">
                Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary">Form</span>, Transform Your Life.
              </h1>
              <p className="text-xl text-white/60 max-w-xl leading-relaxed">
                Experience real-time AI coaching that analyzes every movement. Perfect your technique, prevent injuries, and reach your goals faster than ever.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/auth?role=member">
                  <Button size="lg" className="h-14 px-8 text-lg font-bold btn-primary-gradient rounded-2xl shadow-xl shadow-primary/20 group">
                    Start Training Now <Play className="w-4 h-4 ml-2 fill-current group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <div className="flex items-center gap-4 px-4">
                  <div className="flex -space-x-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0a0a0c] bg-white/10 flex items-center justify-center overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <p className="font-bold">10k+ Users</p>
                    <p className="text-white/40 italic text-xs">Joined this week</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl shadow-primary/10 aspect-[4/3]">
                <img 
                  src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=1470&auto=format&fit=crop" 
                  className="w-full h-full object-cover"
                  alt="Fitness App Dashboard"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent" />
                
                {/* Floating UI Elements */}
                <div className="absolute top-8 left-8 p-4 glass-panel border-white/20 rounded-2xl animate-bounce-slow">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">New Record</p>
                      <p className="text-sm font-bold">Squat Depth: 94%</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative Blobs */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary/20 blur-[100px] rounded-full animate-pulse delay-700" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section className="relative z-10 py-32 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-display font-bold">Choose Your Path</h2>
            <p className="text-white/40 max-w-lg mx-auto">Tailored experiences for every role in the fitness ecosystem.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/auth?role=admin">
              <div className="group relative p-8 glass-panel border-purple-500/10 hover:border-purple-500/40 rounded-[2rem] transition-all cursor-pointer h-full">
                <div className="mb-6 w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Admin Portal</h3>
                <p className="text-white/40 text-sm leading-relaxed mb-6">Full system oversight, user management, and platform configuration.</p>
                <div className="flex items-center text-purple-400 font-bold text-sm">
                  Access Console <Play className="w-3 h-3 ml-2 fill-current" />
                </div>
              </div>
            </Link>

            <Link href="/auth?role=trainer">
              <div className="group relative p-8 glass-panel border-blue-500/10 hover:border-blue-500/40 rounded-[2rem] transition-all cursor-pointer h-full overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4">
                  <Dumbbell className="w-32 h-32" />
                </div>
                <div className="mb-6 w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Dumbbell className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Trainer Hub</h3>
                <p className="text-white/40 text-sm leading-relaxed mb-6">Create workout routines, track client progress, and manage programs.</p>
                <div className="flex items-center text-blue-400 font-bold text-sm">
                  Manage Clients <Play className="w-3 h-3 ml-2 fill-current" />
                </div>
              </div>
            </Link>

            <Link href="/auth?role=member">
              <div className="group relative p-8 glass-panel border-green-500/10 hover:border-green-500/40 rounded-[2rem] transition-all cursor-pointer h-full">
                <div className="mb-6 w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Member Studio</h3>
                <p className="text-white/40 text-sm leading-relaxed mb-6">Personalized workouts with AI form feedback and progress tracking.</p>
                <div className="flex items-center text-green-400 font-bold text-sm">
                  Start Session <Play className="w-3 h-3 ml-2 fill-current" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Activity className="w-6 h-6 text-primary" />
              <span className="text-xl font-display font-bold">PoseToFit</span>
            </div>
            <p className="text-white/30 text-sm max-w-xs">Built for the future of fitness. Empowering you with data and AI.</p>
          </div>
          <div className="flex gap-12 text-sm font-medium text-white/40">
            <div className="space-y-4">
              <p className="text-white font-bold">Platform</p>
              <p className="hover:text-white transition-colors cursor-pointer">Workouts</p>
              <p className="hover:text-white transition-colors cursor-pointer">Trainers</p>
            </div>
            <div className="space-y-4">
              <p className="text-white font-bold">Company</p>
              <p className="hover:text-white transition-colors cursor-pointer">Privacy</p>
              <p className="hover:text-white transition-colors cursor-pointer">Terms</p>
            </div>
          </div>
        </div>
        <div className="mt-20 text-center text-white/10 text-xs">
          © 2026 PoseToFit AI Technologies. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

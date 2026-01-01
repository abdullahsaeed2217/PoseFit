import { useState, useEffect } from "react";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Activity, Dumbbell, Loader2, Shield, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { mutate: login, isPending: isLoginPending } = useLogin();
  const { mutate: register, isPending: isRegisterPending } = useRegister();
  const { toast } = useToast();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"member" | "trainer" | "admin">("member");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get("role");
    if (roleParam === "admin" || roleParam === "trainer" || roleParam === "member") {
      setRole(roleParam as any);
    }
  }, [window.location.search]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password }, {
      onError: (err) => toast({ 
        title: "Login failed", 
        description: err.message, 
        variant: "destructive" 
      })
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    register({ username, password, name, role }, {
      onError: (err) => toast({ 
        title: "Registration failed", 
        description: err.message, 
        variant: "destructive" 
      })
    });
  };

  const getRoleIcon = () => {
    if (role === "admin") return <Shield className="w-8 h-8 text-white" />;
    if (role === "trainer") return <Dumbbell className="w-8 h-8 text-white" />;
    return <Activity className="w-8 h-8 text-white" />;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat relative">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-2xl shadow-primary/30 mb-4">
            {getRoleIcon()}
          </div>
          <h1 className="text-4xl font-display font-bold text-white">PoseToFit</h1>
          <p className="text-muted-foreground">
            {role === "admin" ? "System Administration Access" : "AI-powered personal training at home"}
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur border border-white/5 p-1 mb-4 h-14 rounded-xl">
            <TabsTrigger value="login" className="rounded-lg h-12 data-[state=active]:bg-primary data-[state=active]:text-white">Login</TabsTrigger>
            <TabsTrigger value="register" className="rounded-lg h-12 data-[state=active]:bg-secondary data-[state=active]:text-background">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card className="glass-panel border-white/10">
              <CardHeader>
                <CardTitle>{role === "admin" ? "Admin Login" : "Welcome back"}</CardTitle>
                <CardDescription>Enter your credentials to access your dashboard</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      placeholder="johndoe" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-background/50 border-white/10 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background/50 border-white/10 focus:border-primary"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full btn-primary-gradient h-12 text-lg rounded-xl" disabled={isLoginPending}>
                    {isLoginPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Sign In"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="register">
            <Card className="glass-panel border-white/10">
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Join today and start your fitness journey</CardDescription>
              </CardHeader>
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input 
                      id="reg-name" 
                      placeholder="John Doe" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="bg-background/50 border-white/10 focus:border-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-username">Username</Label>
                    <Input 
                      id="reg-username" 
                      placeholder="johndoe" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-background/50 border-white/10 focus:border-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input 
                      id="reg-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background/50 border-white/10 focus:border-secondary"
                    />
                  </div>
                  
                  {role !== "admin" && (
                    <div className="space-y-3 pt-2">
                      <Label>I want to join as a:</Label>
                      <RadioGroup 
                        value={role as any} 
                        onValueChange={(val) => setRole(val as any)}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <RadioGroupItem value="member" id="member" className="peer sr-only" />
                          <Label
                            htmlFor="member"
                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-secondary peer-data-[state=checked]:bg-secondary/10 [&:has([data-state=checked])]:border-primary transition-all cursor-pointer text-center"
                          >
                            <Activity className="mb-2 h-6 w-6" />
                            Member
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="trainer" id="trainer" className="peer sr-only" />
                          <Label
                            htmlFor="trainer"
                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 [&:has([data-state=checked])]:border-primary transition-all cursor-pointer text-center"
                          >
                            <Dumbbell className="mb-2 h-6 w-6" />
                            Trainer
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold h-12 text-lg rounded-xl" disabled={isRegisterPending}>
                    {isRegisterPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Create Account"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

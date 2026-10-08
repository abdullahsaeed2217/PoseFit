import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, Trash2, Edit2, Shield, User as UserIcon, CheckCircle, XCircle, 
  Clock, Users, ArrowUpRight, Calendar, CreditCard, MessageSquare, Check,
  Activity, Trophy
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useLocation } from "wouter";

import ChatPage from "@/pages/chat";
import { Leaderboard } from "@/components/leaderboard";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [location] = useLocation();
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: [api.admin.users.list.path],
  });

  const [activeTab, setActiveTab] = useState("pending");
  const [filterRole, setFilterRole] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [location]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      await apiRequest("PATCH", buildUrl(api.admin.users.update.path, { id }), { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.users.list.path] });
      toast({ title: "User status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", buildUrl(api.admin.users.delete.path, { id }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.users.list.path] });
      toast({ title: "User deleted successfully" });
    },
  });

  const pendingUsers = users?.filter(u => u.status === "pending") || [];
  const rejectedUsers = users?.filter(u => u.status === "rejected") || [];
  
  const approvedUsers = useMemo(() => {
    const base = users?.filter(u => u.status === "approved") || [];
    if (filterRole) {
      return base.filter(u => u.role === filterRole);
    }
    return base;
  }, [users, filterRole]);

  const stats = useMemo(() => {
    if (!users) return { total: 0, pending: 0, approved: 0, rejected: 0, totalMembers: 0, totalTrainers: 0, totalAdmins: 0 };
    return {
      total: users.length,
      pending: users.filter(u => u.status === "pending").length,
      approved: users.filter(u => u.status === "approved").length,
      rejected: users.filter(u => u.status === "rejected").length,
      totalMembers: users.filter(u => u.role === "member" && u.status === "approved").length,
      totalTrainers: users.filter(u => u.role === "trainer" && u.status === "approved").length,
      totalAdmins: users.filter(u => u.role === "admin").length,
    };
  }, [users]);

  const UserTable = ({ data, showActions = true }: { data: User[], showActions?: boolean }) => (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground font-semibold">User</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Email</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Role</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Joining Date</TableHead>
            {showActions && <TableHead className="text-right text-muted-foreground font-semibold">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((user) => (
            <TableRow key={user.id} className="border-border hover:bg-muted/30 transition-colors">
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-border shadow-inner">
                    <UserIcon className="w-4 h-4 text-primary dark:text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">@{user.username}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground lowercase text-xs">{user.email}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                  user.role === 'admin' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' :
                  user.role === 'trainer' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}>
                  {user.role === 'admin' && <Shield className="w-3.5 h-3.5" />}
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  user.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                  user.status === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}>
                  {user.status === 'approved' ? <CheckCircle className="w-3 h-3" /> :
                   user.status === 'pending' ? <Clock className="w-3 h-3" /> :
                   <XCircle className="w-3 h-3" />}
                  {user.status}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs font-medium">
                {user.createdAt ? format(new Date(user.createdAt), "MMM dd, yyyy") : "N/A"}
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {user.status === 'pending' && (
                      <div className="flex bg-muted rounded-lg p-0.5 border border-border">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-400/10 rounded-md"
                          onClick={() => updateStatusMutation.mutate({ id: user.id, status: "approved" })}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-rose-600 dark:text-rose-400 hover:bg-rose-400/10 rounded-md"
                          onClick={() => updateStatusMutation.mutate({ id: user.id, status: "rejected" })}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      <EditUserDialog user={user} />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-rose-600 dark:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all active:scale-95"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this user?")) {
                            deleteMutation.mutate(user.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="container mx-auto py-10 px-4 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-display font-black text-foreground tracking-tight drop-shadow-sm">
            Command Center
          </h1>
          <p className="text-muted-foreground text-lg font-medium flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            System Administration & Oversight
          </p>
        </div>
        <div className="flex items-center gap-4 bg-card p-2 rounded-2xl border border-border shadow-sm">
          <div className="px-4 py-2 text-center border-r border-border">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total Power</p>
            <p className="text-xl font-black text-foreground">{stats.total}</p>
          </div>
          <div className="px-4 py-2 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Uptime</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">99.9%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card 
          className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group shadow-sm"
          onClick={() => setActiveTab("pending")}
        >
          <CardHeader className="p-4">
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <span className="text-2xl font-black text-foreground">{stats.pending}</span>
            </div>
            <CardTitle className="mt-3 text-sm font-bold">Awaiting Approvals</CardTitle>
          </CardHeader>
        </Card>

        <Card 
          className="bg-card border-border hover:border-indigo-500/50 transition-all cursor-pointer group shadow-sm"
          onClick={() => window.location.href = "/subscriptions"}
        >
          <CardHeader className="p-4">
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </div>
            <CardTitle className="mt-3 text-sm font-bold">Subscriptions</CardTitle>
          </CardHeader>
        </Card>

        <Card 
          className="bg-card border-border hover:border-secondary/50 transition-all cursor-pointer group shadow-sm"
          onClick={() => setActiveTab("chat")}
        >
          <CardHeader className="p-4">
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5 text-secondary" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </div>
            <CardTitle className="mt-3 text-sm font-bold">Admin Chat</CardTitle>
          </CardHeader>
        </Card>

        <Card 
          className="bg-card border-border hover:border-emerald-500/50 transition-all cursor-pointer group shadow-sm"
          onClick={() => {
            setFilterRole(null);
            setActiveTab("approved");
          }}
        >
          <CardHeader className="p-4">
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-2xl font-black text-foreground">{stats.approved}</span>
            </div>
            <CardTitle className="mt-3 text-sm font-bold">Directory</CardTitle>
          </CardHeader>
        </Card>

        <Card 
          className="bg-card border-border hover:border-rose-500/50 transition-all cursor-pointer group shadow-sm"
          onClick={() => setActiveTab("rejected")}
        >
          <CardHeader className="p-4">
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 group-hover:scale-110 transition-transform">
                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <span className="text-2xl font-black text-foreground">{stats.rejected}</span>
            </div>
            <CardTitle className="mt-3 text-sm font-bold">Rejected List</CardTitle>
          </CardHeader>
        </Card>

        <Card 
          className="bg-card border-border hover:border-blue-500/50 transition-all cursor-pointer group shadow-sm"
          onClick={() => {
            setFilterRole("trainer");
            setActiveTab("approved");
          }}
        >
          <CardHeader className="p-4">
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-black text-foreground">{stats.totalTrainers}</span>
            </div>
            <CardTitle className="mt-3 text-sm font-bold">Trainers</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <TabsContent value="pending" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4">
            <Card className="bg-card border-border">
              <CardHeader className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">Pending Requests</CardTitle>
                    <CardDescription className="text-base mt-1 text-muted-foreground">New accounts requiring verification for system entry.</CardDescription>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <ArrowUpRight className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                {pendingUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-2">
                      <CheckCircle className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">All Caught Up</h3>
                      <p className="text-muted-foreground max-w-xs">There are no pending user requests at the moment.</p>
                    </div>
                  </div>
                ) : (
                  <UserTable data={pendingUsers} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4">
            <Card className="bg-card border-border">
              <CardHeader className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">Rejected Applications</CardTitle>
                    <CardDescription className="text-base mt-1 text-muted-foreground">Accounts that have been restricted from accessing platform resources.</CardDescription>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                    <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                {rejectedUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-2">
                      <Shield className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">No Rejections</h3>
                      <p className="text-muted-foreground max-w-xs">The rejected list is currently empty.</p>
                    </div>
                  </div>
                ) : (
                  <UserTable data={rejectedUsers} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 items-start">
              <div className="xl:col-span-3 space-y-8">
                <Card className="bg-card border-border overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
                  <CardHeader className="p-8 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-3xl font-black tracking-tight text-foreground">
                          {filterRole === "trainer" ? "Elite Trainers" : "Global Directory"}
                        </CardTitle>
                        <CardDescription className="text-base mt-2 text-muted-foreground font-medium">
                          {filterRole === "trainer" 
                            ? "Managing our certified network of world-class fitness professionals." 
                            : "Comprehensive list of all verified platform participants and stakeholders."}
                        </CardDescription>
                      </div>
                      <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                        <Users className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-8 pb-8 relative">
                    {approvedUsers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-2 animate-pulse">
                          <Users className="w-12 h-12 text-muted-foreground/20" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">No Data Found</h3>
                          <p className="text-muted-foreground max-w-sm mt-2 font-medium">There are currently no users matching this specific category in the system.</p>
                        </div>
                      </div>
                    ) : (
                      <UserTable data={approvedUsers} />
                    )}
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="bg-card border-border p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">Platform Growth</h4>
                        <p className="text-sm text-muted-foreground">+12% from last month</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="bg-card border-border p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">Top Engagement</h4>
                        <p className="text-sm text-muted-foreground">Members are highly active</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
              <div className="xl:col-span-1 h-full">
                <div className="sticky top-24">
                  <Leaderboard />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4">
            <SubscriptionManager />
          </TabsContent>

          <TabsContent value="chat" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4">
            <ChatPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SubscriptionManager() {
  const [year] = useState(new Date().getFullYear());
  const { data: subscriptions, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/subscriptions", year],
  });

  const { toast } = useToast();

  const toggleMutation = useMutation({
    mutationFn: async ({ userId, year, month }: { userId: number, year: number, month: string }) => {
      await apiRequest("POST", "/api/admin/subscriptions/toggle", { userId, year, month });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions", year] });
      toast({
        title: "Status Updated",
        description: "Subscription payment status has been updated successfully.",
      });
    },
  });

  const months = [
    { id: "jan", label: "Jan" },
    { id: "feb", label: "Feb" },
    { id: "mar", label: "Mar" },
    { id: "apr", label: "Apr" },
    { id: "may", label: "May" },
    { id: "jun", label: "Jun" },
    { id: "jul", label: "Jul" },
    { id: "aug", label: "Aug" },
    { id: "sep", label: "Sep" },
    { id: "oct", label: "Oct" },
    { id: "nov", label: "Nov" },
    { id: "dec", label: "Dec" },
  ];

  if (isLoading) return (
    <div className="flex justify-center items-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <Card className="glass-panel border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden shadow-2xl">
      <CardHeader className="p-8 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black text-white">Member Subscriptions</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Manage and track monthly fee submissions for active members ({year})
            </CardDescription>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
            <CreditCard className="w-7 h-7 text-indigo-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 h-16">
                <TableHead className="text-muted-foreground font-bold px-8 whitespace-nowrap uppercase tracking-widest text-[10px] w-[300px]">Member Profile</TableHead>
                <TableHead className="text-muted-foreground font-bold whitespace-nowrap uppercase tracking-widest text-[10px]">Joined</TableHead>
                {months.map((m) => (
                  <TableHead key={m.id} className="text-center text-muted-foreground font-bold px-2 uppercase tracking-widest text-[10px]">{m.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                        <Users className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                      <p className="text-muted-foreground">No approved members found for subscription tracking.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : subscriptions?.map((sub) => (
                <TableRow key={sub.user.id} className="border-white/5 hover:bg-white/[0.01] transition-colors h-20">
                  <TableCell className="px-8 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                        <UserIcon className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{sub.user.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">@{sub.user.username}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-indigo-400/50" />
                      {sub.user.createdAt ? format(new Date(sub.user.createdAt), "MMM d, yyyy") : "N/A"}
                    </div>
                  </TableCell>
                  {months.map((m) => {
                    const isPaid = (sub.months as any)?.[m.id];
                    return (
                      <TableCell key={m.id} className="p-1 text-center">
                        <button
                          onClick={() => toggleMutation.mutate({ userId: sub.user.id, year, month: m.id })}
                          disabled={toggleMutation.isPending}
                          className={`
                            mx-auto w-10 h-10 rounded-lg border flex items-center justify-center transition-all duration-300 relative group
                            ${isPaid 
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                              : "bg-white/[0.03] border-white/10 text-transparent hover:border-emerald-500/30 hover:bg-emerald-500/5"
                            }
                          `}
                        >
                          <Check className={`w-5 h-5 transition-all duration-300 ${isPaid ? "scale-100 opacity-100" : "scale-50 opacity-0 group-hover:scale-90 group-hover:opacity-30 group-hover:text-emerald-400"}`} />
                          {isPaid && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,1)]" />
                          )}
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10 shadow-xl">
                            {isPaid ? "Payment Received" : `Mark ${m.label} as Paid`}
                          </span>
                        </button>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function EditUserDialog({ user }: { user: User }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(user.role);
  const [name, setName] = useState(user.name);
  const [status, setStatus] = useState(user.status);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", buildUrl(api.admin.users.update.path, { id: user.id }), {
        role,
        name,
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.users.list.path] });
      toast({ title: "User updated successfully" });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-white/5 transition-all active:scale-95">
          <Edit2 className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1b26] border-white/10 text-white rounded-2xl shadow-2xl p-8 sm:max-w-md">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-primary" />
            Edit Profile
          </DialogTitle>
          <CardDescription className="text-muted-foreground">Update user permissions and status for <b>{user.username}</b></CardDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="bg-white/5 border-white/10 rounded-xl h-11 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">System Role</Label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1b26] border-white/10 text-white">
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="trainer">Trainer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1b26] border-white/10 text-white">
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full h-12 rounded-xl font-bold text-base mt-4" 
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

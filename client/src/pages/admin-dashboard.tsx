import { useQuery, useMutation } from "@tanstack/react-query";
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
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { User, Subscription } from "@shared/schema";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Edit2, Shield, User as UserIcon, CheckCircle, XCircle, Clock, Users, ArrowUpRight, Calendar, CreditCard } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useLocation } from "wouter";

import { Leaderboard } from "@/components/leaderboard";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [location] = useLocation();
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: [api.admin.users.list.path],
  });

  const [activeTab, setActiveTab] = useState("pending");

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

  const stats = useMemo(() => {
    if (!users) return { total: 0, pending: 0, approved: 0, rejected: 0 };
    return {
      total: users.length,
      pending: users.filter(u => u.status === "pending").length,
      approved: users.filter(u => u.status === "approved").length,
      rejected: users.filter(u => u.status === "rejected").length,
    };
  }, [users]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingUsers = users?.filter(u => u.status === "pending") || [];
  const rejectedUsers = users?.filter(u => u.status === "rejected") || [];
  const approvedUsers = users?.filter(u => u.status === "approved") || [];

  const UserTable = ({ data, showActions = true }: { data: User[], showActions?: boolean }) => (
    <div className="rounded-xl border border-white/5 overflow-hidden">
      <Table>
        <TableHeader className="bg-white/[0.02]">
          <TableRow className="border-white/5 hover:bg-transparent">
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
            <TableRow key={user.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10 shadow-inner">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">@{user.username}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground lowercase text-xs">{user.email}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                  user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                  user.role === 'trainer' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {user.role === 'admin' && <Shield className="w-3.5 h-3.5" />}
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  user.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  user.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
                      <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/5">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-emerald-400 hover:bg-emerald-400/10 rounded-md"
                          onClick={() => updateStatusMutation.mutate({ id: user.id, status: "approved" })}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-rose-400 hover:bg-rose-400/10 rounded-md"
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
                        className="h-9 w-9 text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all active:scale-95"
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
    <div className="container mx-auto py-10 px-4 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-white flex items-center gap-3">
            Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Command Center</span>
          </h1>
          <p className="text-muted-foreground text-lg">Real-time system oversight and user access governance.</p>
        </div>
        <div className="flex gap-4">
          <Card className="glass-panel border-white/5 py-2 px-6 flex items-center gap-4 bg-gradient-to-br from-white/[0.05] to-transparent">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white">{stats.total}</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total Users</span>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <TabsList className="bg-white/5 border border-white/10 p-1.5 h-16 rounded-2xl w-full flex-wrap md:w-auto">
            <TabsTrigger value="pending" className="rounded-xl h-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-3">
              <Clock className="w-4 h-4" />
              <span>Awaiting Approval</span>
              <span className="bg-white/10 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">{stats.pending}</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-xl h-full px-8 data-[state=active]:bg-rose-500 data-[state=active]:text-white transition-all gap-3">
              <XCircle className="w-4 h-4" />
              <span>Rejected Access</span>
              <span className="bg-white/10 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">{stats.rejected}</span>
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-xl h-full px-8 data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all gap-3">
              <CheckCircle className="w-4 h-4" />
              <span>Approved Directory</span>
              <span className="bg-white/10 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">{stats.approved}</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="rounded-xl h-full px-8 data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all gap-3">
              <CreditCard className="w-4 h-4" />
              <span>Member Subscriptions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-0 focus-visible:outline-none">
            <Card className="glass-panel border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
              <CardHeader className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">Pending Requests</CardTitle>
                    <CardDescription className="text-base mt-1 text-muted-foreground">New accounts requiring verification for system entry.</CardDescription>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <ArrowUpRight className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                {pendingUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-2">
                      <CheckCircle className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">All Caught Up</h3>
                      <p className="text-muted-foreground max-w-xs">There are no pending user requests at the moment.</p>
                    </div>
                  </div>
                ) : (
                  <UserTable data={pendingUsers} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected" className="mt-0 focus-visible:outline-none">
            <Card className="glass-panel border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
              <CardHeader className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">Rejected Applications</CardTitle>
                    <CardDescription className="text-base mt-1 text-muted-foreground">Accounts that have been restricted from accessing platform resources.</CardDescription>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                    <XCircle className="w-6 h-6 text-rose-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                {rejectedUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-2">
                      <Shield className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">No Rejections</h3>
                      <p className="text-muted-foreground max-w-xs">The rejected list is currently empty.</p>
                    </div>
                  </div>
                ) : (
                  <UserTable data={rejectedUsers} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="mt-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
              <Card className="glass-panel border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent xl:col-span-3">
                <CardHeader className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold">System Directory</CardTitle>
                      <CardDescription className="text-base mt-1 text-muted-foreground">Certified professionals and members with active credentials.</CardDescription>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Users className="w-6 h-6 text-emerald-500" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  {approvedUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-2">
                        <Users className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Empty Directory</h3>
                        <p className="text-muted-foreground max-w-xs">No approved users found in the system records.</p>
                      </div>
                    </div>
                  ) : (
                    <UserTable data={approvedUsers} />
                  )}
                </CardContent>
              </Card>
              <div className="xl:col-span-1 h-full">
                <Leaderboard />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-0 focus-visible:outline-none">
            <SubscriptionManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SubscriptionManager() {
  const [year] = useState(new Date().getFullYear());
  const { data: subscriptions, isLoading } = useQuery<(Subscription & { user: User })[]>({
    queryKey: ["/api/admin/subscriptions", year],
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ userId, year, month }: { userId: number, year: number, month: string }) => {
      await apiRequest("POST", "/api/admin/subscriptions/toggle", { userId, year, month });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions", year] });
    },
  });

  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

  if (isLoading) return <Loader2 className="w-8 h-8 animate-spin mx-auto mt-20" />;

  return (
    <Card className="glass-panel border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden">
      <CardHeader className="p-8">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Member Subscriptions</CardTitle>
            <CardDescription className="text-base mt-1 text-muted-foreground">Manage and track monthly fee submissions for active members ({year})</CardDescription>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Calendar className="w-6 h-6 text-indigo-500" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5">
                <TableHead className="text-muted-foreground font-semibold px-8 whitespace-nowrap">Member Name</TableHead>
                <TableHead className="text-muted-foreground font-semibold whitespace-nowrap">Joining Date</TableHead>
                {months.map(m => (
                  <TableHead key={m} className="text-center text-muted-foreground font-semibold uppercase text-[10px] tracking-tighter px-2">{m}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions?.map((sub) => (
                <TableRow key={sub.user.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                  <TableCell className="px-8 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-white/10">
                        <UserIcon className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-white">{sub.user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {sub.user.createdAt ? format(new Date(sub.user.createdAt), "MMM d, yyyy") : "N/A"}
                  </TableCell>
                  {months.map(m => (
                    <TableCell key={m} className="text-center px-1">
                      <button
                        onClick={() => toggleMutation.mutate({ userId: sub.user.id, year, month: m })}
                        disabled={toggleMutation.isPending}
                        className={`w-6 h-6 rounded-md border transition-all flex items-center justify-center mx-auto ${
                          (sub.months as any)?.[m]
                            ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                            : "bg-white/5 border-white/10 hover:border-white/30"
                        }`}
                      >
                        {(sub.months as any)?.[m] && <CheckCircle className="w-3.5 h-3.5" />}
                      </button>
                    </TableCell>
                  ))}
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
              <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11 focus:ring-primary focus:border-primary transition-all">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1b26] border-white/10 text-white rounded-xl">
                <SelectItem value="member" className="focus:bg-primary/20 focus:text-white rounded-lg">Member</SelectItem>
                <SelectItem value="trainer" className="focus:bg-primary/20 focus:text-white rounded-lg">Trainer</SelectItem>
                <SelectItem value="admin" className="focus:bg-primary/20 focus:text-white rounded-lg">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Account Status</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11 focus:ring-primary focus:border-primary transition-all">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1b26] border-white/10 text-white rounded-xl">
                <SelectItem value="pending" className="focus:bg-primary/20 focus:text-white rounded-lg">Pending</SelectItem>
                <SelectItem value="approved" className="focus:bg-primary/20 focus:text-white rounded-lg">Approved</SelectItem>
                <SelectItem value="rejected" className="focus:bg-primary/20 focus:text-white rounded-lg">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full btn-primary-gradient h-12 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all mt-4" 
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

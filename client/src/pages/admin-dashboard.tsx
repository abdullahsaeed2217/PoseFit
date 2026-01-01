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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Edit2, Shield, User as UserIcon, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: [api.admin.users.list.path],
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingUsers = users?.filter(u => u.status === "pending") || [];
  const approvedUsers = users?.filter(u => u.status === "approved") || [];

  const UserTable = ({ data, showActions = true }: { data: User[], showActions?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-primary" />
                </div>
                {user.name}
              </div>
            </TableCell>
            <TableCell>{user.username}</TableCell>
            <TableCell>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                user.role === 'trainer' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                'bg-green-500/10 text-green-400 border border-green-500/20'
              }`}>
                {user.role === 'admin' && <Shield className="w-3 h-3" />}
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </TableCell>
            <TableCell>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                user.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                user.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {user.status === 'approved' ? <CheckCircle className="w-3 h-3" /> :
                 user.status === 'pending' ? <Clock className="w-3 h-3" /> :
                 <XCircle className="w-3 h-3" />}
                {user.status}
              </span>
            </TableCell>
            {showActions && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {user.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-green-400 hover:bg-green-400/10"
                        onClick={() => updateStatusMutation.mutate({ id: user.id, status: "approved" })}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-400 hover:bg-red-400/10"
                        onClick={() => updateStatusMutation.mutate({ id: user.id, status: "rejected" })}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  <EditUserDialog user={user} />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this user?")) {
                        deleteMutation.mutate(user.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Admin Portal</h1>
          <p className="text-muted-foreground">Manage users and system access approvals</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="pending" className="gap-2">
            Pending <span className="bg-yellow-500/20 text-yellow-400 px-1.5 rounded text-[10px]">{pendingUsers.length}</span>
          </TabsTrigger>
          <TabsTrigger value="all">System Users</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Awaiting Approval</CardTitle>
              <CardDescription>New trainers and members waiting for system access.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No pending approvals found.</div>
              ) : (
                <UserTable data={pendingUsers} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>System Directory</CardTitle>
              <CardDescription>Full list of all registered users in the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable data={users || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
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
        <Button variant="ghost" size="icon">
          <Edit2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Edit User: {user.username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="bg-background/50 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger className="bg-background/50 border-white/10">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="trainer">Trainer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="bg-background/50 border-white/10">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full" 
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

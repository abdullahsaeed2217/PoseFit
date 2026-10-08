import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Check, X, Calendar, CreditCard } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function SubscriptionsPage() {
  const [year] = useState(new Date().getFullYear());
  const { toast } = useToast();

  // ✅ FIXED: queryFn added
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["/api/admin/subscriptions", year],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/subscriptions?year=${year}`);
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ userId, month }: { userId: number; month: string }) => {
      await apiRequest("POST", "/api/admin/subscriptions/toggle", {
        userId,
        year,
        month,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions", year] });
      toast({
        title: "Updated",
        description: "Subscription status updated successfully.",
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Member Subscriptions</h1>
          <p className="text-muted-foreground">
            Track monthly fee submissions for approved members
          </p>
        </div>
        <CreditCard className="w-8 h-8 text-primary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Fiscal Year {year}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Joined Date</TableHead>
                {months.map((m) => (
                  <TableHead key={m.id} className="text-center">
                    {m.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center py-20">
                    <Users className="mx-auto mb-3 opacity-40" />
                    No approved members found
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub: any) => (
                  <TableRow key={sub.user.id}>
                    <TableCell>
                      <div className="font-semibold">{sub.user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        @{sub.user.username}
                      </div>
                    </TableCell>

                    <TableCell className="text-sm">
                      {sub.user.createdAt
                        ? format(new Date(sub.user.createdAt), "MMM dd, yyyy")
                        : "N/A"}
                    </TableCell>

                    {months.map((m) => {
                      const paid = sub.months?.[m.id];
                      return (
                        <TableCell key={m.id} className="text-center">
                          <button
                            disabled={toggleMutation.isPending}
                            onClick={() =>
                              toggleMutation.mutate({
                                userId: sub.user.id,
                                month: m.id,
                              })
                            }
                            className={`w-8 h-8 rounded-md border flex items-center justify-center
                              ${
                                paid
                                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                  : "bg-muted/10 border-muted text-muted-foreground"
                              }
                            `}
                          >
                            {paid ? <Check size={16} /> : <X size={14} />}
                          </button>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

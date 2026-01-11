import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { Notification } from "@shared/schema";
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

export function NotificationBell() {
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: [api.notifications.list.path],
  });

  const readMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", buildUrl(api.notifications.read.path, { id }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.notifications.list.path] });
    },
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover-elevate">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 glass-panel border-white/10 p-0">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="font-bold text-sm font-display">Notifications</h3>
          {unreadCount > 0 && <Badge variant="secondary" className="text-[10px]">{unreadCount} New</Badge>}
        </div>
        <ScrollArea className="h-80">
          {notifications?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No notifications yet.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications?.map((n) => (
                <DropdownMenuItem 
                  key={n.id} 
                  className={`p-4 flex flex-col gap-1 focus:bg-white/5 cursor-default ${!n.read ? 'bg-primary/5' : ''}`}
                  onClick={() => !n.read && readMutation.mutate(n.id)}
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <div className="flex items-center gap-2">
                      {getIcon(n.type)}
                      <span className={`font-bold text-xs ${!n.read ? 'text-white' : 'text-muted-foreground'}`}>{n.title}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(n.createdAt!), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 pl-6">{n.message}</p>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem className="p-2 justify-center text-[10px] uppercase font-bold tracking-widest text-primary hover:text-primary/80 focus:bg-transparent">
          View All Activity
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

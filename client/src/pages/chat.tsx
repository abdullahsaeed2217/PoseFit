import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, User } from "lucide-react";
import { PrivateMessage, type User as UserType } from "@shared/schema";

export default function ChatPage({ targetUserId }: { targetUserId?: number }) {
  const { data: currentUser } = useUser();
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: users, isLoading: loadingUsers } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users"],
    enabled: currentUser?.role === "admin",
  });

  const { data: adminUser } = useQuery<UserType>({
    queryKey: ["/api/admin/users"],
    select: (data) => data.find(u => u.role === 'admin') as UserType,
    enabled: currentUser?.role === "member",
  });

  useEffect(() => {
    if (currentUser?.role === "member" && adminUser) {
      setSelectedUser(adminUser);
    }
  }, [currentUser, adminUser]);

  useEffect(() => {
    if (targetUserId && users) {
      const user = users.find(u => u.id === targetUserId);
      if (user) setSelectedUser(user);
    }
  }, [targetUserId, users]);

  const { data: messages, isLoading: loadingMessages } = useQuery<PrivateMessage[]>({
    queryKey: ["/api/messages", selectedUser?.id],
    enabled: !!selectedUser,
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", "/api/messages", {
        receiverId: selectedUser?.id,
        content,
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedUser?.id] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 p-4">
      {currentUser?.role === "admin" && (
        <Card className="w-64 glass-panel border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Members</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-14rem)]">
              {loadingUsers ? (
                <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>
              ) : (
                users?.filter(u => u.role === "member").map(user => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-white/5 ${selectedUser?.id === user.id ? 'bg-primary/10 text-primary' : ''}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">{user.username}</span>
                  </button>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Card className="flex-1 flex flex-col glass-panel border-white/5 overflow-hidden">
        {selectedUser ? (
          <>
            <CardHeader className="border-b border-white/5 p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{selectedUser.username}</CardTitle>
                  <p className="text-xs text-muted-foreground">Private Chat</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
              <ScrollArea ref={scrollRef} className="flex-1 p-4">
                <div className="space-y-4">
                  {loadingMessages ? (
                    <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
                  ) : (
                    messages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                            msg.senderId === currentUser?.id
                              ? 'bg-primary text-primary-foreground rounded-tr-none'
                              : 'bg-white/5 text-white rounded-tl-none border border-white/5'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-white/5 flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="bg-white/5 border-white/10"
                />
                <Button size="icon" onClick={handleSend} disabled={!message.trim() || sendMessageMutation.isPending}>
                  {sendMessageMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a member to start chatting
            </div>
          )}
        </Card>
      </div>
  );
}

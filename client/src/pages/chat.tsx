import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, MessageSquare, Sparkles, Users, Search, Circle } from "lucide-react";
import { PrivateMessage, type User as UserType } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPage() {
  const { data: currentUser } = useUser();
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // For Members: Show all approved trainers
  const { data: trainers, isLoading: loadingTrainers } = useQuery<UserType[]>({
    queryKey: ["/api/trainers/approved"],
    enabled: currentUser?.role === "member",
  });

  // For Admins/Trainers: Show appropriate users
  const { data: activeChats, isLoading: loadingChats } = useQuery<UserType[]>({
    queryKey: ["/api/messages/active-chats"],
    enabled: currentUser?.role === "trainer" || currentUser?.role === "admin",
  });

  const { data: messages, isLoading: loadingMessages } = useQuery<PrivateMessage[]>({
    queryKey: ["/api/messages", selectedUser?.id],
    enabled: !!selectedUser,
    refetchInterval: 1000, // Faster polling for real-time feel
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
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = () => {
    if (message.trim() && !sendMessageMutation.isPending && selectedUser) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const getSidebarUsers = () => {
    if (currentUser?.role === "admin") return { users: activeChats, title: "Support Chats", loading: loadingChats };
    if (currentUser?.role === "member") return { users: trainers, title: "Approved Trainers", loading: loadingTrainers };
    if (currentUser?.role === "trainer") return { users: activeChats, title: "Active Member Chats", loading: loadingChats };
    return { users: [], title: "Chats", loading: false };
  };

  const { users: sidebarUsers, title: sidebarTitle, loading: sidebarLoading } = getSidebarUsers();
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredUsers = sidebarUsers?.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="w-80 flex flex-col"
      >
        <Card className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-card to-card/80 border-white/10 shadow-2xl shadow-black/20">
          <CardHeader className="p-5 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
                  <MessageSquare className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-foreground">{sidebarTitle}</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {filteredUsers?.length || 0} {currentUser?.role === "trainer" || currentUser?.role === "admin" ? "available" : "trainers"}
                  </span>
                </div>
              </CardTitle>
            </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background/50 border-border h-10 rounded-xl text-sm"
                    data-testid="input-search-chat"
                  />
                </div>
              </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <AnimatePresence>
                {sidebarLoading ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-primary/20 animate-ping absolute inset-0" />
                      <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">Loading chats...</span>
                  </div>
                ) : filteredUsers?.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-10 text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">No Conversations</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {currentUser?.role === "member" 
                          ? "Select a trainer to start chatting"
                          : "Members will appear here when they are approved"}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-2">
                    {filteredUsers?.map((user, index) => (
                      <motion.button
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedUser(user)}
                        data-testid={`button-select-user-${user.id}`}
                        className={`w-full flex items-center gap-4 p-4 text-left transition-all rounded-xl mb-1 group ${
                          selectedUser?.id === user.id 
                            ? 'bg-primary/10 border border-primary/30 shadow-lg shadow-primary/5' 
                            : 'hover:bg-accent'
                        }`}
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2 border-border shadow-lg group-hover:border-primary/30 transition-colors">
                            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30 text-sm font-bold">
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground truncate">{user.name}</span>
                            {selectedUser?.id === user.id && (
                              <Sparkles className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            <span className="uppercase tracking-wider">{user.role}</span>
                            <Circle className="w-1 h-1 inline-block mx-2 fill-current" />
                            <span className="text-emerald-400">Online</span>
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex-1 flex flex-col"
      >
        <Card className="flex-1 flex flex-col overflow-hidden bg-card border-border shadow-2xl shadow-black/5">
          <AnimatePresence mode="wait">
            {selectedUser ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full"
              >
                <CardHeader className="border-b border-border p-5 bg-gradient-to-r from-primary/5 to-secondary/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-primary/30 shadow-lg shadow-primary/20">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold">
                            {selectedUser.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-card animate-pulse" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-foreground font-bold">{selectedUser.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-500 font-medium">Online</span>
                          <Circle className="w-1 h-1 fill-current text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{selectedUser.role}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 flex flex-col bg-muted/30 overflow-hidden">
                  <ScrollArea ref={scrollRef} className="flex-1 p-6">
                    <div className="space-y-4">
                      {loadingMessages ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Loading messages...</span>
                        </div>
                      ) : messages?.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-center py-16 space-y-4"
                        >
                          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto border border-primary/20">
                            <Sparkles className="w-10 h-10 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-foreground">Start the Conversation</h4>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                              {currentUser?.role === 'trainer' 
                                ? 'Share your expertise and help this member improve their fitness journey!'
                                : currentUser?.role === 'admin'
                                ? 'Provide support and guidance to the community.'
                                : 'Ask questions about workouts, form, or get personalized guidance!'}
                            </p>
                          </div>
                        </motion.div>
                      ) : (
                        messages?.map((msg, index) => {
                          const isMe = msg.senderId === currentUser?.id;
                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.02 }}
                              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} max-w-[75%]`}>
                                {!isMe && (
                                  <Avatar className="h-8 w-8 border border-border flex-shrink-0">
                                    <AvatarFallback className="bg-gradient-to-br from-secondary/30 to-primary/30 text-xs text-foreground">
                                      {selectedUser.name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                  <div
                                    className={`px-4 py-3 text-sm leading-relaxed ${
                                      isMe
                                        ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm shadow-lg shadow-primary/10'
                                        : 'bg-card text-foreground rounded-2xl rounded-tl-sm border border-border shadow-sm'
                                    }`}
                                  >
                                    {msg.content}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground mt-1.5 px-1 flex items-center gap-1">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {isMe && <span className="text-primary">Sent</span>}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-4 bg-card border-t border-border">
                    <div className="flex gap-3 items-center">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={currentUser?.role === 'trainer' ? "Share your expert advice..." : "Type your message..."}
                        className="flex-1 bg-background border-border h-12 rounded-xl text-sm focus-visible:ring-primary/50 focus-visible:border-primary/50"
                        data-testid="input-chat-message"
                      />
                      <Button 
                        size="icon" 
                        onClick={handleSend} 
                        disabled={!message.trim() || sendMessageMutation.isPending}
                        className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30 transition-all hover:scale-105"
                        data-testid="button-send-message"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-10"
              >
                <div className="space-y-6 max-w-md">
                  <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl" />
                    <div className="relative w-full h-full rounded-3xl bg-card flex items-center justify-center border border-border shadow-2xl shadow-primary/5">
                      <MessageSquare className="w-16 h-16 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-display font-bold text-foreground">
                      {currentUser?.role === 'trainer' ? 'Your Member Chats' : currentUser?.role === 'admin' ? 'Admin Support Hub' : 'Connect with Trainers'}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {currentUser?.role === 'trainer' 
                        ? 'Select a member from the list to view your conversation history, provide feedback, and offer personalized guidance for their fitness journey.'
                        : currentUser?.role === 'admin'
                        ? 'Communicate with members and trainers to provide support and ensure the community is thriving.'
                        : 'Connect with our approved fitness professionals for personalized guidance, workout tips, and expert support on your fitness journey.'}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-medium text-emerald-500">Real-time support active</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}

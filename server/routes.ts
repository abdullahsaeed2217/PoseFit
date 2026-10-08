import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { hashPassword } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Automated Subscription Expiry Notification
  const checkSubscriptionExpiry = async () => {
    const allUsers = await storage.getAllUsers();
    const now = new Date();
    
    for (const user of allUsers) {
      if (user.role === "member" && user.status === "approved" && user.createdAt) {
        const joiningDate = new Date(user.createdAt);
        const monthsDiff = (now.getFullYear() - joiningDate.getFullYear()) * 12 + now.getMonth() - joiningDate.getMonth();
        
        if (monthsDiff >= 1) {
          const currentYear = now.getFullYear();
          const currentMonthName = now.toLocaleString('default', { month: 'short' }).toLowerCase();
          const subs = await storage.getSubscriptions(currentYear);
          const userSub = subs.find(s => s.userId === user.id);
          
          if (!userSub || !(userSub.months as any)?.[currentMonthName]) {
            const notifications = await storage.getNotifications(user.id);
            const todayNotification = notifications.find(n => 
              n.type === "warning" && 
              n.title === "Subscription Expired" &&
              new Date(n.createdAt!).toDateString() === now.toDateString()
            );

            if (!todayNotification) {
              await storage.createNotification({
                userId: user.id,
                title: "Subscription Expired",
                message: "Your Monthly Subscription is Expired Plz Update Your Subscription",
                type: "warning",
                read: false
              });
            }
          }
        }
      }
    }
  };

  checkSubscriptionExpiry();
  setInterval(checkSubscriptionExpiry, 24 * 60 * 60 * 1000);

  app.get("/api/trainers/approved", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const users = await storage.getAllUsers();
    const approvedTrainers = users.filter(u => 
      (u.role === "trainer" || u.role === "admin") && u.status === "approved"
    );
    res.json(approvedTrainers);
  });

  app.get("/api/messages/active-chats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const role = (req.user as any).role;
    const allUsers = await storage.getAllUsers();
    
    const messages = await storage.getPrivateMessagesForUser(userId);
    const otherUserIds = new Set(messages.map(m => m.senderId === userId ? m.receiverId : m.senderId));
    
    let activeChatUsers;
    
    if (role === "admin") {
      const professionalUsers = allUsers.filter(u => 
        (u.role === "member" || u.role === "trainer") && u.status === "approved"
      );
      const professionalIds = new Set(professionalUsers.map(u => u.id));
      activeChatUsers = allUsers.filter(u => otherUserIds.has(u.id) || professionalIds.has(u.id));
    } else if (role === "trainer") {
      const members = allUsers.filter(u => u.role === "member" && u.status === "approved");
      const memberIds = new Set(members.map(m => m.id));
      activeChatUsers = allUsers.filter(u => otherUserIds.has(u.id) || memberIds.has(u.id));
    } else {
      activeChatUsers = allUsers.filter(u => otherUserIds.has(u.id));
    }
    
    res.json(activeChatUsers);
  });

  app.get("/api/messages/:otherUserId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const messages = await storage.getPrivateMessages((req.user as any).id, parseInt(req.params.otherUserId));
    res.json(messages);
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { receiverId, content } = req.body;
    const sender = req.user as any;
    
    const message = await storage.createPrivateMessage({
      senderId: sender.id,
      receiverId,
      content
    });

    // @ts-ignore
    if (global.io) {
      // @ts-ignore
      global.io.emit("new_message", message);
    }

    await storage.createNotification({
      userId: receiverId,
      type: "chat",
      title: "New Message",
      message: `${sender.name}: "${content.length > 50 ? content.substring(0, 50) + '...' : content}"`,
      read: false
    });

    res.status(201).json(message);
  });

  if (app.get("env") === "development") {
    const existingTrainer = await storage.getUserByUsername("trainer");
    if (!existingTrainer) {
      const hashedPassword = await hashPassword("trainer123");
      const trainer = await storage.createUser({
        username: "trainer",
        email: "trainer@PoseFit.com",
        password: hashedPassword,
        role: "trainer",
        name: "John Trainer",
      });
      await storage.updateUser(trainer.id, { status: "approved" });
      
      await storage.createWorkout({
        title: "Full Body Blast",
        description: "A complete workout for all muscle groups.",
        trainerId: trainer.id,
        difficulty: "medium",
        exercises: [
          { name: "Squats", duration: 60, target: "legs" },
          { name: "Pushups", duration: 45, target: "chest" },
          { name: "Plank", duration: 60, target: "core" }
        ]
      });
    }

    const existingAdmin = await storage.getUserByUsername("muhammadabdullahsaeed383@gmail.com");
    if (!existingAdmin) {
      const hashedPassword = await hashPassword("abdullah1122");
      const admin = await storage.createUser({
        username: "muhammadabdullahsaeed383@gmail.com",
        email: "muhammadabdullahsaeed383@gmail.com",
        password: hashedPassword,
        role: "admin",
        name: "Muhammad Abdullah Saeed",
      });
      await storage.updateUser(admin.id, { status: "approved" });
    }
  }

  app.get(api.workouts.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const workouts = await storage.getWorkouts();
    res.json(workouts);
  });

  app.get(api.workouts.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const workout = await storage.getWorkout(Number(req.params.id));
    if (!workout) return res.sendStatus(404);
    res.json(workout);
  });

  app.post(api.workouts.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // @ts-ignore
    if (req.user.role !== "trainer") return res.status(403).send("Only trainers can create workouts");
    try {
      const input = api.workouts.create.input.parse(req.body);
      const workout = await storage.createWorkout(input);
      res.status(201).json(workout);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json(err.errors);
      else res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/workouts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // @ts-ignore
    if (req.user.role !== "trainer") return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const workout = await storage.getWorkout(id);
    if (!workout) return res.sendStatus(404);
    // @ts-ignore
    if (workout.trainerId !== req.user.id) return res.sendStatus(403);
    
    try {
      const updated = await storage.updateWorkout(id, req.body);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Failed to update workout" });
    }
  });

  app.delete("/api/workouts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // @ts-ignore
    if (req.user.role !== "trainer") return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const workout = await storage.getWorkout(id);
    if (!workout) return res.sendStatus(404);
    // @ts-ignore
    if (workout.trainerId !== req.user.id) return res.sendStatus(403);
    
    try {
      await storage.deleteWorkout(id);
      res.sendStatus(200);
    } catch (err) {
      res.status(500).json({ message: "Failed to delete workout" });
    }
  });

  app.post(api.sessions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.sessions.create.input.parse(req.body);
      const session = await storage.createSession(input);
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) res.status(400).json(err.errors);
      else res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.sessions.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;

    if (user.role === "trainer" || user.role === "admin") {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : null;
      if (userId) {
        const sessions = await storage.getSessions(userId);
        return res.json(sessions);
      }
      const sessions = await storage.getAllSessions();
      return res.json(sessions);
    } else {
      const sessions = await storage.getSessions(user.id);
      return res.json(sessions);
    }
  });

  app.get(api.leaderboard.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const leaderboard = await storage.getLeaderboard();
    res.json(leaderboard);
  });

  app.get(api.achievements.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = parseInt(req.params.userId);
    const achievements = await storage.getAchievements(userId);
    res.json(achievements);
  });

  app.get(api.notifications.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const list = await storage.getNotifications(user.id);
    res.json(list);
  });

  app.patch(api.notifications.read.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    await storage.markNotificationRead(id);
    res.sendStatus(200);
  });

  app.patch("/api/sessions/:id/feedback", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // @ts-ignore
    if (req.user.role !== "trainer") return res.sendStatus(403);
    const { feedback } = req.body;
    const session = await storage.updateSessionFeedback(Number(req.params.id), feedback);
    
    await storage.createNotification({
      userId: session.userId,
      title: "New Trainer Feedback",
      message: "Your trainer has left feedback on your recent session.",
      type: "info",
      read: false
    });
    res.json(session);
  });

  app.get(api.admin.users.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // @ts-ignore
    if (req.user.role !== "admin") return res.sendStatus(403);
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.patch(api.admin.users.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // @ts-ignore
    if (req.user.role !== "admin") return res.sendStatus(403);
    try {
      const id = parseInt(req.params.id);
      const input = api.admin.users.update.input.parse(req.body);
      const user = await storage.updateUser(id, input);
      res.json(user);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  app.delete(api.admin.users.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // @ts-ignore
    if (req.user.role !== "admin") return res.sendStatus(403);
    const id = parseInt(req.params.id);
    await storage.deleteUser(id);
    res.sendStatus(200);
  });

  app.get("/api/admin/subscriptions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== "admin") return res.sendStatus(403);
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    
    try {
      const results = await storage.getSubscriptions(year);
      // Ensure results are always an array
      res.json(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error("[API] Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.post("/api/admin/subscriptions/toggle", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // @ts-ignore
    if (req.user.role !== "admin") return res.sendStatus(403);
    const { userId, year, month } = req.body;
    const sub = await storage.toggleSubscription(userId, year, month);
    res.json(sub);
  });

  return httpServer;
}

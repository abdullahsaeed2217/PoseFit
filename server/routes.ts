import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { registerAiRoutes } from "./ai-routes";
import { api } from "@shared/routes";
import { z } from "zod";
import { hashPassword } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);
  registerAiRoutes(app);

  // SEED DATA
  if (app.get("env") === "development") {
    const existingTrainer = await storage.getUserByUsername("trainer");
    if (!existingTrainer) {
      const hashedPassword = await hashPassword("trainer123");
      const trainer = await storage.createUser({
        username: "trainer",
        email: "trainer@posetofit.com",
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
      console.log("Seeded trainer account: trainer / trainer123");
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
      console.log("Seeded admin account: muhammadabdullahsaeed383@gmail.com / abdullah1122");
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
    // @ts-ignore
    if (req.user.role === "trainer") {
      const sessions = await storage.getAllSessions();
      res.json(sessions);
    } else {
      // @ts-ignore
      const sessions = await storage.getSessions(req.user.id);
      res.json(sessions);
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
    // @ts-ignore
    const list = await storage.getNotifications(req.user.id);
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

  app.get("/api/admin/subscriptions/:year", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // @ts-ignore
    if (req.user.role !== "admin") return res.sendStatus(403);
    const year = parseInt(req.params.year);
    const subs = await storage.getSubscriptions(year);
    res.json(subs);
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

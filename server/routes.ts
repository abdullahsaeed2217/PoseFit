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

  // SEED DATA
  if (app.get("env") === "development") {
    const existingTrainer = await storage.getUserByUsername("trainer");
    if (!existingTrainer) {
      const hashedPassword = await hashPassword("trainer123");
      const trainer = await storage.createUser({
        username: "trainer",
        password: hashedPassword,
        role: "trainer",
        name: "John Trainer",
      });
      
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
      await storage.createUser({
        username: "muhammadabdullahsaeed383@gmail.com",
        password: hashedPassword,
        role: "admin",
        name: "Muhammad Abdullah Saeed",
      });
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
      if (err instanceof z.ZodError) {
        res.status(400).json(err.errors);
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.sessions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.sessions.create.input.parse(req.body);
      const session = await storage.createSession(input);
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json(err.errors);
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
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

  app.patch("/api/sessions/:id/feedback", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // @ts-ignore
    if (req.user.role !== "trainer") return res.sendStatus(403);
    const { feedback } = req.body;
    const session = await storage.updateSessionFeedback(Number(req.params.id), feedback);
    res.json(session);
  });

  // ADMIN ROUTES
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

  return httpServer;
}

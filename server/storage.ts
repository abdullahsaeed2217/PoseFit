import { db } from "./db";
import { users, workouts, sessions, achievements, notifications, type User, type InsertUser, type Workout, type InsertWorkout, type Session, type InsertSession, type Achievement, type InsertAchievement, type Notification, type InsertNotification } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  getWorkouts(): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  
  createSession(session: InsertSession): Promise<Session>;
  getSessions(userId: number): Promise<Session[]>;
  getAllSessions(): Promise<Session[]>;
  updateSessionFeedback(sessionId: number, feedback: string): Promise<Session>;

  // Leaderboard & Achievements
  getLeaderboard(): Promise<User[]>;
  getAchievements(userId: number): Promise<Achievement[]>;
  awardAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateUserPoints(userId: number, points: number): Promise<void>;

  // Notifications
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;

  // Admin Panel
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<InsertUser | { status: string, totalPoints: number }>): Promise<User>;
  deleteUser(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }

  async getWorkouts(): Promise<Workout[]> {
    return await db.select().from(workouts);
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    return workout;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db.insert(sessions).values(session).returning();
    // Award points based on session score
    if (session.score) {
      await this.updateUserPoints(session.userId, session.score);
    }
    return newSession;
  }

  async getSessions(userId: number): Promise<Session[]> {
    return await db.select().from(sessions).where(eq(sessions.userId, userId));
  }
  
  async getAllSessions(): Promise<Session[]> {
    return await db.select().from(sessions);
  }

  async updateSessionFeedback(sessionId: number, feedback: string): Promise<Session> {
    const [updated] = await db.update(sessions)
      .set({ feedback })
      .where(eq(sessions.id, sessionId))
      .returning();
    return updated;
  }

  async getLeaderboard(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "member")).orderBy(desc(users.totalPoints)).limit(10);
  }

  async getAchievements(userId: number): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.userId, userId));
  }

  async awardAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }

  async updateUserPoints(userId: number, points: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      const newPoints = (user.totalPoints || 0) + points;
      await db.update(users)
        .set({ totalPoints: newPoints })
        .where(eq(users.id, userId));
      
      // Auto-award notification for workout completion
      await this.createNotification({
        userId,
        title: "Workout Completed!",
        message: `You earned ${points} points for your session. Keep it up!`,
        type: "success",
        read: false
      });
    }
  }

  async getNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, updates: any): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
}

export const storage = new DatabaseStorage();

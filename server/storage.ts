import { db } from "./db";
import { users, workouts, sessions, achievements, notifications, subscriptions, aiPostureAnalysis, privateMessages, type User, type InsertUser, type Workout, type InsertWorkout, type Session, type InsertSession, type Achievement, type InsertAchievement, type Notification, type InsertNotification, type AiPostureAnalysis, type InsertAiPostureAnalysis, type PrivateMessage, type InsertPrivateMessage } from "@shared/schema";

export type Subscription = typeof subscriptions.$inferSelect;
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getPrivateMessagesForUser(userId: number): Promise<PrivateMessage[]>;
  
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  getWorkouts(): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout>;
  deleteWorkout(id: number): Promise<void>;
  
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

  // AI Posture Analysis
  createAiPostureAnalysis(analysis: InsertAiPostureAnalysis): Promise<AiPostureAnalysis>;
  getAiPostureAnalysis(userId: number): Promise<AiPostureAnalysis[]>;

  // Private Messages
  createPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage>;
  getPrivateMessages(userA: number, userB: number): Promise<PrivateMessage[]>;
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

  async updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout> {
    const [updated] = await db
      .update(workouts)
      .set(workout)
      .where(eq(workouts.id, id))
      .returning();
    return updated;
  }

  async deleteWorkout(id: number): Promise<void> {
    await db.delete(workouts).where(eq(workouts.id, id));
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

  async getSubscriptions(year: number): Promise<(Subscription & { user: User })[]> {
    const approvedUsers = await db.select().from(users).where(and(eq(users.role, "member"), eq(users.status, "approved")));
    
    if (approvedUsers.length === 0) return [];

    const subs = await db.select().from(subscriptions).where(eq(subscriptions.year, year));
    
    return approvedUsers.map(user => {
      const subRecord = subs.find(s => s.userId === user.id);
      return {
        id: subRecord?.id || 0,
        userId: user.id,
        year,
        months: (subRecord?.months as any) || {
          jan: false, feb: false, mar: false, apr: false,
          may: false, jun: false, jul: false, aug: false,
          sep: false, oct: false, nov: false, dec: false
        },
        updatedAt: subRecord?.updatedAt || new Date(),
        user
      };
    });
  }

  async toggleSubscription(userId: number, year: number, month: string): Promise<Subscription> {
    const [existing] = await db.select().from(subscriptions).where(and(eq(subscriptions.userId, userId), eq(subscriptions.year, year)));
    
    if (existing) {
      const currentMonths = (existing.months as Record<string, boolean>) || {};
      const months = { ...currentMonths, [month]: !currentMonths[month] };
      const [updated] = await db.update(subscriptions)
        .set({ months, updatedAt: new Date() })
        .where(eq(subscriptions.id, existing.id))
        .returning();
      return updated;
    } else {
      const months = {
        jan: false, feb: false, mar: false, apr: false,
        may: false, jun: false, jul: false, aug: false,
        sep: false, oct: false, nov: false, dec: false,
        [month]: true
      };
      const [inserted] = await db.insert(subscriptions)
        .values({ userId, year, months })
        .returning();
      return inserted;
    }
  }

  async createAiPostureAnalysis(analysis: InsertAiPostureAnalysis): Promise<AiPostureAnalysis> {
    const [result] = await db.insert(aiPostureAnalysis).values(analysis).returning();
    return result;
  }

  async getAiPostureAnalysis(userId: number): Promise<AiPostureAnalysis[]> {
    return await db.select().from(aiPostureAnalysis).where(eq(aiPostureAnalysis.userId, userId)).orderBy(desc(aiPostureAnalysis.createdAt));
  }

  async createPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage> {
    const [result] = await db.insert(privateMessages).values(message).returning();
    return result;
  }

  async getPrivateMessages(userA: number, userB: number): Promise<PrivateMessage[]> {
    return await db.select()
      .from(privateMessages)
      .where(
        sql`(${privateMessages.senderId} = ${userA} AND ${privateMessages.receiverId} = ${userB}) OR 
            (${privateMessages.senderId} = ${userB} AND ${privateMessages.receiverId} = ${userA})`
      )
      .orderBy(privateMessages.createdAt);
  }

  async getPrivateMessagesForUser(userId: number): Promise<PrivateMessage[]> {
    return await db.select()
      .from(privateMessages)
      .where(
        sql`${privateMessages.senderId} = ${userId} OR ${privateMessages.receiverId} = ${userId}`
      );
  }
}

export const storage = new DatabaseStorage();

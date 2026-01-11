import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const aiPostureAnalysis = pgTable("ai_posture_analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  workoutId: integer("workout_id"),
  analysis: text("analysis").notNull(),
  postureScore: integer("posture_score").notNull(),
  feedback: text("feedback").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiPostureAnalysisSchema = createInsertSchema(aiPostureAnalysis).omit({ id: true, createdAt: true });
export type AiPostureAnalysis = typeof aiPostureAnalysis.$inferSelect;
export type InsertAiPostureAnalysis = z.infer<typeof insertAiPostureAnalysisSchema>;

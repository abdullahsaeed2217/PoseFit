import { Express } from "express";
import OpenAI from "openai";
import { api } from "@shared/routes";
import { storage } from "./storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export function registerAiRoutes(app: Express) {
  app.post(api.ai.analyzePosture.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { image, workoutName } = api.ai.analyzePosture.input.parse(req.body);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Use gpt-4o for vision capabilities
        messages: [
          {
            role: "system",
            content: "You are an expert AI fitness coach. Analyze the user's workout posture from the image and provide specific feedback and a posture score (0-100)."
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Analyze my posture for ${workoutName || 'this exercise'}.` },
              {
                type: "image_url",
                image_url: {
                  url: image, // base64 data URL
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Save analysis to storage
      // @ts-ignore
      await storage.createAiPostureAnalysis({
        userId: req.user.id,
        analysis: result.analysis || "Analysis complete",
        postureScore: result.postureScore || 80,
        feedback: result.feedback || "Good job, keep it up!",
      });

      res.json({
        analysis: result.analysis || "Analysis complete",
        postureScore: result.postureScore || 80,
        feedback: result.feedback || "Good job, keep it up!",
      });
    } catch (err) {
      console.error("AI Analysis error:", err);
      res.status(400).json({ message: "Failed to analyze posture" });
    }
  });
}

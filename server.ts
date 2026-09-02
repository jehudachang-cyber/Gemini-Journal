import express from "express";
import type { Request, Response } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Determine whether we are in dev mode or production
// In production Cloud Run or when running standalone, static assets are served and Vite is never loaded
const isDev = process.env.DEV_MODE === "true" || process.env.npm_lifecycle_event === "dev";
const isProduction = !isDev;
if (isProduction) {
  process.env.NODE_ENV = "production";
}

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with a safe payload limit to prevent DoS
app.use(express.json({ limit: "1mb" }));

// Initialize GoogleGenAI lazily to ensure environment variables are present and handle errors gracefully
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in environment variables.");
    }
    genAIClient = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return genAIClient;
}

// Resilient Gemini model caller with automatic fallback
async function callGemini(params: {
  contents: any;
  config?: any;
}) {
  const ai = getGenAI();
  // Primary model is gemini-3.6-flash as recommended; fallback to gemini-3.8-flash
  const models = ["gemini-3.6-flash", "gemini-3.8-flash"];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} request failed: ${err?.message || err}. Trying next model if available...`);
    }
  }

  throw lastError;
}

// Input sanitization helper to mitigate XSS and injection
function sanitizeText(input: unknown, maxLength: number = 10000): string {
  if (typeof input !== "string") return "";
  // Strip control characters except newline and tab
  return input
    .slice(0, maxLength)
    .replace(/[^\x20-\x7E\t\n\r\u00A0-\uFFFF]/g, "")
    .trim();
}

// System prompt for the introspective AI Journal partner
const JOURNAL_PARTNER_SYSTEM_PROMPT = `
You are a deeply empathetic, thoughtful, and insightful personal journaling companion and creative brainstorming partner.
Your goal is to help the user explore their thoughts, reflect on their day, unpack complex emotions, brainstorm solutions to challenges, and cultivate self-awareness.

Guidelines:
- Listen actively and validate their feelings without being patronizing or overly clinical.
- Ask 1 or 2 open-ended, thought-provoking questions that invite deeper reflection.
- If the user is brainstorming, offer structured perspectives, lateral ideas, or alternative viewpoints.
- If the user experiences stress or anxiety, offer calming reframing and grounded, constructive encouragement.
- Keep responses concise (2-4 brief paragraphs max) so the journal remains the user's space to write.
- Avoid robotic phrases like "As an AI". Speak naturally with warmth, curiosity, and calm poise.
`;

// API Route: Multi-turn Chat for Journaling
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { messages, entryContext } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Messages array is required." });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: "GEMINI_API_KEY is not configured on the server. Please check your settings.",
      });
      return;
    }

    // Format conversation history for Gemini API
    const contents = messages.map((m: { role: string; content: string }) => {
      const role = m.role === "user" ? "user" : "model";
      const sanitized = sanitizeText(m.content, 4000);
      return {
        role,
        parts: [{ text: sanitized }],
      };
    });

    const contextSanitized = sanitizeText(entryContext, 2000);
    const systemInstruction = contextSanitized
      ? `${JOURNAL_PARTNER_SYSTEM_PROMPT}\n\nUser's initial focus / context for this session: "${contextSanitized}"`
      : JOURNAL_PARTNER_SYSTEM_PROMPT;

    const response = await callGemini({
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    const replyText = response.text || "I'm reflecting on what you wrote. What else is on your mind?";
    res.json({ reply: replyText });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate AI response. Please try again.",
    });
  }
});

// API Route: Summarize session, extract primary emotion, emotion score, and key topics
app.post("/api/analyze-entry", async (req: Request, res: Response) => {
  try {
    const { messages, entryContext } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Session transcript is required." });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: "GEMINI_API_KEY is not configured on the server.",
      });
      return;
    }

    // Compile full dialogue into a readable transcript
    const transcript = messages
      .map((m: { role: string; content: string }) => {
        const sender = m.role === "user" ? "User" : "Gemini";
        return `${sender}: ${sanitizeText(m.content, 3000)}`;
      })
      .join("\n\n");

    const analysisPrompt = `
Analyze the following personal journal session between the user and Gemini.
Perform the following strictly:
1. Generate a concise, meaningful title (3 to 6 words).
2. Generate a thoughtful, comprehensive summary of the session (2 to 4 sentences) capturing the core reflections, realizations, or brainstormed ideas.
3. Determine the primary emotion dominant in this journal entry. Choose the single best fit from this set:
   ["Joy", "Gratitude", "Motivation", "Excitement", "Calm", "Contentment", "Contemplative", "Stress", "Anxiety", "Sadness", "Frustration", "Fatigue", "Overwhelmed", "Uncertainty"]
4. Assign an emotion score on a 1 to 10 scale (where 1 = deeply distressed/overwhelmed, 5 = balanced/neutral contemplative, 10 = exceptionally joyful/inspired).
5. Extract 2 to 5 specific key topics discussed (e.g. "Career Growth", "Deep Relationships", "Sleep & Health", "Creative Writing", "Mindset Shift", "Time Management").
6. Highlight a key takeaway or self-realization (1 sentence).

Journal Transcript:
${transcript}

${entryContext ? `Additional User Context: ${sanitizeText(entryContext, 1000)}` : ""}

Respond ONLY with valid JSON conforming to this schema:
{
  "title": "string",
  "summary": "string",
  "primaryEmotion": "Joy" | "Gratitude" | "Motivation" | "Excitement" | "Calm" | "Contentment" | "Contemplative" | "Stress" | "Anxiety" | "Sadness" | "Frustration" | "Fatigue" | "Overwhelmed" | "Uncertainty",
  "emotionScore": number,
  "topics": ["string", "string"],
  "keyInsight": "string"
}
`;

    const response = await callGemini({
      contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const responseText = response.text || "{}";
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("Failed to parse JSON response from Gemini:", responseText);
      // Fallback object
      parsedData = {
        title: "Personal Journal Session",
        summary: "A reflective conversation exploring personal thoughts and experiences.",
        primaryEmotion: "Contemplative",
        emotionScore: 6,
        topics: ["Personal Growth", "Reflection"],
        keyInsight: "Taking time to articulate thoughts brings clarity.",
      };
    }

    // Sanitize and normalize fields
    const allowedEmotions = [
      "Joy", "Gratitude", "Motivation", "Excitement", "Calm", "Contentment",
      "Contemplative", "Stress", "Anxiety", "Sadness", "Frustration",
      "Fatigue", "Overwhelmed", "Uncertainty"
    ];

    let primaryEmotion = parsedData.primaryEmotion;
    if (!allowedEmotions.includes(primaryEmotion)) {
      primaryEmotion = "Contemplative";
    }

    let emotionScore = Number(parsedData.emotionScore);
    if (isNaN(emotionScore) || emotionScore < 1 || emotionScore > 10) {
      emotionScore = 6;
    }

    const topics = Array.isArray(parsedData.topics)
      ? parsedData.topics.slice(0, 5).map((t: any) => String(t).trim().slice(0, 30))
      : ["Personal Growth"];

    res.json({
      title: sanitizeText(parsedData.title || "Reflective Journal Session", 100),
      summary: sanitizeText(parsedData.summary || "Journal session completed.", 1000),
      primaryEmotion,
      emotionScore,
      topics,
      keyInsight: sanitizeText(parsedData.keyInsight || "", 300),
    });
  } catch (error: any) {
    console.error("Error in /api/analyze-entry:", error);
    res.status(500).json({
      error: error?.message || "Failed to analyze journal entry.",
    });
  }
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

async function startServer() {
  // Vite integration: middleware for development, static serve for production
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = typeof __dirname !== "undefined" && fs.existsSync(path.join(__dirname, "index.html"))
      ? __dirname
      : path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} [mode: ${process.env.NODE_ENV}]`);
  });
}

startServer();

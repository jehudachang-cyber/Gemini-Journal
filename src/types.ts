export type EmotionType =
  | "Joy"
  | "Gratitude"
  | "Motivation"
  | "Excitement"
  | "Calm"
  | "Contentment"
  | "Contemplative"
  | "Stress"
  | "Anxiety"
  | "Sadness"
  | "Frustration"
  | "Fatigue"
  | "Overwhelmed"
  | "Uncertainty";

export interface EmotionMeta {
  name: EmotionType;
  label: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  category: "positive" | "peaceful" | "challenging" | "reflective";
  iconName: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  formattedDate?: string;
  chatLog: ChatMessage[];
  summary: string;
  primaryEmotion: EmotionType;
  emotionScore: number; // 1 to 10
  topics: string[];
  keyInsight?: string;
  wordCount: number;
  sessionDurationSeconds?: number;
}

export interface TopicFrequency {
  topic: string;
  count: number;
  percentage: number;
}

export interface MoodTrendPoint {
  date: string;
  timestamp: number;
  score: number;
  emotion: EmotionType;
  title: string;
  entryId: string;
}

export type TimeRangeFilter = "7d" | "30d" | "all";

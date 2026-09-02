import { EmotionMeta, EmotionType } from "../types";

export const EMOTIONS_MAP: Record<EmotionType, EmotionMeta> = {
  Joy: {
    name: "Joy",
    label: "Joyful",
    color: "#f59e0b", // Amber/Gold
    badgeBg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    badgeText: "text-amber-800 dark:text-amber-300",
    dotColor: "bg-amber-500",
    category: "positive",
    iconName: "Sun",
  },
  Gratitude: {
    name: "Gratitude",
    label: "Grateful",
    color: "#10b981", // Emerald
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    badgeText: "text-emerald-800 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
    category: "positive",
    iconName: "Heart",
  },
  Motivation: {
    name: "Motivation",
    label: "Motivated",
    color: "#ea580c", // Orange
    badgeBg: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800",
    badgeText: "text-orange-800 dark:text-orange-300",
    dotColor: "bg-orange-500",
    category: "positive",
    iconName: "Zap",
  },
  Excitement: {
    name: "Excitement",
    label: "Excited",
    color: "#d946ef", // Fuchsia
    badgeBg: "bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-200 dark:border-fuchsia-800",
    badgeText: "text-fuchsia-800 dark:text-fuchsia-300",
    dotColor: "bg-fuchsia-500",
    category: "positive",
    iconName: "Sparkles",
  },
  Calm: {
    name: "Calm",
    label: "Calm",
    color: "#06b6d4", // Cyan
    badgeBg: "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800",
    badgeText: "text-cyan-800 dark:text-cyan-300",
    dotColor: "bg-cyan-500",
    category: "peaceful",
    iconName: "Wind",
  },
  Contentment: {
    name: "Contentment",
    label: "Content",
    color: "#14b8a6", // Teal
    badgeBg: "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800",
    badgeText: "text-teal-800 dark:text-teal-300",
    dotColor: "bg-teal-500",
    category: "peaceful",
    iconName: "Smile",
  },
  Contemplative: {
    name: "Contemplative",
    label: "Reflective",
    color: "#6366f1", // Indigo
    badgeBg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800",
    badgeText: "text-indigo-800 dark:text-indigo-300",
    dotColor: "bg-indigo-500",
    category: "reflective",
    iconName: "Compass",
  },
  Stress: {
    name: "Stress",
    label: "Stressed",
    color: "#ef4444", // Red
    badgeBg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
    badgeText: "text-rose-800 dark:text-rose-300",
    dotColor: "bg-rose-500",
    category: "challenging",
    iconName: "Flame",
  },
  Anxiety: {
    name: "Anxiety",
    label: "Anxious",
    color: "#f43f5e", // Rose
    badgeBg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
    badgeText: "text-rose-800 dark:text-rose-300",
    dotColor: "bg-rose-500",
    category: "challenging",
    iconName: "AlertCircle",
  },
  Sadness: {
    name: "Sadness",
    label: "Sad",
    color: "#3b82f6", // Blue
    badgeBg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    badgeText: "text-blue-800 dark:text-blue-300",
    dotColor: "bg-blue-500",
    category: "challenging",
    iconName: "CloudRain",
  },
  Frustration: {
    name: "Frustration",
    label: "Frustrated",
    color: "#e11d48", // Rose Red
    badgeBg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    badgeText: "text-red-800 dark:text-red-300",
    dotColor: "bg-red-500",
    category: "challenging",
    iconName: "ShieldAlert",
  },
  Fatigue: {
    name: "Fatigue",
    label: "Exhausted",
    color: "#78716c", // Stone
    badgeBg: "bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800",
    badgeText: "text-stone-800 dark:text-stone-300",
    dotColor: "bg-stone-500",
    category: "challenging",
    iconName: "BatteryLow",
  },
  Overwhelmed: {
    name: "Overwhelmed",
    label: "Overwhelmed",
    color: "#dc2626", // Red
    badgeBg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    badgeText: "text-red-800 dark:text-red-300",
    dotColor: "bg-red-500",
    category: "challenging",
    iconName: "CloudLightning",
  },
  Uncertainty: {
    name: "Uncertainty",
    label: "Uncertain",
    color: "#8b5cf6", // Violet
    badgeBg: "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800",
    badgeText: "text-violet-800 dark:text-violet-300",
    dotColor: "bg-violet-500",
    category: "reflective",
    iconName: "HelpCircle",
  },
};

export function getEmotionMeta(emotion?: string): EmotionMeta {
  if (emotion && emotion in EMOTIONS_MAP) {
    return EMOTIONS_MAP[emotion as EmotionType];
  }
  return EMOTIONS_MAP.Contemplative;
}

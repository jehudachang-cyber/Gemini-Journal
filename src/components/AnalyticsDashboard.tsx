import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  BarChart2,
  Smile,
  Tag,
  BookOpen,
  Calendar,
  Lightbulb,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";
import { JournalEntry, TimeRangeFilter } from "../types";
import { getEmotionMeta, EMOTIONS_MAP } from "../lib/emotions";

interface AnalyticsDashboardProps {
  entries: JournalEntry[];
  onStartJournal: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  entries,
  onStartJournal,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>("30d");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Filter entries based on selected time range
  const filteredEntries = useMemo(() => {
    const now = Date.now();
    let cutoff = 0;
    if (timeRange === "7d") {
      cutoff = now - 7 * 24 * 60 * 60 * 1000;
    } else if (timeRange === "30d") {
      cutoff = now - 30 * 24 * 60 * 60 * 1000;
    }

    return entries
      .filter((e) => e.createdAt >= cutoff)
      .sort((a, b) => a.createdAt - b.createdAt); // Ascending for time series chart
  }, [entries, timeRange]);

  // Aggregate Mood Trend data points
  const moodTrendData = useMemo(() => {
    return filteredEntries.map((e) => {
      const dateObj = new Date(e.createdAt);
      const formattedDate = dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const meta = getEmotionMeta(e.primaryEmotion);

      return {
        id: e.id,
        date: formattedDate,
        fullDate: dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        timestamp: e.createdAt,
        score: e.emotionScore || 6,
        emotion: e.primaryEmotion,
        emotionColor: meta.color,
        title: e.title,
        summary: e.summary,
      };
    });
  }, [filteredEntries]);

  // Aggregate Topic Frequencies
  const topicFrequencies = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEntries.forEach((entry) => {
      if (Array.isArray(entry.topics)) {
        entry.topics.forEach((t) => {
          const norm = t.trim();
          if (norm) {
            counts[norm] = (counts[norm] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(counts)
      .map(([topic, count]) => ({
        topic,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 topics
  }, [filteredEntries]);

  // Aggregate Emotion Distribution
  const emotionDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEntries.forEach((entry) => {
      const emotion = entry.primaryEmotion || "Contemplative";
      counts[emotion] = (counts[emotion] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([emotion, count]) => {
        const meta = getEmotionMeta(emotion);
        return {
          emotion,
          count,
          color: meta.color,
          meta,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [filteredEntries]);

  // Summary Metrics
  const metrics = useMemo(() => {
    if (filteredEntries.length === 0) {
      return {
        totalEntries: 0,
        averageScore: 0,
        dominantEmotion: "None",
        topTopic: "None",
        totalWords: 0,
      };
    }

    const totalWords = filteredEntries.reduce((acc, e) => acc + (e.wordCount || 0), 0);
    const scoreSum = filteredEntries.reduce((acc, e) => acc + (e.emotionScore || 6), 0);
    const avgScore = (scoreSum / filteredEntries.length).toFixed(1);

    const dominantEmotion =
      emotionDistribution.length > 0 ? emotionDistribution[0].emotion : "Contemplative";
    const topTopic = topicFrequencies.length > 0 ? topicFrequencies[0].topic : "General";

    return {
      totalEntries: filteredEntries.length,
      averageScore: Number(avgScore),
      dominantEmotion,
      topTopic,
      totalWords,
    };
  }, [filteredEntries, emotionDistribution, topicFrequencies]);

  // Insights list
  const recentInsights = useMemo(() => {
    return filteredEntries
      .filter((e) => !!e.keyInsight)
      .slice(-4)
      .reverse();
  }, [filteredEntries]);

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-500 shadow-inner dark:bg-stone-800 dark:text-stone-400">
          <TrendingUp className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Your Analytics Dashboard
        </h2>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-stone-500 dark:text-stone-400">
          Once you complete your first journal session, Gemini will automatically synthesize your thoughts, track your emotional mood trends over time, and chart your most frequent topics here.
        </p>
        <button
          id="btn-start-first-journal"
          onClick={onStartJournal}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
        >
          <Sparkles className="h-4 w-4 text-amber-400 dark:text-amber-600" />
          <span>Write First Journal Session</span>
        </button>
      </div>
    );
  }

  const dominantMeta = getEmotionMeta(metrics.dominantEmotion);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200/80 pb-4 dark:border-stone-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Insights & Mood Analytics
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Real-time emotional tracking and topic frequency extracted by Gemini
          </p>
        </div>

        {/* Time range switcher */}
        <div className="flex items-center gap-1 rounded-lg bg-stone-200/60 p-1 dark:bg-stone-900">
          {(["7d", "30d", "all"] as TimeRangeFilter[]).map((range) => (
            <button
              key={range}
              id={`btn-timerange-${range}`}
              onClick={() => setTimeRange(range)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                timeRange === range
                  ? "bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-stone-50"
                  : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              }`}
            >
              {range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Total Entries</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100">
            {metrics.totalEntries}
          </div>
          <div className="mt-1 text-[11px] text-stone-400">
            {metrics.totalWords.toLocaleString()} words journaled
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
            <Smile className="h-3.5 w-3.5" />
            <span>Dominant Emotion</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${dominantMeta.badgeBg} ${dominantMeta.badgeText}`}
            >
              <span className={`h-2 w-2 rounded-full ${dominantMeta.dotColor}`} />
              {metrics.dominantEmotion}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-stone-400">Most frequent feeling</div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Average Valence</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {metrics.averageScore}
            </span>
            <span className="text-xs text-stone-400">/ 10</span>
          </div>
          <div className="mt-1 text-[11px] text-stone-400">
            {metrics.averageScore >= 7
              ? "Positive & Uplifted"
              : metrics.averageScore >= 5
              ? "Balanced & Reflective"
              : "Navigating Challenges"}
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
            <Tag className="h-3.5 w-3.5" />
            <span>Primary Focus</span>
          </div>
          <div className="mt-2 text-sm font-semibold truncate text-stone-900 dark:text-stone-100">
            {metrics.topTopic}
          </div>
          <div className="mt-1 text-[11px] text-stone-400">Most discussed theme</div>
        </div>
      </div>

      {/* Chart Section 1: Mood Trends Over Time */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs dark:border-stone-800 dark:bg-stone-900 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              Mood Trends Over Time
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Valence scale (1-10) evaluated by Gemini from your journal reflections
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-stone-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Positive (7-10)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span>Balanced (5-6)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Stress/Sadness (1-4)</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={moodTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.6} />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[1, 10]}
                ticks={[2, 4, 6, 8, 10]}
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <ReferenceLine
                y={5}
                stroke="#9ca3af"
                strokeDasharray="4 4"
                label={{
                  value: "Neutral Baseline (5)",
                  position: "insideBottomRight",
                  fill: "#9ca3af",
                  fontSize: 10,
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const meta = getEmotionMeta(data.emotion);
                    return (
                      <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-lg dark:border-stone-700 dark:bg-stone-800 max-w-xs text-xs">
                        <div className="text-[11px] font-medium text-stone-400">
                          {data.fullDate}
                        </div>
                        <div className="font-semibold text-stone-900 dark:text-stone-100 mt-1">
                          {data.title}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2 border-t border-stone-100 pt-2 dark:border-stone-700">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${meta.badgeBg} ${meta.badgeText}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dotColor}`} />
                            {data.emotion}
                          </span>
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            Score: {data.score}/10
                          </span>
                        </div>
                        {data.summary && (
                          <p className="mt-1.5 text-[11px] text-stone-600 dark:text-stone-300 line-clamp-2">
                            {data.summary}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#4f46e5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#moodGradient)"
                activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Most Frequent Topics & Emotion Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Most Frequent Journaling Topics */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs dark:border-stone-800 dark:bg-stone-900 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Most Frequent Topics
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Themes identified and categorized across journal sessions
              </p>
            </div>
            <Tag className="h-4 w-4 text-stone-400" />
          </div>

          {topicFrequencies.length > 0 ? (
            <>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topicFrequencies}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" opacity={0.6} />
                    <XAxis type="number" stroke="#9ca3af" fontSize={11} allowDecimals={false} />
                    <YAxis
                      dataKey="topic"
                      type="category"
                      width={110}
                      stroke="#4b5563"
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs shadow-md dark:border-stone-700 dark:bg-stone-800">
                              <span className="font-semibold text-stone-900 dark:text-stone-100">
                                {item.topic}
                              </span>
                              : {item.count} session{item.count > 1 ? "s" : ""}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" fill="#1c1917" radius={[0, 4, 4, 0]}>
                      {topicFrequencies.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? "#1c1917" : index === 1 ? "#44403c" : "#78716c"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Topic pill cloud */}
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-stone-100 pt-3 dark:border-stone-800">
                {topicFrequencies.map((tf) => (
                  <span
                    key={tf.topic}
                    className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-700 dark:border-stone-800 dark:bg-stone-800 dark:text-stone-300"
                  >
                    <span>{tf.topic}</span>
                    <span className="rounded-full bg-stone-200 px-1.5 py-0.2 text-[10px] font-semibold text-stone-800 dark:bg-stone-700 dark:text-stone-200">
                      {tf.count}
                    </span>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-48 items-center justify-center text-xs text-stone-400">
              No topic data for this time period.
            </div>
          )}
        </div>

        {/* Emotion Distribution Breakdown */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs dark:border-stone-800 dark:bg-stone-900 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Emotional Breakdown
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Distribution of primary affective states across sessions
              </p>
            </div>
            <Smile className="h-4 w-4 text-stone-400" />
          </div>

          <div className="space-y-2.5">
            {emotionDistribution.map((item) => {
              const percentage = Math.round((item.count / filteredEntries.length) * 100);
              return (
                <div key={item.emotion} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.emotion}
                    </span>
                    <span className="text-stone-500 dark:text-stone-400">
                      {item.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Key Realizations & Insights from Gemini */}
      {recentInsights.length > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs dark:border-stone-800 dark:bg-stone-900 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              Reflective Takeaways & Realizations
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {recentInsights.map((entry) => {
              const meta = getEmotionMeta(entry.primaryEmotion);
              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-stone-100 bg-stone-50/70 p-4 dark:border-stone-800/80 dark:bg-stone-850"
                >
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>{entry.formattedDate}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.badgeBg} ${meta.badgeText}`}
                    >
                      {entry.primaryEmotion}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-stone-800 dark:text-stone-200">
                    "{entry.keyInsight}"
                  </p>
                  <div className="mt-2 text-[11px] text-stone-500 truncate">
                    from: {entry.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

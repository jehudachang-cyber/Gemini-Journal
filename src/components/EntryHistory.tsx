import React, { useState, useMemo } from "react";
import {
  Search,
  Calendar,
  Clock,
  Tag,
  Trash2,
  ChevronRight,
  Sparkles,
  BookOpen,
  X,
  MessageSquare,
  Smile,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { JournalEntry, EmotionType } from "../types";
import { getEmotionMeta, EMOTIONS_MAP } from "../lib/emotions";
import { useAuth } from "../context/AuthContext";
import { deleteJournalEntry } from "../lib/firebase";

interface EntryHistoryProps {
  entries: JournalEntry[];
  onStartNewSession: () => void;
  onResumeSession?: (entry: JournalEntry) => void;
}

export const EntryHistory: React.FC<EntryHistoryProps> = ({
  entries,
  onStartNewSession,
  onResumeSession,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState<string>("all");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      // Filter by emotion
      if (selectedEmotion !== "all" && e.primaryEmotion !== selectedEmotion) {
        return false;
      }

      // Search query filter (matches title, summary, key topics, or chat content)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = e.title?.toLowerCase().includes(query);
        const matchesSummary = e.summary?.toLowerCase().includes(query);
        const matchesTopics = e.topics?.some((t) => t.toLowerCase().includes(query));
        const matchesChat = e.chatLog?.some((m) => m.content.toLowerCase().includes(query));

        return matchesTitle || matchesSummary || matchesTopics || matchesChat;
      }

      return true;
    });
  }, [entries, searchQuery, selectedEmotion]);

  const handleDelete = async (entryId: string) => {
    if (!user || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteJournalEntry(user.uid, entryId);
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null);
      }
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Failed to delete entry:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200/80 pb-4 dark:border-stone-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Journal History
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Browse, search, and revisit all past journal conversations & AI summaries
          </p>
        </div>

        <button
          id="btn-history-new-session"
          onClick={onStartNewSession}
          className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Write New Entry</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            id="input-history-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries by topic, keyword, or title..."
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-xs text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-stone-900 focus:ring-1 focus:ring-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-stone-100 dark:focus:ring-stone-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Emotion Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Emotion:
          </span>
          <select
            id="select-history-emotion"
            value={selectedEmotion}
            onChange={(e) => setSelectedEmotion(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 outline-none transition focus:border-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200"
          >
            <option value="all">All Emotions</option>
            {Object.keys(EMOTIONS_MAP).map((emo) => (
              <option key={emo} value={emo}>
                {emo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 p-12 text-center dark:border-stone-800">
          <BookOpen className="mx-auto h-8 w-8 text-stone-400" />
          <h3 className="mt-3 text-sm font-semibold text-stone-800 dark:text-stone-200">
            No entries match your search
          </h3>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Try adjusting your search query or emotion filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map((entry) => {
            const meta = getEmotionMeta(entry.primaryEmotion);
            return (
              <div
                key={entry.id}
                id={`card-entry-${entry.id}`}
                onClick={() => setSelectedEntry(entry)}
                className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs transition hover:border-stone-400 hover:shadow-xs dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700"
              >
                <div>
                  {/* Date & Emotion Header */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1 text-stone-500 dark:text-stone-400">
                      <Calendar className="h-3 w-3" />
                      {entry.formattedDate ||
                        new Date(entry.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badgeBg} ${meta.badgeText}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dotColor}`} />
                      {entry.primaryEmotion}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-3 text-sm font-semibold text-stone-900 group-hover:text-stone-700 dark:text-stone-100 dark:group-hover:text-stone-300 line-clamp-1">
                    {entry.title}
                  </h3>

                  {/* Summary */}
                  <p className="mt-2 text-xs leading-relaxed text-stone-600 line-clamp-3 dark:text-stone-400">
                    {entry.summary}
                  </p>
                </div>

                <div className="mt-4 border-t border-stone-100 pt-3 dark:border-stone-800/80">
                  {/* Topic Badges */}
                  <div className="flex flex-wrap gap-1">
                    {entry.topics?.slice(0, 3).map((topic, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300"
                      >
                        {topic}
                      </span>
                    ))}
                    {entry.topics && entry.topics.length > 3 && (
                      <span className="rounded-md bg-stone-100 px-1 py-0.5 text-[10px] text-stone-400 dark:bg-stone-800">
                        +{entry.topics.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {entry.chatLog?.length || 0} messages
                    </span>
                    <span className="flex items-center gap-1 font-medium text-stone-600 group-hover:text-stone-900 dark:text-stone-400 dark:group-hover:text-stone-100">
                      <span>View details</span>
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-200/80 p-5 dark:border-stone-800">
              <div className="pr-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    {selectedEntry.formattedDate ||
                      new Date(selectedEntry.createdAt).toLocaleDateString()}
                  </span>
                  {selectedEntry.primaryEmotion && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                        getEmotionMeta(selectedEntry.primaryEmotion).badgeBg
                      } ${getEmotionMeta(selectedEntry.primaryEmotion).badgeText}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          getEmotionMeta(selectedEntry.primaryEmotion).dotColor
                        }`}
                      />
                      {selectedEntry.primaryEmotion} ({selectedEntry.emotionScore}/10)
                    </span>
                  )}
                </div>
                <h2 className="mt-1.5 text-lg font-bold text-stone-900 dark:text-stone-100">
                  {selectedEntry.title}
                </h2>
              </div>

              <button
                onClick={() => {
                  setSelectedEntry(null);
                  setConfirmDeleteId(null);
                }}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Summary Box */}
              <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4 dark:border-stone-800 dark:bg-stone-800/50">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Gemini AI Summary</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                  {selectedEntry.summary}
                </p>

                {selectedEntry.keyInsight && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200/60 bg-amber-50/60 p-2.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                    <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <span className="font-semibold">Core Insight: </span>
                      {selectedEntry.keyInsight}
                    </div>
                  </div>
                )}
              </div>

              {/* Topics */}
              <div>
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                  Topics:
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {selectedEntry.topics?.map((topic, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700 dark:border-stone-800 dark:bg-stone-800 dark:text-stone-300"
                    >
                      <Tag className="h-3 w-3 text-stone-400" />
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Chat Transcript */}
              <div>
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                  Full Conversation Transcript:
                </span>
                <div className="mt-2 space-y-3 rounded-xl border border-stone-200/80 bg-stone-50/50 p-4 dark:border-stone-800 dark:bg-stone-850">
                  {selectedEntry.chatLog?.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                      >
                        <span className="mb-1 text-[10px] font-semibold text-stone-400">
                          {isUser ? "You" : "Gemini"}
                        </span>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                            isUser
                              ? "bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900"
                              : "border border-stone-200 bg-white text-stone-800 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-stone-200/80 p-4 dark:border-stone-800">
              {confirmDeleteId === selectedEntry.id ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-red-600 font-medium">Permanently delete?</span>
                  <button
                    onClick={() => handleDelete(selectedEntry.id)}
                    disabled={isDeleting}
                    className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="rounded-md border border-stone-300 px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  id="btn-delete-entry"
                  onClick={() => setConfirmDeleteId(selectedEntry.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Entry</span>
                </button>
              )}

              <button
                onClick={() => setSelectedEntry(null)}
                className="rounded-lg bg-stone-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

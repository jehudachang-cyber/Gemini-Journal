import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Save,
  Loader2,
  CheckCircle,
  HelpCircle,
  Clock,
  FileText,
  Tag,
  Smile,
  ArrowRight,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { ChatMessage, EmotionType, JournalEntry } from "../types";
import { useAuth } from "../context/AuthContext";
import { saveJournalEntry } from "../lib/firebase";
import { sanitizeUserInput } from "../lib/sanitizer";
import { getEmotionMeta } from "../lib/emotions";

interface JournalChatProps {
  onSessionSaved: (entry: JournalEntry) => void;
  onViewAnalytics: () => void;
  initialEntry?: JournalEntry | null;
}

const PROMPT_SUGGESTIONS = [
  {
    title: "Daily Decompress",
    prompt: "I'd like to reflect on my day and unpack what made me feel energized or drained.",
    icon: "🌿",
  },
  {
    title: "Brainstorm a Decision",
    prompt: "I'm facing an important choice and want to explore different perspectives and potential trade-offs.",
    icon: "💡",
  },
  {
    title: "Work Through Stress",
    prompt: "I'm feeling a bit overwhelmed by my current responsibilities and want help breaking them down calmly.",
    icon: "🧘",
  },
  {
    title: "Gratitude & Wins",
    prompt: "I want to celebrate recent small wins and articulate things I'm genuinely grateful for today.",
    icon: "✨",
  },
];

export const JournalChat: React.FC<JournalChatProps> = ({
  onSessionSaved,
  onViewAnalytics,
  initialEntry,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialEntry?.chatLog || []
  );
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedEntryData, setSavedEntryData] = useState<JournalEntry | null>(null);
  const [sessionStartTime] = useState<number>(Date.now());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending, isSummarizing]);

  // Calculate session word count
  const totalWords = messages.reduce((acc, msg) => {
    return acc + (msg.content ? msg.content.trim().split(/\s+/).length : 0);
  }, 0);

  // Send message to Gemini for multi-turn brainstorming
  const handleSendMessage = async (customText?: string) => {
    const rawText = customText !== undefined ? customText : inputText;
    const sanitized = sanitizeUserInput(rawText, 4000);

    if (!sanitized || isSending || isSummarizing) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: sanitized,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputText("");
    setErrorMessage(null);
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const modelMessage: ChatMessage = {
        id: `msg_${Date.now()}_model`,
        role: "model",
        content: data.reply || "I'm listening. Tell me more about that.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setErrorMessage(
        err.message || "Could not connect to Gemini journaling partner. Please try again."
      );
    } finally {
      setIsSending(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  // Trigger Gemini to analyze, summarize, extract emotion & topics, then save to isolated Firestore path
  const handleEndAndSummarize = async () => {
    if (messages.length === 0 || isSummarizing) return;
    if (!user) {
      setErrorMessage("You must be signed in to save your journal entry.");
      return;
    }

    setIsSummarizing(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/analyze-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Analysis failed.");
      }

      const analysis = await res.json();

      const durationSec = Math.round((Date.now() - sessionStartTime) / 1000);

      const entryPayload: Omit<JournalEntry, "id" | "userId"> = {
        title: analysis.title || "Reflective Journal Session",
        createdAt: Date.now(),
        formattedDate: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        chatLog: messages,
        summary: analysis.summary,
        primaryEmotion: (analysis.primaryEmotion as EmotionType) || "Contemplative",
        emotionScore: analysis.emotionScore || 6,
        topics: analysis.topics || ["Personal Reflection"],
        keyInsight: analysis.keyInsight || "",
        wordCount: totalWords,
        sessionDurationSeconds: durationSec,
      };

      // Save strictly under /users/{user.uid}/journal_entries
      const entryId = await saveJournalEntry(user.uid, entryPayload);

      const completeEntry: JournalEntry = {
        ...entryPayload,
        id: entryId,
        userId: user.uid,
      };

      setSavedEntryData(completeEntry);
      setSaveSuccess(true);
      onSessionSaved(completeEntry);
    } catch (err: any) {
      console.error("Summarize & Save error:", err);
      setErrorMessage(err.message || "Failed to analyze and save journal session.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetSession = () => {
    setMessages([]);
    setInputText("");
    setSaveSuccess(false);
    setSavedEntryData(null);
    setErrorMessage(null);
  };

  // If session was saved successfully, display beautiful summary card
  if (saveSuccess && savedEntryData) {
    const meta = getEmotionMeta(savedEntryData.primaryEmotion);

    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-8">
          <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4" />
            <span>Journal Saved to Isolated Cloud Storage</span>
          </div>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            {savedEntryData.title}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${meta.badgeBg} ${meta.badgeText}`}
            >
              <span className={`h-2 w-2 rounded-full ${meta.dotColor}`} />
              Emotion: {savedEntryData.primaryEmotion}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600 dark:border-stone-800 dark:bg-stone-800 dark:text-stone-300">
              <span>Valence Score:</span>
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                {savedEntryData.emotionScore}/10
              </span>
            </span>

            <span className="inline-flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
              <Clock className="h-3.5 w-3.5" />
              {savedEntryData.formattedDate || "Today"} • {savedEntryData.wordCount} words
            </span>
          </div>

          {/* AI Summary Block */}
          <div className="mt-6 rounded-xl border border-stone-100 bg-stone-50/80 p-5 dark:border-stone-800/80 dark:bg-stone-800/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Gemini Session Summary</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
              {savedEntryData.summary}
            </p>

            {savedEntryData.keyInsight && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200/70 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="font-semibold">Core Insight: </span>
                  {savedEntryData.keyInsight}
                </div>
              </div>
            )}
          </div>

          {/* Extracted Key Topics */}
          <div className="mt-5">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Extracted Topics:
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {savedEntryData.topics.map((topic, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 dark:border-stone-800 dark:bg-stone-800 dark:text-stone-300"
                >
                  <Tag className="h-3 w-3 text-stone-400" />
                  {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-6 dark:border-stone-800">
            <button
              id="btn-start-another-session"
              onClick={handleResetSession}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-750"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Start New Journal Session</span>
            </button>

            <button
              id="btn-view-analytics-after-save"
              onClick={onViewAnalytics}
              className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
            >
              <span>View Analytics & Mood Trends</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-4 sm:px-6">
      {/* Session Top Bar */}
      <div className="flex items-center justify-between border-b border-stone-200/80 pb-3 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Interactive Journal Session
            </h1>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Brainstorm thoughts, reflect deeply, or free-write with Gemini
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-xs text-stone-500 sm:flex sm:items-center sm:gap-2">
            <span>{totalWords} words</span>
            <span>•</span>
            <span>{messages.filter((m) => m.role === "user").length} entries</span>
          </div>

          <button
            id="btn-end-summarize-session"
            onClick={handleEndAndSummarize}
            disabled={messages.length === 0 || isSummarizing || isSending}
            className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            {isSummarizing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Summarizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-amber-400 dark:text-amber-600" />
                <span>End & Summarize</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="my-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-600 shadow-inner dark:bg-stone-800 dark:text-stone-300">
              <Sparkles className="h-7 w-7 text-amber-500" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-stone-800 dark:text-stone-200">
              What's on your mind today?
            </h3>
            <p className="mt-1 max-w-md text-xs text-stone-500 dark:text-stone-400">
              Type your thoughts freely. Gemini will listen thoughtfully, ask reflective questions, help unpack complex feelings, or brainstorm creative ideas.
            </p>

            {/* Prompt Starter Cards */}
            <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2 text-left">
              {PROMPT_SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  id={`btn-prompt-starter-${idx}`}
                  onClick={() => handleSendMessage(s.prompt)}
                  className="group rounded-xl border border-stone-200 bg-white p-3.5 text-left shadow-2xs transition hover:border-stone-400 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700 dark:hover:bg-stone-850"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-stone-200">
                    <span className="text-base">{s.icon}</span>
                    <span>{s.title}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-stone-500 dark:text-stone-400">
                    "{s.prompt}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 mt-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400 dark:text-amber-600" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? "bg-stone-900 text-stone-100 rounded-br-xs dark:bg-stone-100 dark:text-stone-900"
                      : "bg-white text-stone-800 border border-stone-200/80 rounded-bl-xs shadow-2xs dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div
                    className={`mt-1.5 text-[10px] ${
                      isUser
                        ? "text-stone-400 dark:text-stone-600 text-right"
                        : "text-stone-400 dark:text-stone-500"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 mt-1">
                    <span className="text-xs font-bold">
                      {user?.displayName ? user.displayName[0].toUpperCase() : "U"}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 dark:text-amber-600" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-400" />
              <span>Gemini is reflecting...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="pt-2">
        <div className="relative rounded-xl border border-stone-300 bg-white shadow-xs focus-within:border-stone-900 focus-within:ring-1 focus-within:ring-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:focus-within:border-stone-100 dark:focus-within:ring-stone-100">
          <textarea
            ref={textareaRef}
            id="textarea-journal-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write freely... (Press Enter to send, Shift+Enter for new line)"
            rows={3}
            className="w-full resize-none bg-transparent px-3.5 py-3 text-sm text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-500"
          />

          <div className="flex items-center justify-between border-t border-stone-100 px-3 py-2 dark:border-stone-800/80">
            <span className="text-[11px] text-stone-400">
              AI Journal Partner active • Markdown supported
            </span>

            <div className="flex items-center gap-2">
              <button
                id="btn-send-journal-message"
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isSending || isSummarizing}
                className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:opacity-40 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
              >
                <span>Share with Gemini</span>
                <Send className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

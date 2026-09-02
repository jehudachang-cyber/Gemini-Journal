import React from "react";
import { BookOpen, BarChart3, Clock, PlusCircle, LogOut, User as UserIcon, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  activeTab: "journal" | "history" | "analytics";
  setActiveTab: (tab: "journal" | "history" | "analytics") => void;
  onNewEntry: () => void;
  entryCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewEntry,
  entryCount,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-stone-50/90 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & App Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-stone-50 shadow-sm dark:bg-stone-100 dark:text-stone-900">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                Gemini Journal
              </span>
              <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 sm:inline-flex">
                <ShieldCheck className="h-3 w-3" /> User Isolated
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block">
              AI Brainstorming & Introspective Analytics
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 rounded-lg bg-stone-200/70 p-1 dark:bg-stone-900">
          <button
            id="nav-tab-journal"
            onClick={() => setActiveTab("journal")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === "journal"
                ? "bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-stone-50"
                : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Journal</span>
          </button>

          <button
            id="nav-tab-history"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === "history"
                ? "bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-stone-50"
                : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Past Entries</span>
            {entryCount > 0 && (
              <span className="ml-0.5 rounded-full bg-stone-300/80 px-1.5 py-0.2 text-[10px] font-semibold text-stone-800 dark:bg-stone-700 dark:text-stone-200">
                {entryCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-analytics"
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === "analytics"
                ? "bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-stone-50"
                : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Insights & Analytics</span>
          </button>
        </nav>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-2.5">
          <button
            id="btn-new-entry-header"
            onClick={onNewEntry}
            className="hidden items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-1.5 text-xs font-medium text-stone-50 transition-colors hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 md:inline-flex"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>New Session</span>
          </button>

          {user && (
            <div className="flex items-center gap-2 border-l border-stone-200 pl-2.5 dark:border-stone-800">
              <div
                className="flex items-center gap-2 rounded-lg bg-stone-100 px-2.5 py-1 text-xs text-stone-700 dark:bg-stone-900 dark:text-stone-300"
                title={`Logged in UID: ${user.uid}`}
              >
                <UserIcon className="h-3.5 w-3.5 text-stone-400" />
                <span className="max-w-[120px] truncate font-medium sm:max-w-[160px]">
                  {user.isAnonymous ? "Guest User" : user.displayName || user.email?.split("@")[0] || "User"}
                </span>
              </div>

              <button
                id="btn-sign-out"
                onClick={() => logout()}
                title="Sign out securely"
                className="rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-stone-200 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { JournalChat } from "./components/JournalChat";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { EntryHistory } from "./components/EntryHistory";
import { AuthModal } from "./components/AuthModal";
import { JournalEntry } from "./types";
import { subscribeToUserEntries } from "./lib/firebase";
import { Loader2 } from "lucide-react";

function MainApp() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"journal" | "history" | "analytics">("journal");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [sessionKey, setSessionKey] = useState<number>(Date.now());

  // Listen to Firestore updates strictly scoped to authenticated user UID
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setIsLoadingEntries(false);
      return;
    }

    setIsLoadingEntries(true);
    const unsubscribe = subscribeToUserEntries(
      user.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        setIsLoadingEntries(false);
      },
      (err) => {
        console.error("Failed to stream entries:", err);
        setIsLoadingEntries(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleStartNewSession = () => {
    setSessionKey(Date.now());
    setActiveTab("journal");
  };

  const handleSessionSaved = (_entry: JournalEntry) => {
    // Realtime subscription automatically updates `entries`
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-stone-700 dark:text-stone-300" />
          <span className="text-xs font-medium text-stone-500">Loading secure environment...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 selection:bg-stone-200 dark:bg-stone-950 dark:text-stone-100">
      {/* If not authenticated, require Sign-In / Sign-Up */}
      {!user && <AuthModal />}

      {user && (
        <>
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNewEntry={handleStartNewSession}
            entryCount={entries.length}
          />

          <main className="w-full">
            {activeTab === "journal" && (
              <JournalChat
                key={sessionKey}
                onSessionSaved={handleSessionSaved}
                onViewAnalytics={() => setActiveTab("analytics")}
              />
            )}

            {activeTab === "history" && (
              <EntryHistory
                entries={entries}
                onStartNewSession={handleStartNewSession}
              />
            )}

            {activeTab === "analytics" && (
              <AnalyticsDashboard
                entries={entries}
                onStartJournal={handleStartNewSession}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

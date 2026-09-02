import React, { useState } from "react";
import { Lock, Mail, User, ShieldCheck, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { isValidEmail } from "../lib/sanitizer";

export const AuthModal: React.FC = () => {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInAsGuest,
    authError,
    clearAuthError,
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!email || !isValidEmail(email)) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      // Error handled in auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setLocalError(null);
    setIsSubmitting(true);
    try {
      await signInAsGuest();
    } catch (err) {
      // Error handled in auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      // Error handled in auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || authError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl dark:border-stone-800 dark:bg-stone-900">
        {/* Header */}
        <div className="border-b border-stone-100 bg-stone-50/50 p-6 text-center dark:border-stone-800/80 dark:bg-stone-900/50">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-stone-50 shadow-sm dark:bg-stone-100 dark:text-stone-900">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Personal Gemini Journal
          </h2>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Private, secure introspective journaling with AI brainstorming & emotional analytics
          </p>

          {/* Mode Switcher */}
          <div className="mt-5 grid grid-cols-2 rounded-lg bg-stone-200/60 p-1 dark:bg-stone-800">
            <button
              id="auth-tab-signin"
              type="button"
              onClick={() => {
                setMode("signin");
                clearAuthError();
                setLocalError(null);
              }}
              className={`rounded-md py-1.5 text-xs font-medium transition-all ${
                mode === "signin"
                  ? "bg-white text-stone-900 shadow-xs dark:bg-stone-700 dark:text-stone-100"
                  : "text-stone-600 hover:text-stone-900 dark:text-stone-400"
              }`}
            >
              Sign In
            </button>
            <button
              id="auth-tab-signup"
              type="button"
              onClick={() => {
                setMode("signup");
                clearAuthError();
                setLocalError(null);
              }}
              className={`rounded-md py-1.5 text-xs font-medium transition-all ${
                mode === "signup"
                  ? "bg-white text-stone-900 shadow-xs dark:bg-stone-700 dark:text-stone-100"
                  : "text-stone-600 hover:text-stone-900 dark:text-stone-400"
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {activeError && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{activeError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Full Name / Preferred Nickname
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    id="input-auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 outline-none transition focus:border-stone-900 focus:ring-1 focus:ring-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:border-stone-100 dark:focus:ring-stone-100"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  id="input-auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 outline-none transition focus:border-stone-900 focus:ring-1 focus:ring-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:border-stone-100 dark:focus:ring-stone-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  id="input-auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 outline-none transition focus:border-stone-900 focus:ring-1 focus:ring-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:border-stone-100 dark:focus:ring-stone-100"
                />
              </div>
            </div>

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
            >
              <span>{mode === "signin" ? "Sign In to Your Journal" : "Create Private Journal"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Social / Guest Options */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-stone-800" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-stone-400">
              <span className="bg-white px-2 dark:bg-stone-900">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              id="btn-auth-google"
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-750"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              id="btn-auth-guest"
              type="button"
              disabled={isSubmitting}
              onClick={handleGuestLogin}
              className="flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-750"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Instant Guest</span>
            </button>
          </div>

          {/* Security Constitution Banner */}
          <div className="mt-5 rounded-lg border border-stone-200/80 bg-stone-50 p-3 text-[11px] leading-relaxed text-stone-500 dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-400">
            <div className="flex items-center gap-1.5 font-semibold text-stone-700 dark:text-stone-300 mb-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Strict Firestore User Isolation Active</span>
            </div>
            Each user’s journal sessions are stored exclusively under their own authenticated UID path (<code className="rounded bg-stone-200/70 px-1 py-0.5 text-[10px] text-stone-800 dark:bg-stone-800 dark:text-stone-200">/users/{'{uid}'}/journal_entries</code>). Cross-user reads and writes are blocked by security rules.
          </div>
        </div>
      </div>
    </div>
  );
};

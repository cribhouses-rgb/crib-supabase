import { useState } from "react";
import { Home, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

type Mode = "login" | "signup";

export default function Welcome() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [signupSent, setSignupSent] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return;
    setBusy(true);
    setError(null);

    if (isSignup) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setBusy(false);
        return;
      }
      const result = await signUpWithEmail(email.trim(), password.trim());
      setBusy(false);
      if (!result.ok) {
        setError(result.error ?? "Could not create account.");
      } else {
        // If email confirmation is required in Supabase's settings, there's
        // no session yet and the person needs to check their inbox first.
        // If it's disabled, onAuthStateChange fires almost immediately and
        // routes them straight into the role/university picker — this
        // message just covers the brief gap either way.
        setSignupSent(true);
      }
      return;
    }

    try {
      await signInWithEmail(email.trim(), password.trim());
    } catch {
      setError("Invalid email or password.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError("Sign-in didn't go through. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError("Enter your email address first, then tap Forgot password.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await resetPassword(email.trim());
    setBusy(false);
    if (result.ok) {
      setResetSent(true);
    } else {
      setError(result.error ?? "Could not send reset email.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="h-20 w-20 rounded-3xl flex items-center justify-center mb-5 bg-brand-700">
        <Home className="text-white" size={40} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Student Crib</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2">Find your perfect home near campus</p>

      {/* Login / Sign up toggle */}
      <div className="w-full max-w-xs mt-6 flex rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
        <button
          onClick={() => { setMode("login"); setError(null); setSignupSent(false); }}
          className={`flex-1 h-10 text-sm font-medium ${
            mode === "login" ? "bg-brand-700 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
          }`}
        >
          Log in
        </button>
        <button
          onClick={() => { setMode("signup"); setError(null); setSignupSent(false); }}
          className={`flex-1 h-10 text-sm font-medium ${
            mode === "signup" ? "bg-brand-700 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
          }`}
        >
          Sign up
        </button>
      </div>

      <div className="w-full max-w-xs mt-4 space-y-3">
        {signupSent ? (
          <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <p className="font-medium mb-1">Almost there</p>
            <p>
              If your account needs email confirmation, check your inbox for a link
              from Supabase. Otherwise you'll be taken straight into the app —
              just switch to "Log in" and sign in with the same details if this
              screen doesn't move on its own.
            </p>
          </div>
        ) : (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
            />
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "Create a password (min 6 characters)" : "Password"}
                className="w-full h-12 px-4 pr-12 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={busy || !email || !password}
              className="w-full h-12 rounded-xl bg-brand-700 text-white font-semibold disabled:opacity-40"
            >
              {busy ? (isSignup ? "Creating account…" : "Signing in…") : (isSignup ? "Create account" : "Log in")}
            </button>

            {!isSignup && (
              <button
                onClick={handleForgotPassword}
                disabled={busy}
                className="text-sm text-brand-700 dark:text-brand-400 font-medium"
              >
                Forgot password?
              </button>
            )}

            {resetSent && (
              <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 rounded-xl p-3">
                Password reset email sent to {email}. Check your inbox.
              </p>
            )}
          </>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 pt-2">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
          or
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full h-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center gap-3 font-medium text-gray-700 dark:text-gray-300 active:bg-gray-50 disabled:opacity-50"
        >
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">G</span>
          Continue with Google
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-3 max-w-xs">{error}</p>}
    </div>
  );
}

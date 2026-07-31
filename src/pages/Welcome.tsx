import { useState } from "react";
import { Home, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Welcome() {
  const { signInWithGoogle, signInWithEmail, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  async function handleEmail() {
    if (!email.trim() || !password.trim()) return;
    setBusy(true);
    setError(null);
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

      <div className="w-full max-w-xs mt-8 space-y-3">
        {/* Email + password login */}
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
            placeholder="Password"
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
          onClick={handleEmail}
          disabled={busy || !email || !password}
          className="w-full h-12 rounded-xl bg-brand-700 text-white font-semibold disabled:opacity-40"
        >
          {busy ? "Signing in…" : "Log in"}
        </button>

        {/* Forgot password */}
        <button
          onClick={handleForgotPassword}
          disabled={busy}
          className="text-sm text-brand-700 dark:text-brand-400 font-medium"
        >
          Forgot password?
        </button>

        {resetSent && (
          <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 rounded-xl p-3">
            Password reset email sent to {email}. Check your inbox.
          </p>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 pt-2">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
          new here?
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
        </div>

        {/* Google signup for new users */}
        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full h-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center gap-3 font-medium text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:bg-gray-900 disabled:opacity-50"
        >
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">G</span>
          Create account with Google
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-3 max-w-xs">{error}</p>}
    </div>
  );
}

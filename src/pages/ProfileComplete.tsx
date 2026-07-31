import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { isValidZwPhone } from "../lib/validation";

export default function ProfileComplete() {
  const { profile, firebaseUser, completeProfile, setupPassword } = useAuth();
  const [name, setName] = useState(profile?.fullName ?? "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneOk = isValidZwPhone(phone);
  const canSubmit = name.trim().length > 1 && phoneOk && !busy;
  const photoURL = (firebaseUser?.user_metadata?.avatar_url as string | undefined)
    ?? (firebaseUser?.user_metadata?.picture as string | undefined)
    ?? null;

  async function handleSubmit() {
    setBusy(true);
    setError(null);

    // Set password if provided (optional)
    if (password.trim().length >= 6) {
      const pwResult = await setupPassword(password.trim());
      if (!pwResult.ok) {
        setError(pwResult.error ?? "Failed to set password.");
        setBusy(false);
        return;
      }
    }

    const result = await completeProfile(name.trim(), phone.trim());
    setBusy(false);
    if (!result.ok) setError(result.error ?? "Something went wrong. Please try again.");
  }

  return (
    <div className="min-h-screen flex flex-col justify-center p-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Complete your profile</h2>

      <div className="flex justify-center my-6">
        <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden">
          {photoURL ? (
            <img src={photoURL} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">
              {name ? name[0].toUpperCase() : "?"}
            </span>
          )}
        </div>
      </div>

      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Full name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Farai Nyoni"
        className="w-full mt-1.5 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
      />

      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-4 block">Phone number</label>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+263 71X XXX XXX"
        className={`w-full mt-1.5 h-12 px-3 rounded-xl border text-sm ${
          phone && !phoneOk ? "border-red-400" : "border-gray-200 dark:border-gray-600"
        }`}
      />
      {phone && !phoneOk && <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">Use format +263 71X XXX XXX</p>}

      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-4 block">
        Set a password <span className="text-gray-400 dark:text-gray-500">(optional — for email login next time)</span>
      </label>
      <div className="relative mt-1.5">
        <input
          type={showPw ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          className={`w-full h-12 px-3 pr-12 rounded-xl border text-sm ${
            password && password.length < 6 ? "border-red-400" : "border-gray-200 dark:border-gray-600"
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPw(!showPw)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        >
          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {password && password.length < 6 && (
        <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">Minimum 6 characters</p>
      )}
      {!password && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
          Set a password so you can log in with just your email next time, without Google.
        </p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-3">{error}</p>}

      <button
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="w-full mt-6 h-12 rounded-xl text-white font-semibold bg-brand-700 disabled:opacity-40"
      >
        {busy ? "Saving…" : "Enter app"}
      </button>
    </div>
  );
}

import { useState } from "react";
import { GraduationCap, Building2, Users, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UNIVERSITIES } from "../data/universities";
import type { UserRole } from "../types";

const ROLES: { id: UserRole; label: string; icon: typeof GraduationCap }[] = [
  { id: "student", label: "Student", icon: GraduationCap },
  { id: "agent", label: "Agent", icon: Building2 },
  { id: "landlord", label: "Landlord", icon: Users },
];

export default function RoleSelect() {
  const { firebaseUser, createProfile, signOutUser } = useAuth();
  const [role, setRole] = useState<UserRole>("student");
  const [universityId, setUniversityId] = useState(UNIVERSITIES[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setBusy(true);
    setError(null);
    const result = await createProfile(role, universityId);
    setBusy(false);
    if (!result.ok) setError(result.error ?? "Something went wrong. Please try again.");
  }

  return (
    <div className="min-h-screen flex flex-col justify-center p-8">
      <p className="text-xs text-gray-400 dark:text-gray-500">{firebaseUser?.email}</p>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">I am a…</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose how you'll use the app.</p>

      <div className="grid grid-cols-3 gap-2 mt-5">
        {ROLES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setRole(id)}
            className={`py-4 rounded-2xl border text-sm font-medium ${
              role === id ? "text-white border-transparent bg-brand-700" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Icon className="mx-auto mb-1" size={20} />
            {label}
          </button>
        ))}
      </div>

      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-6 block">
        {role === "landlord" || role === "agent" ? "University you serve" : "Your university"}
      </label>
      <select
        value={universityId}
        onChange={(e) => setUniversityId(e.target.value)}
        className="w-full mt-1.5 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
      >
        {UNIVERSITIES.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>

      <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs">
        {role === "landlord" || role === "agent"
          ? "Choose the university whose students you want to reach."
          : "Sign in with any Google email. Select your university above."
        }
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">
          {error}
          <button
            onClick={signOutUser}
            className="flex items-center gap-1.5 mt-2 text-red-700 dark:text-red-300 font-medium underline underline-offset-2"
          >
            <LogOut size={13} /> Sign out and try a different account
          </button>
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={busy}
        className="w-full mt-6 h-12 rounded-xl text-white font-semibold bg-brand-700 disabled:opacity-50"
      >
        {busy ? "Checking…" : "Continue"}
      </button>
    </div>
  );
}

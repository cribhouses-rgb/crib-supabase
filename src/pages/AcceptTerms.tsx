import { useState } from "react";
import { FileText, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { TERMS_SECTIONS } from "../data/terms";

interface Props {
  onAccept: () => void;
}

export default function AcceptTerms({ onAccept }: Props) {
  const { signOutUser } = useAuth();
  const [checked, setChecked] = useState(false);

  return (
    <div className="min-h-screen flex flex-col p-6">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="text-brand-700 dark:text-brand-400" size={20} />
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Terms & Conditions</h1>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Please read and accept before creating your account.
      </p>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 p-4 space-y-4">
        {TERMS_SECTIONS.map((s) => (
          <div key={s.title}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{s.title}</h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{s.body}</p>
          </div>
        ))}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
          This is a summary. Student Crib is not a party to any lease, sale, or
          payment arranged between users, and makes no guarantee about the
          accuracy of listings or reviews posted by other users.
        </p>
      </div>

      <label className="flex items-start gap-3 mt-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-5 w-5 rounded accent-red-900 flex-shrink-0"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          I have read and agree to the Terms and Conditions.
        </span>
      </label>

      <button
        onClick={onAccept}
        disabled={!checked}
        className="w-full mt-4 h-12 rounded-xl bg-brand-700 text-white font-semibold disabled:opacity-40"
      >
        Agree and continue
      </button>

      <button
        onClick={signOutUser}
        className="w-full mt-3 h-10 rounded-xl text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center justify-center gap-2"
      >
        <LogOut size={14} /> Cancel and sign out
      </button>
    </div>
  );
}

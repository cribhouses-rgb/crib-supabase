import { useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { createRoommatePost } from "../lib/db";
import { SUBURB_NAMES } from "../data/suburbs";

interface Props {
  onBack: () => void;
  onToast: (msg: string) => void;
}

export default function AddRoommatePostForm({ onBack, onToast }: Props) {
  const { profile } = useAuth();
  const [bio, setBio] = useState("");
  const [budget, setBudget] = useState("");
  const [preferredSuburb, setPreferredSuburb] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = bio.trim() && budget && !busy;

  async function handleSubmit() {
    if (!profile || !canSubmit) return;
    setBusy(true);
    try {
      await createRoommatePost({
        studentId: profile.uid,
        studentName: profile.fullName,
        studentPhone: profile.phone,
        studentPhotoURL: profile.photoURL,
        universityId: profile.universityId,
        bio: bio.trim(),
        budget: Number(budget),
        preferredSuburb,
        moveInDate,
        status: "looking",
      });
      onToast("Roommate post published!");
      onBack();
    } catch (err) {
      console.error(err);
      onToast("Failed to publish post");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur flex items-center gap-3">
        <button onClick={onBack} className="h-9 w-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-bold text-gray-900 dark:text-gray-100">Looking for a roommate</h1>
      </div>

      <div className="px-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">About you & what you're looking for</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)}
            placeholder="e.g. 2nd-year EE student, quiet and tidy, looking to split a 2-bed flat near campus. Non-smoker."
            className="w-full mt-1 h-28 p-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm resize-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Max budget ($/mo)</label>
            <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)}
              placeholder="150"
              className="w-full mt-1 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Preferred suburb</label>
            <select value={preferredSuburb} onChange={(e) => setPreferredSuburb(e.target.value)}
              className="w-full mt-1 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500">
              <option value="">Any</option>
              {SUBURB_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Move-in date</label>
          <input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)}
            className="w-full mt-1 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
        </div>

        <p className="text-[11px] text-gray-400 dark:text-gray-500">
          Your name, photo, and phone number (from your profile) will be visible to other students so they can reach out.
        </p>

        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full h-12 rounded-xl bg-brand-700 text-white font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
          {busy ? <><Loader2 size={18} className="animate-spin" /> Publishing…</> : "Publish post"}
        </button>
      </div>
    </div>
  );
}

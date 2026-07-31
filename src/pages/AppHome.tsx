import { useState } from "react";
import { LogOut, CheckCircle2, Database, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUniversity } from "../data/universities";
import { seedDatabase } from "../lib/seed";

export default function AppHome() {
  const { profile, signOutUser } = useAuth();
  const university = getUniversity(profile?.universityId);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  async function handleSeed() {
    if (!profile) return;
    setSeeding(true);
    setSeedResult(null);
    try {
      const result = await seedDatabase(profile.uid);
      if (result.listings === 0 && result.market === 0) {
        setSeedResult("Seed data already exists — nothing added.");
      } else {
        setSeedResult(
          `Added ${result.listings} listings and ${result.market} marketplace items.`
        );
      }
    } catch (err) {
      console.error(err);
      setSeedResult("Error seeding. Check console for details.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <CheckCircle2 className="text-green-600 dark:text-green-400" size={40} />
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-3">
        Welcome, {profile?.fullName?.split(" ")[0]}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {profile?.role} · {university?.name}
      </p>

      <div className="w-full max-w-xs mt-8 space-y-3">
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="w-full h-12 rounded-xl bg-brand-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {seeding ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Database size={18} />
          )}
          {seeding ? "Seeding…" : "Seed sample data"}
        </button>

        {seedResult && (
          <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl p-3">
            {seedResult}
          </p>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Tap above to populate Firestore with 10 sample listings and 6
          marketplace items for HIT. The real dashboards get wired in
          Phase 3.
        </p>

        <button
          onClick={signOutUser}
          className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 font-medium"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );
}

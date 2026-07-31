import { useEffect, useState } from "react";
import { ChevronLeft, Bell, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getSavedSearches, deleteSavedSearch, countNewMatches, touchSavedSearch, getListings,
} from "../lib/db";
import ListingCard from "../components/ListingCard";
import type { SavedSearch, Listing } from "../types";

interface Props {
  onBack: () => void;
  favs: Set<string>;
  onToggleFav: (id: string) => void;
  onOpenListing: (id: string) => void;
}

export default function SavedSearchesScreen({ onBack, favs, onToggleFav, onOpenListing }: Props) {
  const { profile } = useAuth();
  const [searches, setSearches] = useState<(SavedSearch & { newCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSearch, setOpenSearch] = useState<SavedSearch | null>(null);
  const [results, setResults] = useState<Listing[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    getSavedSearches(profile.uid)
      .then(async (all) => {
        const withCounts = await Promise.all(
          all.map(async (s) => ({ ...s, newCount: await countNewMatches(s) }))
        );
        setSearches(withCounts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile]);

  async function handleOpen(search: SavedSearch) {
    if (!profile) return;
    setOpenSearch(search);
    setResultsLoading(true);
    try {
      const listings = await getListings(profile.universityId, {
        suburb: search.suburb ?? undefined,
        propertyType: search.propertyType ?? undefined,
        maxPrice: search.maxPrice,
      });
      setResults(listings);
      await touchSavedSearch(search.id);
      setSearches((prev) => prev.map((s) => s.id === search.id ? { ...s, newCount: 0 } : s));
    } catch (err) {
      console.error(err);
    } finally {
      setResultsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this saved search?")) return;
    await deleteSavedSearch(id);
    setSearches((prev) => prev.filter((s) => s.id !== id));
  }

  if (openSearch) {
    return (
      <div className="pb-24">
        <div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur flex items-center gap-3">
          <button onClick={() => setOpenSearch(null)} className="h-9 w-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-bold text-gray-900 dark:text-gray-100">{openSearch.label}</h1>
        </div>
        <div className="px-4 pt-2 space-y-3">
          {resultsLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 rounded-full border-2 border-brand-700 border-t-transparent animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-6">No listings match this search yet.</p>
          ) : (
            results.map((l) => (
              <ListingCard key={l.id} listing={l} isFav={favs.has(l.id)} onToggleFav={onToggleFav} onOpen={onOpenListing} />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur flex items-center gap-3">
        <button onClick={onBack} className="h-9 w-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-bold text-gray-900 dark:text-gray-100">Saved Searches</h1>
      </div>

      <div className="px-4 pt-2 space-y-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 rounded-full border-2 border-brand-700 border-t-transparent animate-spin" />
          </div>
        ) : searches.length === 0 ? (
          <div className="text-center mt-10">
            <Bell size={32} className="text-gray-300 mx-auto" />
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              No saved searches yet. Save a filter combo from the Search tab to get alerted when new listings match.
            </p>
          </div>
        ) : (
          searches.map((s) => (
            <div key={s.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <button onClick={() => handleOpen(s)} className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{s.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {s.suburb ?? "Any suburb"} · {s.propertyType ? s.propertyType.replace("_", " ") : "any type"} · up to ${s.maxPrice}/mo
                </p>
              </button>
              {s.newCount > 0 && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-semibold flex-shrink-0">
                  {s.newCount} new
                </span>
              )}
              <button onClick={() => handleDelete(s.id)} className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, Home, GraduationCap, MessageCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getListings } from "../lib/db";
import { getCurrentSemester } from "../data/suburbs";
import ListingCard from "../components/ListingCard";
import ListingSkeleton from "../components/ListingSkeleton";
import type { Listing } from "../types";

interface Props {
  favs: Set<string>;
  onToggleFav: (id: string) => void;
  onOpenListing: (id: string) => void;
  onGoSearch: () => void;
  onOpenChats: () => void;
}

export default function HomeScreen({ favs, onToggleFav, onOpenListing, onGoSearch, onOpenChats }: Props) {
  const { profile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const semester = getCurrentSemester();

  useEffect(() => {
    if (!profile) return;
    getListings(profile.universityId)
      .then(setListings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile]);

  const nearby = [...listings].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 4);
  const recent = [...listings].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-brand-700">
            <Home className="text-white" size={16} />
          </div>
          <span className="font-bold text-gray-900 dark:text-gray-100">Student Crib</span>
          <button onClick={onOpenChats} className="ml-auto h-8 w-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
            <MessageCircle size={15} className="text-gray-600 dark:text-gray-300" />
          </button>
          <span className="text-[10px] px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center gap-1">
            <GraduationCap size={11} /> {semester.label} · {semester.months}
          </span>
        </div>
      </div>

      <div className="px-4">
        {/* Search bar */}
        <button
          onClick={onGoSearch}
          className="w-full flex items-center gap-2 h-12 px-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 text-sm"
        >
          <Search size={16} /> Search suburb, price, type…
          <SlidersHorizontal size={16} className="ml-auto" />
        </button>

        {loading ? (
          <div className="mt-5 space-y-3">
            <ListingSkeleton />
            <ListingSkeleton />
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-10 text-center">
            <p className="text-gray-500 dark:text-gray-400">No listings yet.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Tap "Seed sample data" in your profile to add demo listings.</p>
          </div>
        ) : (
          <>
            {/* Nearby */}
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-5 mb-2">
              Nearby listings
            </h2>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 snap-x">
              {nearby.map((l) => (
                <div key={l.id} className="min-w-[260px] snap-start">
                  <ListingCard
                    listing={l}
                    isFav={favs.has(l.id)}
                    onToggleFav={onToggleFav}
                    onOpen={onOpenListing}
                  />
                </div>
              ))}
            </div>

            {/* Recently added */}
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-5 mb-2">
              Recently added
            </h2>
            <div className="space-y-3">
              {recent.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  isFav={favs.has(l.id)}
                  onToggleFav={onToggleFav}
                  onOpen={onOpenListing}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

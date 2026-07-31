import { useEffect, useState } from "react";
import { MapPin, Bell, BellPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getListings, getCustomSuburbs, createSavedSearch } from "../lib/db";
import { SUBURB_NAMES, PROPERTY_TYPES } from "../data/suburbs";
import ListingCard from "../components/ListingCard";
import ListingSkeleton from "../components/ListingSkeleton";
import type { Listing } from "../types";

interface Props {
  favs: Set<string>;
  onToggleFav: (id: string) => void;
  onOpenListing: (id: string) => void;
  onOpenSavedSearches: () => void;
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition ${
        active ? "text-white border-transparent bg-brand-700" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
      }`}
    >
      {children}
    </button>
  );
}

export default function SearchScreen({ favs, onToggleFav, onOpenListing, onOpenSavedSearches }: Props) {
  const { profile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [suburb, setSuburb] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(300);
  const [suburbOptions, setSuburbOptions] = useState<string[]>(SUBURB_NAMES);
  const [savingSearch, setSavingSearch] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [savedJustNow, setSavedJustNow] = useState(false);

  async function handleSaveSearch() {
    if (!profile) return;
    const label = saveLabel.trim() || `${suburb ?? "Any suburb"}, up to $${maxPrice}`;
    await createSavedSearch({
      uid: profile.uid,
      universityId: profile.universityId,
      label,
      suburb,
      propertyType: type,
      maxPrice,
      lastCheckedAt: Date.now(),
    });
    setSavingSearch(false);
    setSaveLabel("");
    setSavedJustNow(true);
    setTimeout(() => setSavedJustNow(false), 2000);
  }

  useEffect(() => {
    if (!profile) return;
    getCustomSuburbs(profile.universityId)
      .then((extra) => {
        const merged = Array.from(new Set([...SUBURB_NAMES, ...extra])).sort();
        setSuburbOptions(merged);
      })
      .catch(console.error);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    getListings(profile.universityId, {
      suburb: suburb ?? undefined,
      propertyType: type ?? undefined,
      maxPrice,
    })
      .then(setListings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile, suburb, type, maxPrice]);

  return (
    <div className="pb-24">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Search</h2>
          <button onClick={onOpenSavedSearches} className="h-9 w-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
            <Bell size={16} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Location</p>
          <div className="flex gap-2 flex-wrap">
            <Pill active={!suburb} onClick={() => setSuburb(null)}>All</Pill>
            {suburbOptions.map((s) => (
              <Pill key={s} active={suburb === s} onClick={() => setSuburb(s)}>{s}</Pill>
            ))}
          </div>

          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-4 mb-2">Property type</p>
          <div className="flex gap-2 flex-wrap">
            <Pill active={!type} onClick={() => setType(null)}>All</Pill>
            {PROPERTY_TYPES.map((t) => (
              <Pill key={t.value} active={type === t.value} onClick={() => setType(t.value)}>
                {t.label}
              </Pill>
            ))}
          </div>

          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-4 mb-1">
            Max price: ${maxPrice}/mo
          </p>
          <input
            type="range"
            min={100}
            max={400}
            step={10}
            value={maxPrice}
            onChange={(e) => setMaxPrice(+e.target.value)}
            className="w-full accent-red-900"
          />

          {!savingSearch ? (
            <button
              onClick={() => setSavingSearch(true)}
              className="w-full mt-4 h-10 rounded-xl border border-brand-700 text-brand-700 dark:text-brand-400 text-sm font-medium flex items-center justify-center gap-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
            >
              <BellPlus size={15} /> Save this search & get alerted
            </button>
          ) : (
            <div className="mt-4 flex gap-2">
              <input
                value={saveLabel}
                onChange={(e) => setSaveLabel(e.target.value)}
                placeholder="Name this search (optional)"
                className="flex-1 h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              />
              <button onClick={handleSaveSearch} className="h-10 px-4 rounded-xl bg-brand-700 text-white text-sm font-medium">
                Save
              </button>
            </div>
          )}
          {savedJustNow && <p className="text-xs text-green-600 dark:text-green-400 mt-2">Saved! Check the bell icon above anytime.</p>}
        </div>

        {/* Faux map */}
        <div className="mt-4 h-28 rounded-2xl relative overflow-hidden border border-gray-100 dark:border-gray-700 bg-gradient-to-br from-green-100 to-green-50">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "linear-gradient(#0002 1px, transparent 1px), linear-gradient(90deg, #0002 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full text-white bg-brand-700">
            <MapPin size={12} /> Campus
          </span>
          {listings.slice(0, 5).map((l, i) => (
            <span
              key={l.id}
              className="absolute text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full bg-brand-700"
              style={{ top: `${20 + (i * 15) % 60}%`, left: `${15 + (i * 22) % 70}%` }}
            >
              ${l.price}
            </span>
          ))}
        </div>

        {/* Results */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 mb-2">
          {loading ? "Searching…" : `${listings.length} results`}
        </p>

        {loading ? (
          <div className="space-y-3">
            <ListingSkeleton />
            <ListingSkeleton />
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                isFav={favs.has(l.id)}
                onToggleFav={onToggleFav}
                onOpen={onOpenListing}
              />
            ))}
            {listings.length === 0 && (
              <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-6">
                No listings match these filters.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { Heart, MapPin, Wifi, Droplet, Zap, Shield, Bus, Car, Sun, Droplets } from "lucide-react";
import type { Listing } from "../types";

const AMENITY_ICON: Record<string, typeof Wifi> = {
  WiFi: Wifi,
  Water: Droplet,
  Electricity: Zap,
  Security: Shield,
  Parking: Car,
  "Backup power": Sun,
  Borehole: Droplets,
};

const COVER_GRADIENTS = [
  "linear-gradient(135deg, #7f1d1d, #b91c1c)",
  "linear-gradient(135deg, #0f766e, #14b8a6)",
  "linear-gradient(135deg, #1e3a8a, #3b82f6)",
  "linear-gradient(135deg, #7c2d12, #ea580c)",
  "linear-gradient(135deg, #4c1d95, #7c3aed)",
  "linear-gradient(135deg, #365314, #65a30d)",
];

interface Props {
  listing: Listing;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  onOpen: (id: string) => void;
}

export default function ListingCard({ listing: l, isFav, onToggleFav, onOpen }: Props) {
  const coverIdx = l.title.length % COVER_GRADIENTS.length;

  return (
    <button
      onClick={() => onOpen(l.id)}
      className="w-full text-left bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.99] transition"
    >
      {/* Cover image or gradient placeholder */}
      <div
        className="h-36 relative flex items-center justify-center"
        style={{ background: l.photos[0] ? `url(${l.photos[0]}) center/cover` : COVER_GRADIENTS[coverIdx] }}
      >
        {!l.photos[0] && (
          <span className="text-white/30 text-4xl font-bold">{l.suburb[0]}</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFav(l.id); }}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center"
        >
          <Heart size={16} className={isFav ? "fill-red-600 text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-300"} />
        </button>
        {l.nearShuttle && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-semibold text-white bg-black/40 px-2 py-1 rounded-full">
            <Bus size={11} /> Near shuttle
          </span>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-bold text-brand-700 dark:text-brand-400">
            ${l.price}<span className="text-xs font-normal text-gray-400 dark:text-gray-500">/mo</span>
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <MapPin size={12} />{l.distanceKm} km
          </span>
        </div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1 truncate">{l.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{l.suburb} · {l.propertyType.replace("_", " ")}</p>
        <div className="flex items-center gap-2 mt-2">
          {l.amenities.slice(0, 4).map((a) => {
            const Icon = AMENITY_ICON[a] ?? Wifi;
            return <Icon key={a} size={13} className="text-gray-400 dark:text-gray-500" />;
          })}
          <span className="ml-auto text-[11px] text-gray-500 dark:text-gray-400">{l.ownerName}</span>
        </div>
      </div>
    </button>
  );
}

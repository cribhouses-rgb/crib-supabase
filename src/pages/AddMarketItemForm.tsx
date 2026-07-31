import { useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { createMarketItem } from "../lib/db";
import type { MarketCategory, ItemCondition } from "../types";

const CATEGORIES: { value: MarketCategory; label: string }[] = [
  { value: "textbooks", label: "Textbooks" },
  { value: "furniture", label: "Furniture" },
  { value: "electronics", label: "Electronics" },
];

const CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

interface Props {
  onBack: () => void;
  onToast: (msg: string) => void;
}

export default function AddMarketItemForm({ onBack, onToast }: Props) {
  const { profile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MarketCategory>("textbooks");
  const [condition, setCondition] = useState<ItemCondition>("good");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = title.trim() && price && !busy;

  async function handleSubmit() {
    if (!profile || !canSubmit) return;
    setBusy(true);
    try {
      await createMarketItem({
        sellerId: profile.uid,
        sellerName: profile.fullName,
        sellerPhone: profile.phone,
        universityId: profile.universityId,
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        price: Number(price),
        photos: [],
        status: "available",
      });
      onToast("Item listed!");
      onBack();
    } catch (err) {
      console.error(err);
      onToast("Failed to list item");
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
        <h1 className="font-bold text-gray-900 dark:text-gray-100">Sell an item</h1>
      </div>

      <div className="px-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">What are you selling?</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Engineering Maths textbook"
            className="w-full mt-1 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Condition details, edition, what's included…"
            className="w-full mt-1 h-24 p-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm resize-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as MarketCategory)}
              className="w-full mt-1 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500">
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value as ItemCondition)}
              className="w-full mt-1 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500">
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Price ($)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
            placeholder="25"
            className="w-full mt-1 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
        </div>

        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full h-12 rounded-xl bg-brand-700 text-white font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
          {busy ? <><Loader2 size={18} className="animate-spin" /> Listing…</> : "List item for sale"}
        </button>
      </div>
    </div>
  );
}

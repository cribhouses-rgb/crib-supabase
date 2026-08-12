import { useState } from "react";
import { ChevronLeft, Loader2, Camera, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { createMarketItem, updateMarketItem, uploadImages } from "../lib/db";
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
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmit = title.trim() && price && !busy;

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setPhotoError(null);

    const combined = [...photoFiles, ...files];
    if (combined.length > 5) {
      setPhotoError("Maximum 5 photos per item.");
      return;
    }
    // Generous raw limit — compressImage() (called on submit) resizes and
    // re-encodes every photo automatically, so even a full-size phone
    // camera photo (8–15MB) ends up well under 1MB before it uploads.
    const oversized = files.find((f) => f.size > 20 * 1024 * 1024);
    if (oversized) {
      setPhotoError(`"${oversized.name}" is too large to use.`);
      return;
    }

    setPhotoFiles(combined);
    setPhotoPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit() {
    if (!profile || !canSubmit) return;
    setBusy(true);
    try {
      const itemId = await createMarketItem({
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

      if (photoFiles.length > 0) {
        setUploadingPhotos(true);
        try {
          const urls = await uploadImages("marketplace", itemId, photoFiles);
          await updateMarketItem(itemId, { photos: urls });
        } catch (photoErr) {
          console.error(photoErr);
          onToast("Item listed, but photo upload failed — you can add photos later.");
          onBack();
          return;
        } finally {
          setUploadingPhotos(false);
        }
      }

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

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
            Photos <span className="text-gray-400 dark:text-gray-500">(up to 5 — compressed automatically)</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {photoPreviews.map((src, i) => (
              <div key={src} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
            {photoFiles.length < 5 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 cursor-pointer">
                <Camera size={18} />
                <span className="text-[10px] mt-1">Add</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
              </label>
            )}
          </div>
          {photoError && <p className="text-[11px] text-red-500 mt-2">{photoError}</p>}
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
          {uploadingPhotos ? (
            <><Loader2 size={18} className="animate-spin" /> Uploading photos…</>
          ) : busy ? (
            <><Loader2 size={18} className="animate-spin" /> Listing…</>
          ) : (
            "List item for sale"
          )}
        </button>
      </div>
    </div>
  );
}

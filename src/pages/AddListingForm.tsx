import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, Camera, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { createListing, updateListing, getCustomSuburbs, addCustomSuburb, uploadImages } from "../lib/db";
import { SUBURB_NAMES, PROPERTY_TYPES, AMENITIES } from "../data/suburbs";
import { getUniversity } from "../data/universities";
import { distanceKm } from "../lib/distance";
import type { PropertyType } from "../types";

// Known coordinates for the seeded HIT suburbs. Anything not in here is a
// user-contributed suburb — we don't have coordinates for those, so we ask
// the person to estimate the distance manually instead of guessing.
const SUBURB_COORDS: Record<string, { lat: number; lng: number }> = {
  Hatcliffe: { lat: -17.741, lng: 31.035 },
  Borrowdale: { lat: -17.754, lng: 31.089 },
  "Glen Lorne": { lat: -17.726, lng: 31.112 },
  Chisipite: { lat: -17.769, lng: 31.114 },
};

const CUSTOM_OPTION = "__custom__";

interface Props {
  onBack: () => void;
  onToast: (msg: string) => void;
}

export default function AddListingForm({ onBack, onToast }: Props) {
  const { profile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  const [suburbOptions, setSuburbOptions] = useState<string[]>(SUBURB_NAMES);
  const [suburbChoice, setSuburbChoice] = useState<string>(SUBURB_NAMES[0]);
  const [customSuburb, setCustomSuburb] = useState("");
  const [manualDistance, setManualDistance] = useState("");

  const [propertyType, setPropertyType] = useState<PropertyType>("single_room");
  const [price, setPrice] = useState("");
  const [beds, setBeds] = useState("1");
  const [baths, setBaths] = useState("1");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [nearShuttle, setNearShuttle] = useState(false);
  const [availableFrom, setAvailableFrom] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [busy, setBusy] = useState(false);

  // Merge in any suburbs other agents/landlords at this university have
  // already added, so the dropdown grows over time instead of staying
  // stuck at the four seeded ones.
  useEffect(() => {
    if (!profile) return;
    getCustomSuburbs(profile.universityId)
      .then((extra) => {
        const merged = Array.from(new Set([...SUBURB_NAMES, ...extra])).sort();
        setSuburbOptions(merged);
      })
      .catch(console.error);
  }, [profile]);

  function toggleAmenity(a: string) {
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setPhotoError(null);

    const combined = [...photoFiles, ...files];
    if (combined.length > 10) {
      setPhotoError("Maximum 10 photos per listing.");
      return;
    }
    // The raw pre-upload limit is generous — compression happens
    // automatically on submit and brings even a large phone photo down
    // to a few hundred KB, so there's no need to reject normal camera
    // photos here. This just guards against something absurd.
    const oversized = files.find((f) => f.size > 20 * 1024 * 1024);
    if (oversized) {
      setPhotoError(`"${oversized.name}" is too large to use.`);
      return;
    }

    setPhotoFiles(combined);
    setPhotoPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = ""; // allow picking the same file again if removed and re-added
  }

  function removePhoto(index: number) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  const isCustomSuburb = suburbChoice === CUSTOM_OPTION;
  const finalSuburbName = isCustomSuburb ? customSuburb.trim() : suburbChoice;

  const canSubmit =
    title.trim() &&
    description.trim() &&
    address.trim() &&
    price &&
    finalSuburbName &&
    (!isCustomSuburb || (manualDistance && Number(manualDistance) > 0)) &&
    !busy;

  async function handleSubmit() {
    if (!profile || !canSubmit) return;
    setBusy(true);

    const uni = getUniversity(profile.universityId);
    const knownCoords = SUBURB_COORDS[finalSuburbName];

    let dist: number;
    let lat: number;
    let lng: number;

    if (knownCoords && uni) {
      // Known suburb — auto-calculate distance from its real coordinates.
      dist = Math.round(distanceKm(knownCoords.lat, knownCoords.lng, uni.lat, uni.lng) * 10) / 10;
      lat = knownCoords.lat;
      lng = knownCoords.lng;
    } else {
      // Custom suburb — no coordinates on file, so use the distance the
      // person entered manually. Map pin falls back to the campus location
      // itself since we have no real coordinates to plot (noted in the
      // Listing type as a known limitation, not a bug).
      dist = Number(manualDistance) || 0;
      lat = uni?.lat ?? 0;
      lng = uni?.lng ?? 0;
    }

    try {
      // If this is a brand-new suburb name, save it so it shows up as a
      // normal option for every agent/landlord at this university from
      // now on.
      if (isCustomSuburb) {
        await addCustomSuburb(profile.universityId, finalSuburbName);
      }

      const listingId = await createListing({
        ownerId: profile.uid,
        ownerName: profile.fullName,
        ownerRole: profile.role as "agent" | "landlord",
        ownerPhotoURL: profile.photoURL,
        universityId: profile.universityId,
        title: title.trim(),
        description: description.trim(),
        address: address.trim(),
        suburb: finalSuburbName,
        propertyType,
        price: Number(price),
        beds: Number(beds),
        baths: Number(baths),
        amenities: selectedAmenities,
        photos: [],
        distanceKm: dist,
        nearShuttle,
        availableFrom: availableFrom || new Date().toISOString().split("T")[0],
        semester: null,
        status: "available",
        lat,
        lng,
      });

      // Photos upload after the listing exists, since we need its id for
      // the storage path. If this step fails, the listing itself is
      // already published — better than losing the whole submission if
      // only the photo step has trouble (e.g. a flaky connection).
      if (photoFiles.length > 0) {
        setUploadingPhotos(true);
        try {
          const urls = await uploadImages("listings", listingId, photoFiles);
          await updateListing(listingId, { photos: urls });
        } catch (photoErr) {
          console.error(photoErr);
          onToast("Listing published, but photo upload failed — you can add photos later.");
          onBack();
          return;
        } finally {
          setUploadingPhotos(false);
        }
      }

      onToast("Listing published!");
      onBack();
    } catch (err) {
      console.error(err);
      onToast("Failed to publish listing");
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
        <h1 className="font-bold text-gray-900 dark:text-gray-100">Add New Listing</h1>
      </div>

      <div className="px-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Cozy single room near campus"
            className="w-full mt-1 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the property, area, what's included…"
            className="w-full mt-1 h-28 p-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm resize-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 14 Mawere Close, Hatcliffe"
            className="w-full mt-1 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Suburb</label>
            <select value={suburbChoice} onChange={(e) => setSuburbChoice(e.target.value)}
              className="w-full mt-1 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500">
              {suburbOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              <option value={CUSTOM_OPTION}>+ Add a new suburb…</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Type</label>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType)}
              className="w-full mt-1 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500">
              {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {isCustomSuburb && (
          <div className="grid grid-cols-2 gap-3 -mt-2">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">New suburb name</label>
              <input value={customSuburb} onChange={(e) => setCustomSuburb(e.target.value)}
                placeholder="e.g. Mabelreign"
                className="w-full mt-1 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Distance from campus (km)</label>
              <input type="number" value={manualDistance} onChange={(e) => setManualDistance(e.target.value)}
                placeholder="e.g. 8"
                className="w-full mt-1 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
            </div>
          </div>
        )}
        {isCustomSuburb && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 -mt-2">
            New suburbs need a manual distance estimate since we don't have
            map coordinates for them yet. Once you publish, "{customSuburb || "this suburb"}"
            will show up as a normal option for everyone at your university.
          </p>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Price $/mo</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder="200"
              className="w-full mt-1 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Beds</label>
            <input type="number" value={beds} onChange={(e) => setBeds(e.target.value)}
              className="w-full mt-1 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Baths</label>
            <input type="number" value={baths} onChange={(e) => setBaths(e.target.value)}
              className="w-full mt-1 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Available from</label>
          <input type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)}
            className="w-full mt-1 h-12 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
            Photos <span className="text-gray-400 dark:text-gray-500">(up to 10 — compressed automatically)</span>
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
            {photoFiles.length < 10 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 cursor-pointer">
                <Camera size={18} />
                <span className="text-[10px] mt-1">Add</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
              </label>
            )}
          </div>
          {photoError && <p className="text-[11px] text-red-500 mt-2">{photoError}</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <button key={a} onClick={() => toggleAmenity(a)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  selectedAmenities.includes(a)
                    ? "bg-brand-700 text-white border-transparent"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                }`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
          <input type="checkbox" checked={nearShuttle} onChange={(e) => setNearShuttle(e.target.checked)}
            className="h-5 w-5 rounded accent-red-900" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Near shuttle pickup point</span>
        </label>

        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full h-12 rounded-xl bg-brand-700 text-white font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
          {uploadingPhotos ? (
            <><Loader2 size={18} className="animate-spin" /> Uploading photos…</>
          ) : busy ? (
            <><Loader2 size={18} className="animate-spin" /> Publishing…</>
          ) : (
            "Publish Listing"
          )}
        </button>
      </div>
    </div>
  );
}

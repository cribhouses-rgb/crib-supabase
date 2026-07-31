import { useEffect, useState, Suspense, lazy } from "react";
import {
  Building2, MessageCircle, Calendar, Plus, Loader2,
  Trash2, CheckCircle, Edit3, ChevronDown, ChevronUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getOwnerListings, updateListing, deleteListing,
  getOwnerInquiries, replyToInquiry,
} from "../lib/db";
import type { Listing, Inquiry } from "../types";

// Only landlords ever see this section (tenants/payments/maintenance) —
// agents never load it at all this way.
const LandlordExtras = lazy(() => import("./LandlordExtras"));

interface Props {
  onAddListing: () => void;
  onToast: (msg: string) => void;
  onOpenChats: () => void;
}

export default function ProviderDashboard({ onAddListing, onToast, onOpenChats }: Props) {
  const { profile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openInquiry, setOpenInquiry] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      getOwnerListings(profile.uid),
      getOwnerInquiries(profile.uid),
    ])
      .then(([l, i]) => { setListings(l); setInquiries(i); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile]);

  const active = listings.filter((l) => l.status === "available").length;
  const rented = listings.filter((l) => l.status === "rented").length;
  const pending = inquiries.filter((i) => i.status === "pending").length;

  async function handleMarkRented(id: string) {
    await updateListing(id, { status: "rented" });
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: "rented" } : l));
    onToast("Marked as rented");
  }

  async function handleMarkAvailable(id: string) {
    await updateListing(id, { status: "available" });
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: "available" } : l));
    onToast("Marked as available");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this listing?")) return;
    await deleteListing(id);
    setListings((prev) => prev.filter((l) => l.id !== id));
    onToast("Listing deleted");
  }

  async function handleReply(inquiryId: string) {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await replyToInquiry(inquiryId, replyText.trim());
      setInquiries((prev) =>
        prev.map((i) => i.id === inquiryId ? { ...i, reply: replyText.trim(), status: "replied" } : i)
      );
      setReplyText("");
      setOpenInquiry(null);
      onToast("Reply sent");
    } catch { onToast("Failed to send reply"); }
    finally { setReplying(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-700 dark:text-brand-400" size={28} />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Hi {profile?.fullName?.split(" ")[0]}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.role} dashboard</p>
        </div>
        <button onClick={onOpenChats} className="h-9 w-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
          <MessageCircle size={16} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { label: "Active", val: active, icon: Building2 },
          { label: "Inquiries", val: pending, icon: MessageCircle },
          { label: "Rented", val: rented, icon: Calendar },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
            <s.icon size={18} className="text-brand-700 dark:text-brand-400" />
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{s.val}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add listing button */}
      <button
        onClick={onAddListing}
        className="w-full mt-4 h-12 rounded-xl text-white font-semibold flex items-center justify-center gap-2 bg-brand-700"
      >
        <Plus size={18} /> Add New Listing
      </button>

      {/* Listings */}
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-2">Your listings</h2>
      {listings.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          No listings yet. Tap "Add New Listing" above.
        </p>
      ) : (
        <div className="space-y-2">
          {listings.map((l) => (
            <div key={l.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{l.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">${l.price}/mo · {l.suburb}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                  l.status === "available" ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}>
                  {l.status}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                {l.status === "available" ? (
                  <button onClick={() => handleMarkRented(l.id)}
                    className="flex-1 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 font-medium flex items-center justify-center gap-1">
                    <CheckCircle size={12} /> Mark rented
                  </button>
                ) : (
                  <button onClick={() => handleMarkAvailable(l.id)}
                    className="flex-1 h-8 rounded-lg bg-green-50 dark:bg-green-950 text-xs text-green-700 dark:text-green-300 font-medium flex items-center justify-center gap-1">
                    <Edit3 size={12} /> Re-list
                  </button>
                )}
                <button onClick={() => handleDelete(l.id)}
                  className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400 flex items-center justify-center">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inquiries */}
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-2">
        Inquiries ({inquiries.length})
      </h2>
      {inquiries.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          No inquiries yet.
        </p>
      ) : (
        <div className="space-y-2">
          {inquiries.map((inq) => (
            <div key={inq.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setOpenInquiry(openInquiry === inq.id ? null : inq.id)}
                className="w-full flex items-center gap-2 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{inq.studentName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Re: {inq.listingTitle}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                  inq.status === "pending" ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                }`}>
                  {inq.status}
                </span>
                {openInquiry === inq.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {openInquiry === inq.id && (
                <div className="mt-3 space-y-2">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-300">
                    {inq.message}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Phone: {inq.studentPhone}</p>

                  {inq.reply ? (
                    <div className="bg-brand-50 rounded-xl p-3 text-sm text-brand-800">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">Your reply:</p>
                      {inq.reply}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply…"
                        className="flex-1 h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                      <button
                        onClick={() => handleReply(inq.id)}
                        disabled={replying || !replyText.trim()}
                        className="h-10 px-4 rounded-xl bg-brand-700 text-white text-sm font-medium disabled:opacity-40"
                      >
                        {replying ? "…" : "Reply"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Landlord-only: tenants, payments, maintenance */}
      {profile?.role === "landlord" && (
        <Suspense fallback={<div className="flex justify-center py-6"><Loader2 className="animate-spin text-brand-700" size={22} /></div>}>
          <LandlordExtras onToast={onToast} />
        </Suspense>
      )}
    </div>
  );
}

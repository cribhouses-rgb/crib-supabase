import { useEffect, useState } from "react";
import { Plus, Trash2, CheckCircle, MessageCircle, Flag } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMarketItems, getMySellerItems, updateMarketItem, deleteMarketItem, createReport } from "../lib/db";
import ReportModal from "../components/ReportModal";
import type { MarketItem } from "../types";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "textbooks", label: "Textbooks" },
  { value: "furniture", label: "Furniture" },
  { value: "electronics", label: "Electronics" },
];

const COVER_GRADIENTS = [
  "linear-gradient(135deg, #7f1d1d, #b91c1c)",
  "linear-gradient(135deg, #0f766e, #14b8a6)",
  "linear-gradient(135deg, #1e3a8a, #3b82f6)",
  "linear-gradient(135deg, #7c2d12, #ea580c)",
  "linear-gradient(135deg, #4c1d95, #7c3aed)",
  "linear-gradient(135deg, #365314, #65a30d)",
];

interface Props {
  onToast: (msg: string) => void;
  onAddItem: () => void;
  onStartChat: (otherUid: string, otherName: string, contextId: string, contextLabel: string) => void;
}

export default function MarketplaceScreen({ onToast, onAddItem, onStartChat }: Props) {
  const { profile } = useAuth();
  const [tab, setTab] = useState<"browse" | "mine">("browse");
  const [items, setItems] = useState<MarketItem[]>([]);
  const [myItems, setMyItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [reportTarget, setReportTarget] = useState<MarketItem | null>(null);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    if (tab === "browse") {
      getMarketItems(profile.universityId, category || undefined)
        .then(setItems)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      getMySellerItems(profile.uid)
        .then(setMyItems)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [profile, category, tab]);

  async function handleMarkSold(id: string) {
    await updateMarketItem(id, { status: "sold" });
    setMyItems((prev) => prev.map((i) => i.id === id ? { ...i, status: "sold" } : i));
    onToast("Marked as sold");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    await deleteMarketItem(id);
    setMyItems((prev) => prev.filter((i) => i.id !== id));
    onToast("Item deleted");
  }

  return (
    <div className="pb-24">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Marketplace</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Buy & sell with fellow students</p>
          </div>
          <button onClick={onAddItem}
            className="h-10 px-4 rounded-xl bg-brand-700 text-white text-sm font-medium flex items-center gap-1">
            <Plus size={15} /> Sell
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          <button onClick={() => setTab("browse")}
            className={`flex-1 h-10 rounded-xl text-sm font-medium ${
              tab === "browse" ? "bg-brand-700 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
            }`}>Browse</button>
          <button onClick={() => setTab("mine")}
            className={`flex-1 h-10 rounded-xl text-sm font-medium ${
              tab === "mine" ? "bg-brand-700 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
            }`}>My items</button>
        </div>

        {tab === "browse" && (
          <>
            <div className="flex gap-2 mt-3 flex-wrap">
              {CATEGORIES.map((c) => (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    category === c.value ? "text-white border-transparent bg-brand-700" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                  }`}>{c.label}</button>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 animate-pulse">
                    <div className="h-24 bg-gray-200 dark:bg-gray-600 rounded-t-2xl" />
                    <div className="p-2.5 space-y-1.5"><div className="h-4 w-12 bg-gray-200 dark:bg-gray-600 rounded" /><div className="h-3 w-full bg-gray-200 dark:bg-gray-600 rounded" /></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {items.map((m) => {
                  const coverIdx = m.title.length % COVER_GRADIENTS.length;
                  return (
                    <div key={m.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 relative">
                      <button
                        onClick={() => setReportTarget(m)}
                        className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center"
                      >
                        <Flag size={12} className="text-gray-500 dark:text-gray-400" />
                      </button>
                      <div className="h-24 flex items-center justify-center"
                        style={{ background: m.photos[0] ? `url(${m.photos[0]}) center/cover` : COVER_GRADIENTS[coverIdx] }}>
                        {!m.photos[0] && <span className="text-white/30 text-2xl font-bold">{m.category[0].toUpperCase()}</span>}
                      </div>
                      <div className="p-2.5">
                        <p className="text-sm font-bold text-brand-700 dark:text-brand-400">${m.price}</p>
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{m.title}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{m.condition.replace("_", " ")} · {m.sellerName}</p>
                        <button
                          onClick={() => onStartChat(m.sellerId, m.sellerName, m.id, m.title)}
                          className="w-full mt-2 h-8 rounded-lg text-white text-xs font-medium bg-brand-700 flex items-center justify-center gap-1"
                        >
                          <MessageCircle size={12} /> Message
                        </button>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <p className="col-span-2 text-center text-gray-400 dark:text-gray-500 text-sm mt-6">No items listed yet.</p>}
              </div>
            )}
          </>
        )}

        {tab === "mine" && (
          <div className="space-y-2 mt-4">
            {loading ? (
              <div className="flex justify-center py-10"><div className="h-6 w-6 rounded-full border-2 border-brand-700 border-t-transparent animate-spin" /></div>
            ) : myItems.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-6">You haven't listed anything yet.</p>
            ) : (
              myItems.map((m) => (
                <div key={m.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{m.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">${m.price} · {m.category} · {m.condition.replace("_"," ")}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                      m.status === "available" ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}>{m.status}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {m.status === "available" && (
                      <button onClick={() => handleMarkSold(m.id)}
                        className="flex-1 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 font-medium flex items-center justify-center gap-1">
                        <CheckCircle size={12} /> Mark sold
                      </button>
                    )}
                    <button onClick={() => handleDelete(m.id)}
                      className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400 flex items-center justify-center">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {reportTarget && profile && (
        <ReportModal
          targetLabel={reportTarget.title}
          onClose={() => setReportTarget(null)}
          onSubmit={async (reason, details) => {
            await createReport({
              reporterId: profile.uid,
              reporterName: profile.fullName,
              targetType: "marketplace",
              targetId: reportTarget.id,
              targetLabel: reportTarget.title,
              reason,
              details,
              universityId: profile.universityId,
            });
          }}
        />
      )}
    </div>
  );
}

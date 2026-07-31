import { useEffect, useState } from "react";
import {
  Users, DollarSign, Wrench, Plus, Loader2,
  ChevronDown, ChevronUp, Check, Clock, AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getLandlordTenants, createTenant, updateTenantBalance,
  getLandlordMaintenance, updateMaintenanceStatus,
  getOwnerListings,
} from "../lib/db";
import type { Tenant, MaintenanceRequest, Listing } from "../types";

interface Props {
  onToast: (msg: string) => void;
}

export default function LandlordExtras({ onToast }: Props) {
  const { profile } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  // Add tenant form
  const [tName, setTName] = useState("");
  const [tPhone, setTPhone] = useState("");
  const [tListing, setTListing] = useState("");
  const [tLeaseStart, setTLeaseStart] = useState("");
  const [tLeaseEnd, setTLeaseEnd] = useState("");
  const [tRent, setTRent] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      getLandlordTenants(profile.uid),
      getLandlordMaintenance(profile.uid),
      getOwnerListings(profile.uid),
    ])
      .then(([t, m, l]) => { setTenants(t); setMaintenance(m); setListings(l); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile]);

  async function handleAddTenant() {
    if (!profile || !tName || !tListing || !tRent) return;
    setAdding(true);
    const listing = listings.find((l) => l.id === tListing);
    try {
      const id = await createTenant({
        landlordId: profile.uid,
        listingId: tListing,
        listingTitle: listing?.title ?? "",
        tenantName: tName,
        tenantPhone: tPhone,
        leaseStart: tLeaseStart,
        leaseEnd: tLeaseEnd,
        monthlyRent: Number(tRent),
        balance: Number(tRent),
        universityId: profile.universityId,
      });
      setTenants((prev) => [...prev, {
        id, landlordId: profile.uid, listingId: tListing,
        listingTitle: listing?.title ?? "", tenantName: tName,
        tenantPhone: tPhone, leaseStart: tLeaseStart, leaseEnd: tLeaseEnd,
        monthlyRent: Number(tRent), balance: Number(tRent),
        universityId: profile.universityId, createdAt: Date.now(),
      }]);
      setShowAddTenant(false);
      setTName(""); setTPhone(""); setTListing(""); setTLeaseStart(""); setTLeaseEnd(""); setTRent("");
      onToast("Tenant added");
    } catch { onToast("Failed to add tenant"); }
    finally { setAdding(false); }
  }

  async function handleRecordPayment(tenantId: string) {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;
    try {
      await updateTenantBalance(tenantId, amount);
      setTenants((prev) => prev.map((t) =>
        t.id === tenantId ? { ...t, balance: t.balance - amount } : t
      ));
      setPaymentAmount("");
      onToast(`$${amount} payment recorded`);
    } catch { onToast("Failed to record payment"); }
  }

  async function handleMaintenanceUpdate(id: string, status: "in_progress" | "resolved") {
    try {
      await updateMaintenanceStatus(id, status);
      setMaintenance((prev) => prev.map((m) =>
        m.id === id ? { ...m, status, ...(status === "resolved" ? { resolvedAt: Date.now() } : {}) } : m
      ));
      onToast(status === "resolved" ? "Marked as resolved" : "Marked in progress");
    } catch { onToast("Failed to update"); }
  }

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-brand-700 dark:text-brand-400" size={28} /></div>;
  }

  const openMaint = maintenance.filter((m) => m.status !== "resolved");
  const resolvedMaint = maintenance.filter((m) => m.status === "resolved");

  return (
    <div className="px-4 pb-8 space-y-6">
      {/* TENANTS */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users size={15} /> Tenants ({tenants.length})
          </h2>
          <button onClick={() => setShowAddTenant(!showAddTenant)}
            className="text-xs text-brand-700 dark:text-brand-400 font-medium flex items-center gap-1">
            <Plus size={13} /> Add
          </button>
        </div>

        {showAddTenant && (
          <div className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
            <input value={tName} onChange={(e) => setTName(e.target.value)}
              placeholder="Tenant name" className="w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
            <input value={tPhone} onChange={(e) => setTPhone(e.target.value)}
              placeholder="Phone +263 71X XXX XXX" className="w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
            <select value={tListing} onChange={(e) => setTListing(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500">
              <option value="">Select property</option>
              {listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 dark:text-gray-500">Lease start</label>
                <input type="date" value={tLeaseStart} onChange={(e) => setTLeaseStart(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 dark:text-gray-500">Lease end</label>
                <input type="date" value={tLeaseEnd} onChange={(e) => setTLeaseEnd(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
              </div>
            </div>
            <input type="number" value={tRent} onChange={(e) => setTRent(e.target.value)}
              placeholder="Monthly rent $" className="w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
            <button onClick={handleAddTenant} disabled={adding || !tName || !tListing || !tRent}
              className="w-full h-11 rounded-xl bg-brand-700 text-white text-sm font-medium disabled:opacity-40">
              {adding ? "Adding…" : "Add tenant"}
            </button>
          </div>
        )}

        {tenants.length === 0 && !showAddTenant ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 mt-2">
            No tenants yet. Tap "+ Add" to track a tenant.
          </p>
        ) : (
          <div className="space-y-2 mt-2">
            {tenants.map((t) => (
              <div key={t.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <button onClick={() => setExpandedTenant(expandedTenant === t.id ? null : t.id)}
                  className="w-full p-3 flex items-center gap-3 text-left">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t.tenantName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.listingTitle}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      Lease: {t.leaseStart || "—"} → {t.leaseEnd || "—"}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    t.balance <= 0 ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                  }`}>
                    {t.balance <= 0 ? "Paid" : `$${t.balance} due`}
                  </span>
                  {expandedTenant === t.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {expandedTenant === t.id && (
                  <div className="px-3 pb-3 space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Phone: {t.tenantPhone || "—"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Rent: ${t.monthlyRent}/mo · Balance: ${t.balance}</p>
                    <div className="flex gap-2">
                      <input type="number" value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="Amount $"
                        className="flex-1 h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500" />
                      <button onClick={() => handleRecordPayment(t.id)}
                        disabled={!paymentAmount}
                        className="h-10 px-4 rounded-xl bg-green-600 text-white text-sm font-medium disabled:opacity-40">
                        <DollarSign size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MAINTENANCE */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Wrench size={15} /> Maintenance ({openMaint.length} open)
        </h2>

        {openMaint.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 mt-2">
            No open maintenance requests.
          </p>
        ) : (
          <div className="space-y-2 mt-2">
            {openMaint.map((m) => (
              <div key={m.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className={m.status === "open" ? "text-red-500 dark:text-red-400 mt-0.5" : "text-amber-500 mt-0.5"} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{m.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{m.tenantName} · {m.listingTitle}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${
                      m.status === "open" ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" : "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
                    }`}>
                      {m.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {m.status === "open" && (
                    <button onClick={() => handleMaintenanceUpdate(m.id, "in_progress")}
                      className="flex-1 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center justify-center gap-1">
                      <Clock size={12} /> In progress
                    </button>
                  )}
                  <button onClick={() => handleMaintenanceUpdate(m.id, "resolved")}
                    className="flex-1 h-8 rounded-lg bg-green-50 dark:bg-green-950 text-xs text-green-700 dark:text-green-300 font-medium flex items-center justify-center gap-1">
                    <Check size={12} /> Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {resolvedMaint.length > 0 && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">{resolvedMaint.length} resolved request{resolvedMaint.length > 1 ? "s" : ""}</p>
        )}
      </div>
    </div>
  );
}

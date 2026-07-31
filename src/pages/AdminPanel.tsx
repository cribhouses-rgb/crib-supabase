import { useEffect, useState } from "react";
import {
  Users, Building2, Store, MessageCircle, Star, LogOut,
  Loader2, Trash2, Home, Lock, Unlock, GraduationCap, ChevronDown, ChevronUp,
  Flag, BadgeCheck, ShieldOff, Download, Bug, CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUniversity, UNIVERSITIES } from "../data/universities";
import {
  adminGetAllUsers, adminGetAllListings, adminGetAllMarketItems,
  adminGetAllInquiries, adminGetAllReviews, adminGetAllReports,
  adminDeleteListing, adminDeleteMarketItem, adminUpdateReportStatus,
  adminSetUserVerified, adminExportAllData,
  adminGetErrorLogs, adminMarkErrorResolved, adminDeleteErrorLog,
} from "../lib/db";
import type { UserProfile, Listing, MarketItem, Inquiry, Review, Report, ErrorLog } from "../types";

type AdminTab = "overview" | "universities" | "users" | "listings" | "marketplace" | "reports" | "errors";

export default function AdminPanel() {
  const { signOutUser } = useAuth();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [showSignOut, setShowSignOut] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [unlockedUnis, setUnlockedUnis] = useState<Set<string>>(new Set());
  const [expandedUni, setExpandedUni] = useState<string | null>(null);
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>({});
  const [codeErrors, setCodeErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      adminGetAllUsers(),
      adminGetAllListings(),
      adminGetAllMarketItems(),
      adminGetAllInquiries(),
      adminGetAllReviews(),
      adminGetAllReports(),
      adminGetErrorLogs(),
    ])
      .then(([u, l, m, i, r, rep, errs]) => {
        setUsers(u); setListings(l); setMarketItems(m); setInquiries(i); setReviews(r); setReports(rep);
        setErrorLogs(errs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleDeleteListing(id: string) {
    if (!confirm("Delete this listing permanently?")) return;
    await adminDeleteListing(id);
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleDeleteMarketItem(id: string) {
    if (!confirm("Delete this item permanently?")) return;
    await adminDeleteMarketItem(id);
    setMarketItems((prev) => prev.filter((m) => m.id !== id));
  }

  function handleUnlockUni(uniId: string) {
    const uni = getUniversity(uniId);
    const entered = (codeInputs[uniId] ?? "").trim();
    if (!uni) return;
    if (entered.toUpperCase() === uni.adminCode.toUpperCase()) {
      setUnlockedUnis((prev) => new Set(prev).add(uniId));
      setCodeErrors((prev) => ({ ...prev, [uniId]: "" }));
      setExpandedUni(uniId);
    } else {
      setCodeErrors((prev) => ({ ...prev, [uniId]: "Incorrect code" }));
    }
  }

  function handleLockUni(uniId: string) {
    setUnlockedUnis((prev) => {
      const next = new Set(prev);
      next.delete(uniId);
      return next;
    });
    if (expandedUni === uniId) setExpandedUni(null);
  }

  async function handleReportStatus(id: string, status: "reviewed" | "dismissed") {
    await adminUpdateReportStatus(id, status);
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  }

  async function handleToggleVerified(uid: string, current: boolean) {
    await adminSetUserVerified(uid, !current);
    setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, verified: !current } : u));
  }

  async function handleBackup() {
    setBackingUp(true);
    try {
      const data = await adminExportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `student-crib-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Backup failed. Check the console for details.");
    } finally {
      setBackingUp(false);
    }
  }

  async function handleMarkErrorResolved(id: string) {
    await adminMarkErrorResolved(id, true);
    setErrorLogs((prev) => prev.map((e) => e.id === id ? { ...e, resolved: true } : e));
  }

  async function handleDeleteError(id: string) {
    await adminDeleteErrorLog(id);
    setErrorLogs((prev) => prev.filter((e) => e.id !== id));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-700 dark:text-brand-400" size={32} />
      </div>
    );
  }

  const roleCounts = {
    student: users.filter((u) => u.role === "student").length,
    agent: users.filter((u) => u.role === "agent").length,
    landlord: users.filter((u) => u.role === "landlord").length,
  };

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3 bg-gray-900 text-white">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-brand-700">
            <Home className="text-white" size={16} />
          </div>
          <span className="font-bold">Student Crib · Admin</span>
          <button onClick={() => setShowSignOut(true)} className="ml-auto">
            <LogOut size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 overflow-x-auto">
          {(["overview", "universities", "users", "listings", "marketplace", "reports", "errors"] as AdminTab[]).map((t) => {
            const unresolvedCount = t === "errors" ? errorLogs.filter((e) => !e.resolved).length : 0;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize flex items-center gap-1 ${
                  tab === t ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" : "bg-gray-700 text-gray-300"
                }`}
              >
                {t}
                {unresolvedCount > 0 && (
                  <span className="h-4 min-w-4 px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">
                    {unresolvedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-4">
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total users", val: users.length, icon: Users },
                { label: "Listings", val: listings.length, icon: Building2 },
                { label: "Marketplace items", val: marketItems.length, icon: Store },
                { label: "Inquiries", val: inquiries.length, icon: MessageCircle },
              ].map((s) => (
                <div key={s.label} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                  <s.icon size={20} className="text-brand-700 dark:text-brand-400" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">{s.val}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 mt-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Users by role</p>
              <div className="flex justify-between text-sm">
                <span>Students: <b>{roleCounts.student}</b></span>
                <span>Agents: <b>{roleCounts.agent}</b></span>
                <span>Landlords: <b>{roleCounts.landlord}</b></span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 mt-3 flex items-center gap-2">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              <p className="text-sm text-gray-700 dark:text-gray-300">{reviews.length} reviews submitted</p>
            </div>

            <button
              onClick={handleBackup}
              disabled={backingUp}
              className="w-full mt-3 h-12 rounded-xl bg-gray-900 dark:bg-gray-700 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {backingUp ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {backingUp ? "Preparing backup…" : "Download full backup (JSON)"}
            </button>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
              Downloads every collection except chat messages. This is a manual, on-demand export — not scheduled. Run it regularly and keep copies somewhere safe.
            </p>
          </>
        )}

        {tab === "universities" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
              Enter a university's code to unlock its filtered data below.
            </p>
            {UNIVERSITIES.map((uni) => {
              const isUnlocked = unlockedUnis.has(uni.id);
              const isExpanded = expandedUni === uni.id;
              const uniUsers = users.filter((u) => u.universityId === uni.id);
              const uniListings = listings.filter((l) => l.universityId === uni.id);
              const uniMarket = marketItems.filter((m) => m.universityId === uni.id);

              return (
                <div key={uni.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <button
                    onClick={() => isUnlocked && setExpandedUni(isExpanded ? null : uni.id)}
                    className="w-full p-3 flex items-center gap-3 text-left"
                  >
                    <div className="h-9 w-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <GraduationCap size={16} className="text-brand-700 dark:text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{uni.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">@{uni.domain}</p>
                    </div>
                    {isUnlocked ? (
                      <>
                        <Unlock size={15} className="text-green-600 dark:text-green-400" />
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </>
                    ) : (
                      <Lock size={15} className="text-gray-400 dark:text-gray-500" />
                    )}
                  </button>

                  {!isUnlocked && (
                    <div className="px-3 pb-3 flex gap-2">
                      <input
                        value={codeInputs[uni.id] ?? ""}
                        onChange={(e) =>
                          setCodeInputs((prev) => ({ ...prev, [uni.id]: e.target.value }))
                        }
                        placeholder="Enter university code"
                        className="flex-1 h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                      <button
                        onClick={() => handleUnlockUni(uni.id)}
                        className="h-10 px-4 rounded-xl bg-brand-700 text-white text-sm font-medium"
                      >
                        Unlock
                      </button>
                    </div>
                  )}
                  {codeErrors[uni.id] && (
                    <p className="px-3 pb-2 text-xs text-red-500 dark:text-red-400">{codeErrors[uni.id]}</p>
                  )}

                  {isUnlocked && isExpanded && (
                    <div className="px-3 pb-3 space-y-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-2">
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{uniUsers.length}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Users</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-2">
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{uniListings.length}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Listings</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-2">
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{uniMarket.length}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Market items</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleLockUni(uni.id)}
                        className="w-full h-9 rounded-xl border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 font-medium flex items-center justify-center gap-1"
                      >
                        <Lock size={12} /> Lock again
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-2">
            {users.map((u) => {
              const uni = getUniversity(u.universityId);
              const isProviderRole = u.role === "agent" || u.role === "landlord";
              return (
                <div key={u.uid} className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 flex items-center gap-1">
                      {u.fullName || "(no name)"}
                      {u.verified && <BadgeCheck size={13} className="text-blue-500 dark:text-blue-400 fill-blue-100" />}
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                      {u.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{uni?.name ?? u.universityId}</p>
                  {isProviderRole && (
                    <button
                      onClick={() => handleToggleVerified(u.uid, u.verified)}
                      className={`w-full mt-2 h-8 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                        u.verified ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300" : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {u.verified ? <><ShieldOff size={12} /> Remove verification</> : <><BadgeCheck size={12} /> Verify</>}
                    </button>
                  )}
                </div>
              );
            })}
            {users.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-6">No users yet.</p>}
          </div>
        )}

        {tab === "listings" && (
          <div className="space-y-2">
            {listings.map((l) => (
              <div key={l.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{l.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">${l.price}/mo · {l.suburb} · {l.ownerName}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                    l.status === "available" ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}>
                    {l.status}
                  </span>
                  <button onClick={() => handleDeleteListing(l.id)}
                    className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {listings.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-6">No listings yet.</p>}
          </div>
        )}

        {tab === "marketplace" && (
          <div className="space-y-2">
            {marketItems.map((m) => (
              <div key={m.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{m.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">${m.price} · {m.category} · {m.sellerName}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                    m.status === "available" ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}>
                    {m.status}
                  </span>
                  <button onClick={() => handleDeleteMarketItem(m.id)}
                    className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {marketItems.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-6">No items yet.</p>}
          </div>
        )}

        {tab === "reports" && (
          <div className="space-y-2">
            {reports.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-6">No reports filed.</p>
            ) : (
              reports
                .slice()
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((r) => (
                  <div key={r.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <Flag size={14} className="text-red-500 dark:text-red-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{r.targetLabel}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 capitalize">
                          {r.targetType} · {r.reason.replace(/_/g, " ")}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                        r.status === "open" ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                          : r.status === "reviewed" ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reported by {r.reporterName}</p>
                    {r.details && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-2">{r.details}</p>
                    )}
                    {r.status === "open" && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleReportStatus(r.id, "reviewed")}
                          className="flex-1 h-8 rounded-lg bg-green-50 dark:bg-green-950 text-xs text-green-700 dark:text-green-300 font-medium"
                        >
                          Mark reviewed
                        </button>
                        <button
                          onClick={() => handleReportStatus(r.id, "dismissed")}
                          className="flex-1 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 font-medium"
                        >
                          Dismiss
                        </button>
                        {r.targetType === "listing" && (
                          <button
                            onClick={() => handleDeleteListing(r.targetId)}
                            className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400 flex items-center justify-center"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {r.targetType === "marketplace" && (
                          <button
                            onClick={() => handleDeleteMarketItem(r.targetId)}
                            className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400 flex items-center justify-center"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        )}

        {tab === "errors" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
              Client-side errors from real user sessions — the same idea as a Sentry dashboard, self-hosted in Firestore.
            </p>
            {errorLogs.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-6">
                No errors logged yet. That's good news.
              </p>
            ) : (
              errorLogs.map((e) => (
                <div key={e.id} className={`bg-white dark:bg-gray-800 rounded-2xl p-3 border ${
                  e.resolved ? "border-gray-100 dark:border-gray-700 opacity-60" : "border-red-200 dark:border-red-900"
                }`}>
                  <div className="flex items-start gap-2">
                    <Bug size={15} className={e.resolved ? "text-gray-400 mt-0.5" : "text-red-500 mt-0.5 flex-shrink-0"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 break-words">{e.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{e.context}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(e.createdAt).toLocaleString()}
                        {e.userEmail ? ` · ${e.userEmail}` : " · not signed in"}
                      </p>
                    </div>
                  </div>
                  {e.stack && (
                    <pre className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-lg p-2 mt-2 overflow-x-auto whitespace-pre-wrap break-words max-h-24 overflow-y-auto">
                      {e.stack}
                    </pre>
                  )}
                  <div className="flex gap-2 mt-2">
                    {!e.resolved && (
                      <button onClick={() => handleMarkErrorResolved(e.id)}
                        className="flex-1 h-8 rounded-lg bg-green-50 dark:bg-green-950 text-xs text-green-700 dark:text-green-300 font-medium flex items-center justify-center gap-1">
                        <CheckCircle2 size={12} /> Mark resolved
                      </button>
                    )}
                    <button onClick={() => handleDeleteError(e.id)}
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

      {/* Sign out confirmation */}
      {showSignOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-xs text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sign out?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Are you sure you want to sign out of admin?</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowSignOut(false)}
                className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                Cancel
              </button>
              <button onClick={signOutUser}
                className="flex-1 h-11 rounded-xl bg-brand-700 text-white font-medium">
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

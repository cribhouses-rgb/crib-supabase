import { useState } from "react";
import {
  LogOut, Heart, Database, Loader2, Download, Store, Building2, KeyRound,
  Eye, EyeOff, Trash2, AlertTriangle, Sun, Moon, Smartphone,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUniversity } from "../data/universities";
import { seedDatabase } from "../lib/seed";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { useTheme, type ThemeMode } from "../hooks/useTheme";
import type { Listing } from "../types";

const COVER_GRADIENTS = [
  "linear-gradient(135deg, #7f1d1d, #b91c1c)",
  "linear-gradient(135deg, #0f766e, #14b8a6)",
  "linear-gradient(135deg, #1e3a8a, #3b82f6)",
  "linear-gradient(135deg, #7c2d12, #ea580c)",
  "linear-gradient(135deg, #4c1d95, #7c3aed)",
  "linear-gradient(135deg, #365314, #65a30d)",
];

interface Props {
  favListings: Listing[];
  onOpenListing: (id: string) => void;
  onToast: (msg: string) => void;
  onAddListing: () => void;
  onAddMarketItem: () => void;
}

export default function ProfileScreen({
  favListings, onOpenListing, onToast, onAddListing, onAddMarketItem,
}: Props) {
  const { profile, firebaseUser, signOutUser, setupPassword, deleteAccount, reauthenticate } = useAuth();
  const university = getUniversity(profile?.universityId);
  const [seeding, setSeeding] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const { canInstall, install } = useInstallPrompt();
  const { mode, setMode } = useTheme();
  const isProvider = profile?.role === "agent" || profile?.role === "landlord";

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [showReauthPw, setShowReauthPw] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isGoogleAccount = firebaseUser?.identities?.some((i) => i.provider === "google") ?? true;

  async function handleSetPassword() {
    if (newPassword.length < 6) {
      setPasswordError("Minimum 6 characters");
      return;
    }
    setSettingPassword(true);
    setPasswordError(null);
    const result = await setupPassword(newPassword);
    setSettingPassword(false);
    if (result.ok) {
      onToast("Password set — you can now log in with email");
      setShowPasswordForm(false);
      setNewPassword("");
    } else {
      setPasswordError(result.error ?? "Failed to set password");
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteAccount();
    if (result.ok) {
      // onAuthStateChanged in AuthContext picks up the deletion and routes
      // back to the Welcome screen automatically — nothing else to do here.
      return;
    }
    setDeleting(false);
    if (result.needsReauth) {
      setNeedsReauth(true);
    } else {
      setDeleteError(result.error ?? "Failed to delete account.");
    }
  }

  async function handleReauthAndDelete() {
    setDeleting(true);
    setDeleteError(null);
    const reauthResult = await reauthenticate(isGoogleAccount ? undefined : reauthPassword);
    if (!reauthResult.ok) {
      setDeleting(false);
      setDeleteError(reauthResult.error ?? "Re-authentication failed.");
      return;
    }
    // Re-authenticated successfully — now the actual delete should go through.
    const deleteResult = await deleteAccount();
    if (!deleteResult.ok) {
      setDeleting(false);
      setDeleteError(deleteResult.error ?? "Failed to delete account.");
    }
    // On success, onAuthStateChanged handles the redirect.
  }

  async function handleSeed() {
    if (!profile) return;
    setSeeding(true);
    try {
      const result = await seedDatabase(profile.uid);
      if (result.listings === 0 && result.market === 0) {
        onToast("Sample data already exists");
      } else {
        onToast(`Added ${result.listings} listings, ${result.market} items`);
      }
    } catch (err) {
      console.error(err);
      onToast("Error seeding data");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="pb-24">
      <div className="px-4 pt-4">
        {/* Profile card */}
        <div className="flex items-center gap-3 mt-2 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="h-14 w-14 rounded-full flex items-center justify-center text-white text-lg font-semibold bg-brand-700 overflow-hidden">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              profile?.fullName?.split(" ").map((w) => w[0]).join("") ?? "?"
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{profile?.fullName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{profile?.role} · {university?.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{profile?.phone}</p>
          </div>
        </div>

        {/* Theme toggle */}
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Appearance</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "light" as ThemeMode, icon: Sun, label: "Light" },
              { value: "dark" as ThemeMode, icon: Moon, label: "Dark" },
              { value: "system" as ThemeMode, icon: Smartphone, label: "System" },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                className={`py-2.5 rounded-xl text-xs font-medium flex flex-col items-center gap-1 ${
                  mode === opt.value ? "bg-brand-700 text-white" : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300"
                }`}
              >
                <opt.icon size={16} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listing / selling actions */}
        <div className="mt-5 space-y-2">
          {isProvider && (
            <button
              onClick={onAddListing}
              className="w-full h-12 rounded-xl bg-brand-700 text-white flex items-center justify-center gap-2 font-semibold"
            >
              <Building2 size={18} /> Add a property listing
            </button>
          )}
          <button
            onClick={onAddMarketItem}
            className="w-full h-12 rounded-xl border border-brand-700 text-brand-700 dark:text-brand-400 flex items-center justify-center gap-2 font-semibold"
          >
            <Store size={18} /> Sell an item
          </button>
        </div>

        {/* Saved listings */}
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-5 mb-2 flex items-center gap-2">
          <Heart size={15} /> Saved listings ({favListings.length})
        </h2>
        {favListings.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
            Tap the heart on any listing to save it here.
          </p>
        ) : (
          <div className="space-y-2">
            {favListings.map((l) => {
              const coverIdx = l.title.length % COVER_GRADIENTS.length;
              return (
                <button
                  key={l.id}
                  onClick={() => onOpenListing(l.id)}
                  className="w-full flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl p-2.5 border border-gray-100 dark:border-gray-700 text-left"
                >
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center"
                    style={{ background: COVER_GRADIENTS[coverIdx] }}
                  >
                    <span className="text-white/40 text-sm font-bold">{l.suburb[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{l.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">${l.price}/mo · {l.suburb}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Set/change password */}
        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="w-full mt-5 h-11 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 font-medium"
          >
            <KeyRound size={16} /> Set a password for email login
          </button>
        ) : (
          <div className="mt-5 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Set a password so you can log in with just your email next time, without Google.
            </p>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full h-11 px-3 pr-11 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordError && <p className="text-xs text-red-500 dark:text-red-400">{passwordError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowPasswordForm(false); setNewPassword(""); setPasswordError(null); }}
                className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSetPassword}
                disabled={settingPassword || newPassword.length < 6}
                className="flex-1 h-10 rounded-xl bg-brand-700 text-white text-sm font-medium disabled:opacity-40"
              >
                {settingPassword ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Install app */}
        {canInstall && (
          <button
            onClick={install}
            className="w-full mt-5 h-11 rounded-xl bg-brand-700 text-white flex items-center justify-center gap-2 font-medium"
          >
            <Download size={16} /> Install app
          </button>
        )}

        {/* Seed button */}
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="w-full mt-5 h-11 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 font-medium disabled:opacity-50"
        >
          {seeding ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
          {seeding ? "Seeding…" : "Seed sample data"}
        </button>

        {/* Sign out */}
        <button
          onClick={() => setShowSignOut(true)}
          className="w-full mt-3 h-11 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 font-medium"
        >
          <LogOut size={16} /> Sign out
        </button>

        {/* Delete account */}
        <button
          onClick={() => { setShowDeleteConfirm(true); setDeleteError(null); setNeedsReauth(false); }}
          className="w-full mt-3 h-11 rounded-xl border border-red-200 bg-white dark:bg-gray-800 flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-medium"
        >
          <Trash2 size={16} /> Delete account
        </button>

        {/* Sign out confirmation */}
        {showSignOut && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-xs text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sign out?</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Are you sure you want to sign out?</p>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowSignOut(false)}
                  className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={signOutUser}
                  className="flex-1 h-11 rounded-xl bg-brand-700 text-white font-medium"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete account confirmation / re-auth */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-xs">
              <div className="flex flex-col items-center text-center">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-2">
                  {needsReauth ? "Confirm it's you" : "Delete your account?"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {needsReauth
                    ? isGoogleAccount
                      ? "For your security, please sign in with Google again to confirm this deletion."
                      : "For your security, please re-enter your password to confirm this deletion."
                    : "This permanently deletes your profile, your listings, your marketplace items, and your saved favorites. This cannot be undone."}
                </p>
              </div>

              {needsReauth && !isGoogleAccount && (
                <div className="relative mt-4">
                  <input
                    type={showReauthPw ? "text" : "password"}
                    value={reauthPassword}
                    onChange={(e) => setReauthPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full h-11 px-3 pr-11 rounded-xl border border-gray-200 dark:border-gray-600 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowReauthPw(!showReauthPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  >
                    {showReauthPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              )}

              {deleteError && <p className="text-xs text-red-500 dark:text-red-400 mt-3">{deleteError}</p>}

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setNeedsReauth(false); setReauthPassword(""); }}
                  disabled={deleting}
                  className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={needsReauth ? handleReauthAndDelete : handleConfirmDelete}
                  disabled={deleting || (needsReauth && !isGoogleAccount && reauthPassword.length < 6)}
                  className="flex-1 h-11 rounded-xl bg-red-600 text-white font-medium disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {deleting ? "Deleting…" : needsReauth ? "Confirm & delete" : "Delete permanently"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

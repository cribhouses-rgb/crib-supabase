import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import { ADMIN_EMAIL } from "../lib/admin";
import { TERMS_VERSION } from "../data/terms";
import { logError } from "../lib/errorLog";
import type { UserProfile, UserRole } from "../types";

type AuthStatus =
  | "loading"
  | "signed-out"
  | "needs-role"
  | "needs-profile"
  | "ready"
  | "admin";

interface SignupResult {
  ok: boolean;
  error?: string;
  needsReauth?: boolean;
}

interface AuthContextValue {
  status: AuthStatus;
  /** Kept the same prop name as the Firebase version to minimize churn
   *  across page components, even though this is now a Supabase user. */
  firebaseUser: SupabaseUser | null;
  profile: UserProfile | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  createProfile: (role: UserRole, universityId: string) => Promise<SignupResult>;
  completeProfile: (fullName: string, phone: string) => Promise<SignupResult>;
  setupPassword: (password: string) => Promise<SignupResult>;
  resetPassword: (email: string) => Promise<SignupResult>;
  deleteAccount: () => Promise<SignupResult>;
  reauthenticate: (password?: string) => Promise<SignupResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Converts a snake_case `profiles` row from Postgres into the app's
 *  existing camelCase UserProfile type, so every page component built
 *  against the Firebase version keeps working unchanged. */
function mapProfileRow(row: Record<string, unknown>): UserProfile {
  return {
    uid: row.id as string,
    email: row.email as string,
    role: row.role as UserRole,
    universityId: row.university_id as string,
    fullName: (row.full_name as string) ?? "",
    phone: (row.phone as string) ?? "",
    photoURL: (row.photo_url as string | null) ?? null,
    profileComplete: Boolean(row.profile_complete),
    avgRating: Number(row.avg_rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    responseRate: Number(row.response_rate ?? 0),
    verified: Boolean(row.verified),
    termsAcceptedAt: row.terms_accepted_at ? new Date(row.terms_accepted_at as string).getTime() : 0,
    termsVersion: (row.terms_version as string) ?? "",
    createdAt: row.created_at ? new Date(row.created_at as string).getTime() : Date.now(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [firebaseUser, setFirebaseUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadForUser(user: SupabaseUser | null) {
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setStatus("signed-out");
        return;
      }

      if (user.email === ADMIN_EMAIL) {
        setProfile(null);
        setStatus("admin");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error || !data) {
        setProfile(null);
        setStatus("needs-role");
        return;
      }

      const mapped = mapProfileRow(data);
      setProfile(mapped);
      setStatus(mapped.profileComplete ? "ready" : "needs-profile");
    }

    // Check for an existing session on load...
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadForUser(session?.user ?? null);
    });

    // ...then keep listening for sign-in/sign-out/token-refresh events.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadForUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    // Unlike Firebase's signInWithPopup, Supabase's OAuth flow is a full
    // page redirect away to Google and back — there's no popup mode. The
    // page will navigate away here; onAuthStateChange above picks up the
    // result automatically once it redirects back.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOutUser() {
    await supabase.auth.signOut();
  }

  async function createProfile(role: UserRole, universityId: string): Promise<SignupResult> {
    if (!firebaseUser || !firebaseUser.email) {
      return { ok: false, error: "No signed-in account found. Please sign in again." };
    }

    const meta = firebaseUser.user_metadata ?? {};
    const fullName = (meta.full_name as string) ?? (meta.name as string) ?? "";
    const photoURL = (meta.avatar_url as string) ?? (meta.picture as string) ?? null;

    const { error } = await supabase.from("profiles").insert({
      id: firebaseUser.id,
      email: firebaseUser.email,
      role,
      university_id: universityId,
      full_name: fullName,
      phone: "",
      photo_url: photoURL,
      profile_complete: false,
      terms_accepted_at: new Date().toISOString(),
      terms_version: TERMS_VERSION,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    setProfile({
      uid: firebaseUser.id,
      email: firebaseUser.email,
      role,
      universityId,
      fullName,
      phone: "",
      photoURL,
      profileComplete: false,
      avgRating: 0,
      reviewCount: 0,
      responseRate: 0,
      verified: false,
      termsAcceptedAt: Date.now(),
      termsVersion: TERMS_VERSION,
      createdAt: Date.now(),
    });
    setStatus("needs-profile");
    return { ok: true };
  }

  async function completeProfile(fullName: string, phone: string): Promise<SignupResult> {
    if (!firebaseUser) {
      return { ok: false, error: "No signed-in account found. Please sign in again." };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, profile_complete: true })
      .eq("id", firebaseUser.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    setProfile((prev) => (prev ? { ...prev, fullName, phone, profileComplete: true } : prev));
    setStatus("ready");
    return { ok: true };
  }

  async function setupPassword(password: string): Promise<SignupResult> {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async function resetPassword(email: string): Promise<SignupResult> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) return { ok: false, error: "Could not send reset email. Check the address and try again." };
    return { ok: true };
  }

  async function deleteAccount(): Promise<SignupResult> {
    if (!firebaseUser) {
      return { ok: false, error: "No signed-in account found." };
    }

    try {
      // Deleting the profiles row cascades automatically to every table
      // that references it (listings, marketplace items, favorites,
      // reviews, etc. — see "on delete cascade" in the schema), so unlike
      // the Firebase version this doesn't need a manual multi-collection
      // cleanup pass first.
      //
      // KNOWN LIMITATION: this does not delete the underlying Supabase
      // Auth account (auth.users row) — that requires the admin API with
      // the service-role key, which must never be called from client-side
      // code. The person's login technically still exists after this;
      // signing back in with no profile just routes them through signup
      // again. A full auth-account purge would need a small server-side
      // function (Supabase Edge Function) using the service role key —
      // worth adding later if that distinction matters to you.
      const { error } = await supabase.from("profiles").delete().eq("id", firebaseUser.id);
      if (error) throw error;

      await supabase.auth.signOut();
      return { ok: true };
    } catch (err: unknown) {
      logError(err, `deleteAccount for uid=${firebaseUser.id}`);
      const msg = err instanceof Error ? err.message : "Failed to delete account.";
      return { ok: false, error: msg };
    }
  }

  async function reauthenticate(_password?: string): Promise<SignupResult> {
    // Supabase's architecture doesn't have Firebase's "requires recent
    // login" concept for this operation — deleteAccount() above is a
    // plain RLS-governed table delete, not a privileged auth-API call.
    // This function is kept only so the existing re-auth UI (built for
    // the Firebase version) still compiles; it's never actually invoked
    // since deleteAccount() never sets needsReauth.
    return { ok: true };
  }

  return (
    <AuthContext.Provider
      value={{
        status, firebaseUser, profile,
        signInWithGoogle, signInWithEmail, signOutUser,
        createProfile, completeProfile, setupPassword, resetPassword,
        deleteAccount, reauthenticate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

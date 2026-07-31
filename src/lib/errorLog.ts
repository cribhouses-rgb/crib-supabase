import { supabase } from "../supabaseClient";

/**
 * Logs an error to the error_logs table so it shows up in the Admin
 * Panel instead of only existing in a browser console nobody's looking
 * at. This is the practical stand-in for a service like Sentry until the
 * project is big enough to justify one — same idea (know about failures
 * before a user has to report them), lower setup cost, no external
 * account needed.
 *
 * This function deliberately never throws — a failure while trying to
 * log an error must not itself crash the app or cause a loop.
 */
export async function logError(error: unknown, context: string): Promise<void> {
  try {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack ?? null : null;

    // getSession() reads from local storage rather than making a network
    // call when a session is already cached, so this stays cheap even
    // though it's async (Supabase has no synchronous "currentUser" the
    // way Firebase did).
    const { data: { session } } = await supabase.auth.getSession();

    await supabase.from("error_logs").insert({
      message: message.slice(0, 500),
      stack: stack ? stack.slice(0, 2000) : null,
      context,
      url: window.location.href,
      user_agent: navigator.userAgent,
      user_id: session?.user?.id ?? null,
      user_email: session?.user?.email ?? null,
      resolved: false,
    });
  } catch {
    // Logging failed (e.g. offline). Nothing more we can safely do here —
    // swallow it rather than risk a second-order crash.
  }
}

/**
 * Wires up window-level handlers to catch errors React's own error
 * boundary can't see: things thrown outside of rendering (event handlers,
 * timers, etc.) and unhandled promise rejections. Call this once, early,
 * from main.tsx.
 */
export function installGlobalErrorLogging(): void {
  window.addEventListener("error", (event) => {
    logError(event.error ?? event.message, "window.onerror");
  });

  window.addEventListener("unhandledrejection", (event) => {
    logError(event.reason, "unhandledrejection");
  });
}

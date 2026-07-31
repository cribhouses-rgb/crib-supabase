/**
 * The one account allowed into the admin panel. Gating happens after a
 * real Firebase Authentication sign-in succeeds (email + password verified
 * server-side by Firebase) — this constant only decides which signed-in
 * users see the admin UI, it is not itself a credential check.
 *
 * The account must be created once in the Firebase console:
 * Authentication → Users → Add user → this email + a password.
 * There is no signup flow for it in the app on purpose.
 */
export const ADMIN_EMAIL = "falcontechzw@gmail.com";

/**
 * The one account allowed into the admin panel. Gating happens after a
 * real Supabase Auth sign-in succeeds (email + password verified
 * server-side by Supabase) — this constant only decides which signed-in
 * users see the admin UI, it is not itself a credential check. The real
 * enforcement is the is_admin() function in the RLS policies, which
 * checks this same email against the JWT server-side — so even if
 * someone tampered with this constant in the browser, they still
 * couldn't read another university's data or another user's admin-only
 * rows without actually being signed in as this email.
 *
 * The account must be created once in the Supabase dashboard:
 * Authentication → Users → Add user → this email + a password.
 * There is no signup flow for it in the app on purpose.
 */
export const ADMIN_EMAIL = "falcontechzw@gmail.com";

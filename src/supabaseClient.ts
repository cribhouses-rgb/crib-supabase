import { createClient } from "@supabase/supabase-js";

// Values come from environment variables — see .env.example. The anon
// key is meant to be public-facing (same idea as the Firebase web API
// key was): real access control lives in the RLS policies on each table,
// not in keeping this key secret.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Keeps the session in localStorage and refreshes it automatically —
    // this is the direct equivalent of Firebase's browserLocalPersistence
    // setup, so signed-in users stay signed in across app restarts here
    // exactly like they did before.
    persistSession: true,
    autoRefreshToken: true,
  },
});

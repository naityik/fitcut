import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Vite inlines `VITE_*` at build time, so this is settled when the bundle is built —
 * not when it is served. Adding the keys to a host after a deploy needs a rebuild,
 * not a restart.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Which of the two variables actually reached the build. Presence only — the values are
 * never exposed — so this is safe to render on a deployed page. Without it, a host that
 * builds with one variable set and the other missing is indistinguishable from a host
 * with neither, and both look like "did I forget to redeploy?".
 */
export const supabaseEnvStatus: { name: string; present: boolean }[] = [
  { name: "VITE_SUPABASE_URL", present: Boolean(url) },
  { name: "VITE_SUPABASE_ANON_KEY", present: Boolean(anonKey) },
];

/**
 * Placeholders stand in when the keys are missing, so importing this module never
 * throws. Throwing here would happen during module evaluation — before React renders —
 * which blanks the page and leaves the reason only in the console. `main.tsx` checks
 * `isSupabaseConfigured` and shows the setup screen instead of mounting the app, so
 * nothing ever calls out to these.
 */
export const supabase = createClient<Database>(
  url || "https://unconfigured.supabase.co",
  anonKey || "unconfigured",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

/** Throw on error, return data. Keeps hooks free of repetitive error plumbing. */
export function unwrap<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data;
}

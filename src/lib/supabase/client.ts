import { createBrowserClient } from "@supabase/ssr";

// This client runs in the browser and keeps auth in sync with cookies,
// so that your server (API routes) can see the Supabase session.
export const supabaseBrowserClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
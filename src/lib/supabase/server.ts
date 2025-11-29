import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/validation/env";

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  // Next.js 16: cookies() is now async, so we must await it
  const cookieStore = await cookies();

  return createServerClient(
    serverEnv.SUPABASE_URL,
    serverEnv.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // We'll use set/remove later for auth flows; safe to define now.
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}
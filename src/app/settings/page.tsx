"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabaseBrowserClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileSettingsSection } from "@/components/settings/profile-settings-section";
import { WorkspaceSettingsSection } from "@/components/settings/workspace-settings-section";

type Session =
  | Awaited<
      ReturnType<typeof supabaseBrowserClient.auth.getSession>
    >["data"]["session"]
  | null;

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const { data, error } =
          await supabaseBrowserClient.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
        }

        if (cancelled) return;

        if (!data.session) {
          router.replace("/sign-in");
        } else {
          setSession(data.session);
          setLoading(false);
        }
      } catch (err) {
        console.error("Unexpected session error:", err);
        if (!cancelled) {
          router.replace("/sign-in");
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading || !session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          Loading settings...
        </p>
      </main>
    );
  }

  const userEmail = session.user.email ?? null;

  return (
    <AppShell title="Settings" userEmail={userEmail}>
      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileSettingsSection />
        <WorkspaceSettingsSection />
      </div>
    </AppShell>
  );
}
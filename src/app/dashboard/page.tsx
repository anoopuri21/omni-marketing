"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ContactsSection } from "@/components/marketing/contacts-section";
import { CampaignsSection } from "@/components/marketing/campaigns-section";
import { EmailTestSection } from "@/components/marketing/email-test-section";
import { WhatsAppTestSection } from "@/components/marketing/whatsapp-test-section";

type Session =
  | Awaited<
      ReturnType<typeof supabaseBrowserClient.auth.getSession>
    >["data"]["session"]
  | null;

export default function DashboardPage() {
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

  const handleSignOut = async () => {
    try {
      await supabaseBrowserClient.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      router.replace("/sign-in");
    }
  };

  if (loading || !session) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading dashboard...
        </p>
      </main>
    );
  }

  const userEmail = session.user.email ?? "User";

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold">
            OmniMarketing
          </h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              {userEmail}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8 space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Dashboard
          </h2>
          <p className="text-sm text-muted-foreground">
            This is where we&apos;ll show your campaigns, contacts,
            and analytics.
          </p>
        </div>

        <ContactsSection />
        <CampaignsSection />
        <EmailTestSection />
        <WhatsAppTestSection />
      </section>
    </main>
  );
}
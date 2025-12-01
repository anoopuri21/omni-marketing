"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { supabaseBrowserClient } from "@/lib/supabase/client";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const { data } =
          await supabaseBrowserClient.auth.getSession();

        if (cancelled) return;

        if (data.session) {
          // Already logged in → go to dashboard
          router.replace("/dashboard");
        } else {
          setChecking(false);
        }
      } catch (err) {
        console.error("Error checking session on sign-in:", err);
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          Checking session...
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 p-4">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your campaigns.
          </p>
        </div>

        <SignInForm />

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
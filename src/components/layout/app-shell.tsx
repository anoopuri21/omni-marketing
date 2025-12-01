"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  title: string;
  children: ReactNode;
  userEmail?: string | null;
};

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/contacts", label: "Contacts" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/settings", label: "Settings" },
];

function getInitials(email?: string | null) {
  if (!email) return "U";
  return email.trim().charAt(0).toUpperCase();
}

export function AppShell({ title, children, userEmail }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await supabaseBrowserClient.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      router.replace("/sign-in");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar (dark) */}
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-900/90 px-4 py-6 text-slate-50 md:flex">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-xl font-semibold tracking-tight"
          >
            OmniMarketing
          </Link>
          <p className="mt-1 text-xs text-slate-400">
            Unified email &amp; WhatsApp marketing
          </p>
        </div>

        <nav className="space-y-1 text-sm">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 transition-colors",
                  active
                    ? "bg-slate-800 text-slate-50"
                    : "text-slate-300 hover:bg-slate-800 hover:text-slate-50"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main area (light theme) */}
      <div className="flex flex-1 flex-col bg-background text-foreground">
        {/* Top bar: title + user info */}
        <header className="flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur">
          <div className="space-y-0.5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Dashboard
            </p>
            <h2 className="text-xl font-semibold tracking-tight">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {userEmail && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-medium text-slate-50">
                  {getInitials(userEmail)}
                </div>
                <span className="hidden text-slate-800 sm:inline">
                  {userEmail}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
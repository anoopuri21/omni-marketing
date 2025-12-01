"use client";

import { useEffect, useState } from "react";

type OverviewData = {
  contactCount: number;
  emailCampaignCount: number;
  whatsappCampaignCount: number;
  emailsSentLast7d: number;
  whatsappSentLast7d: number;
};

export function OverviewCards() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/dashboard/overview");
        const json = await res.json();

        if (!res.ok) {
          setError(json.message ?? "Failed to load overview");
          setLoading(false);
          return;
        }

        if (cancelled) return;

        setData(json as OverviewData);
        setLoading(false);
      } catch (err) {
        console.error("Overview load error:", err);
        if (!cancelled) {
          setError("Unexpected error loading overview.");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section>
        <div className="grid gap-4 md:grid-cols-3">
          <SkeletonCard title="Contacts" />
          <SkeletonCard title="Email campaigns" />
          <SkeletonCard title="WhatsApp campaigns" />
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </section>
    );
  }

  const messagesTotal =
    data.emailsSentLast7d + data.whatsappSentLast7d;

  return (
    <section>
      {error && (
        <p className="mb-2 text-sm text-red-600">{error}</p>
      )}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Contacts"
          value={data.contactCount.toString()}
          description="Total contacts in your workspace."
        />
        <StatCard
          title="Email campaigns"
          value={data.emailCampaignCount.toString()}
          description="Campaigns using email channel."
        />
        <StatCard
          title="WhatsApp campaigns"
          value={data.whatsappCampaignCount.toString()}
          description="Campaigns using WhatsApp channel."
        />
        <StatCard
          title="Messages (7 days)"
          value={messagesTotal.toString()}
          description={`${data.emailsSentLast7d} email, ${data.whatsappSentLast7d} WhatsApp.`}
        />
      </div>
    </section>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  description: string;
};

function StatCard({ title, value, description }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="mt-2 text-2xl font-semibold">
        {value}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function SkeletonCard({ title }: { title: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="mt-2 h-6 w-16 animate-pulse rounded bg-muted" />
      <div className="mt-1 h-3 w-32 animate-pulse rounded bg-muted" />
    </div>
  );
}
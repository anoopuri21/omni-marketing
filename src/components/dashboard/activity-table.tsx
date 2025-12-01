"use client";

import { useEffect, useState } from "react";
import type { Campaign } from "@/types/models";
import Link from "next/link";

const STATUS_LABELS: Record<Campaign["status"], string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sent: "Sent",
  cancelled: "Cancelled",
};

export function ActivityTable() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/campaigns");
        const data = await res.json();

        if (!res.ok) {
          setError(data.message ?? "Failed to load campaigns");
          return;
        }

        if (cancelled) return;

        const list = (data.campaigns ?? []) as Campaign[];
        setCampaigns(list.slice(0, 8)); // latest 8
        setLoading(false);
      } catch (err) {
        console.error("Activity load error:", err);
        if (!cancelled) {
          setError("Unexpected error loading campaigns.");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="mb-2 text-sm font-medium text-slate-100">
        Recent campaigns
      </h3>
      {loading && (
        <p className="text-sm text-slate-400">
          Loading campaigns...
        </p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {!loading && !error && campaigns.length === 0 && (
        <p className="text-sm text-slate-400">
          No campaigns yet.
        </p>
      )}
      {!loading && !error && campaigns.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-500 text-xs uppercase tracking-wide text-slate-100">
                <th className="py-2 text-left">Name</th>
                <th className="py-2 text-left">Channel</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-right">Created</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-500/60"
                >
                  <td className="py-2 pr-4">
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="font-medium hover:underline text-slate-100"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-xs uppercase text-slate-300">
                    {c.channel}
                  </td>
                  <td className="py-2 pr-4 text-xs text-slate-300">
                    {STATUS_LABELS[c.status]}
                  </td>
                  <td className="py-2 text-right text-xs text-slate-400">
                    {new Date(
                      c.created_at
                    ).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
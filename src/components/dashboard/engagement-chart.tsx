"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SummaryPoint = {
  date: string;    // YYYY-MM-DD
  label: string;   // Mon, Tue, ...
  emails: number;
  whatsapp: number;
};

export function EngagementChart() {
  const [data, setData] = useState<SummaryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/message-logs/summary");
        const json = await res.json();

        if (!res.ok) {
          setError(json.message ?? "Failed to load chart data");
          setLoading(false);
          return;
        }

        if (cancelled) return;

        const points = (json.perDay as any[]).map((p) => {
          const d = new Date(p.date);
          const label = d.toLocaleDateString(undefined, {
            weekday: "short",
          });
          return {
            date: p.date,
            label,
            emails: p.emails,
            whatsapp: p.whatsapp,
          } as SummaryPoint;
        });

        setData(points);
        setLoading(false);
      } catch (err) {
        console.error("Engagement chart load error:", err);
        if (!cancelled) {
          setError("Unexpected error loading chart.");
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
    <section className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-medium">
        Engagement (last 7 days)
      </h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Emails and WhatsApp messages sent per day.
      </p>

      {loading && (
        <p className="text-sm text-muted-foreground">
          Loading chart...
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient
                  id="colorEmails"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#0ea5e9"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="#0ea5e9"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient
                  id="colorWhatsApp"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#8b5cf6"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="#8b5cf6"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.4)"
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  borderColor: "#1e293b",
                }}
                labelStyle={{ color: "#e5e7eb" }}
              />
              <Area
                type="monotone"
                dataKey="emails"
                stroke="#0ea5e9"
                fill="url(#colorEmails)"
                strokeWidth={2}
                name="Emails"
              />
              <Area
                type="monotone"
                dataKey="whatsapp"
                stroke="#8b5cf6"
                fill="url(#colorWhatsApp)"
                strokeWidth={2}
                name="WhatsApp"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
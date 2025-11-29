"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EmailTestSection() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("Welcome to OmniMarketing");
  const [message, setMessage] = useState(
    "Hi there,\n\nThis is a test email sent from OmniMarketing using Resend."
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Failed to send email");
        return;
      }

      setStatus("Email sent successfully.");
    } catch (err) {
      console.error("Email send error:", err);
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold">
          Send test email
        </h3>
        <p className="text-sm text-muted-foreground">
          Send a simple test email using Resend.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-lg border bg-card p-4"
      >
        <div className="space-y-1">
          <label className="text-sm font-medium">
            To (email)
          </label>
          <Input
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Subject
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Message
          </label>
          <textarea
            className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        {status && (
          <p className="text-sm text-green-600">{status}</p>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send test email"}
        </Button>
      </form>
    </section>
  );
}
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WhatsAppTestSection() {
  console.log("Rendering WhatsAppTestSection"); // DEBUG

  const [to, setTo] = useState("");
  const [message, setMessage] = useState(
    "Hello from OmniMarketing via Twilio WhatsApp sandbox!"
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
      const res = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Failed to send WhatsApp message");
        return;
      }

      setStatus("WhatsApp message sent successfully.");
    } catch (err) {
      console.error("WhatsApp send error:", err);
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold">
          Send WhatsApp test
        </h3>
        <p className="text-sm text-muted-foreground">
          Send a test WhatsApp message using Twilio&apos;s sandbox.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-lg border bg-card p-4"
      >
        <div className="space-y-1">
          <label className="text-sm font-medium">
            To (phone number)
          </label>
          <Input
            type="tel"
            placeholder="+49123456789"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Use the same phone number you joined the Twilio WhatsApp
            sandbox with, in international format (e.g.
            +49..., +91...).
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Message
          </label>
          <textarea
            className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
          {loading ? "Sending..." : "Send WhatsApp test"}
        </Button>
      </form>
    </section>
  );
}
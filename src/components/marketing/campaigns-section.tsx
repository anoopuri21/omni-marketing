"use client";

import { useEffect, useState } from "react";
import type { Campaign } from "@/types/models";
import { CampaignsForm } from "./campaigns-form";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<Campaign["status"], string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sent: "Sent",
  cancelled: "Cancelled",
};

export function CampaignsSection() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const [broadcastStatus, setBroadcastStatus] =
    useState<string | null>(null);
  const [broadcastError, setBroadcastError] =
    useState<string | null>(null);

  const [whatsappBroadcastId, setWhatsAppBroadcastId] =
    useState<string | null>(null);
  const [whatsappStatus, setWhatsAppStatus] =
    useState<string | null>(null);
  const [whatsappError, setWhatsAppError] =
    useState<string | null>(null);


  useEffect(() => {
    let cancelled = false;

    async function loadCampaigns() {
      try {
        const res = await fetch("/api/campaigns");
        const data = await res.json();

        if (!res.ok) {
          setError(data.message ?? "Failed to load campaigns");
          return;
        }

        if (!cancelled) {
          setCampaigns(data.campaigns ?? []);
          setLoading(false);
        }
      } catch (err) {
        console.error("Fetch campaigns error:", err);
        if (!cancelled) {
          setError("Unexpected error. Please try again.");
          setLoading(false);
        }
      }
    }

    loadCampaigns();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreated = (campaign: Campaign) => {
    setCampaigns((prev) => [campaign, ...prev]);
  };

  const handleSendTestEmail = async (campaignId: string) => {
    setSendError(null);
    setSendingId(campaignId);

    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/send-test-email`,
        {
          method: "POST",
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setSendError(data.message ?? "Failed to send test email");
        return;
      }

      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId ? { ...c, status: "sent" } : c
        )
      );
    } catch (err) {
      console.error("Send test email error:", err);
      setSendError("Unexpected error. Please try again.");
    } finally {
      setSendingId(null);
    }
  };

  const handleSendBroadcastEmail = async (campaignId: string) => {
    setBroadcastError(null);
    setBroadcastStatus(null);
    setBroadcastId(campaignId);

    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/send-email-broadcast`,
        {
          method: "POST",
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setBroadcastError(
          data.message ?? "Failed to send broadcast"
        );
        return;
      }

      setBroadcastStatus(
        `Sent ${data.sent} of ${data.total} emails. Failed: ${data.failed}.`
      );

      if (data.sent > 0) {
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === campaignId ? { ...c, status: "sent" } : c
          )
        );
      }
    } catch (err) {
      console.error("Broadcast email error:", err);
      setBroadcastError("Unexpected error. Please try again.");
    } finally {
      setBroadcastId(null);
    }
  };
  const handleSendWhatsAppBroadcast = async (campaignId: string) => {
    setWhatsAppError(null);
    setWhatsAppStatus(null);
    setWhatsAppBroadcastId(campaignId);

    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/send-whatsapp-broadcast`,
        {
          method: "POST",
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setWhatsAppError(
          data.message ?? "Failed to send WhatsApp broadcast"
        );
        return;
      }

      setWhatsAppStatus(
        `Sent ${data.sent} of ${data.total} WhatsApp messages. Failed: ${data.failed}.`
      );
    } catch (err) {
      console.error("WhatsApp broadcast error:", err);
      setWhatsAppError(
        "Unexpected error. Please try again."
      );
    } finally {
      setWhatsAppBroadcastId(null);
    }
  };
  
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">
          Campaigns
        </h3>
        <p className="text-sm text-muted-foreground">
          Define email and WhatsApp campaigns.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h4 className="mb-3 text-sm font-medium">
          Create a campaign
        </h4>
        <CampaignsForm onCreated={handleCreated} />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h4 className="mb-2 text-sm font-medium">
          Your campaigns
        </h4>

                {sendError && (
          <p className="mb-1 text-sm text-red-600">
            {sendError}
          </p>
        )}
        {broadcastStatus && (
          <p className="mb-1 text-sm text-green-600">
            {broadcastStatus}
          </p>
        )}
        {broadcastError && (
          <p className="mb-1 text-sm text-red-600">
            {broadcastError}
          </p>
        )}
        {whatsappStatus && (
          <p className="mb-1 text-sm text-green-600">
            {whatsappStatus}
          </p>
        )}
        {whatsappError && (
          <p className="mb-1 text-sm text-red-600">
            {whatsappError}
          </p>
        )}

        {loading && (
          <p className="text-sm text-muted-foreground">
            Loading campaigns...
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {!loading && !error && campaigns.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No campaigns yet. Create your first campaign above.
          </p>
        )}

        {!loading && !error && campaigns.length > 0 && (
          <div className="space-y-2">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between gap-3 rounded border bg-background px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium">
                    {campaign.name}
                  </div>
                  <div className="text-xs text-muted-foreground space-x-2">
                    <span className="uppercase">
                      {campaign.channel}
                    </span>
                    <span>•</span>
                    <span>
                      {STATUS_LABELS[campaign.status]}
                    </span>
                  </div>
                </div>

                                <div className="flex items-center gap-2">
                  {campaign.channel === "email" && (
                    <div className="flex flex-col items-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          sendingId === campaign.id
                        }
                        onClick={() =>
                          handleSendTestEmail(campaign.id)
                        }
                      >
                        {sendingId === campaign.id
                          ? "Sending test..."
                          : "Send test email"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          broadcastId === campaign.id
                        }
                        onClick={() =>
                          handleSendBroadcastEmail(
                            campaign.id
                          )
                        }
                      >
                        {broadcastId === campaign.id
                          ? "Sending to contacts..."
                          : "Send to contacts"}
                      </Button>
                    </div>
                  )}

                  {campaign.channel === "whatsapp" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        whatsappBroadcastId === campaign.id
                      }
                      onClick={() =>
                        handleSendWhatsAppBroadcast(
                          campaign.id
                        )
                      }
                    >
                      {whatsappBroadcastId === campaign.id
                        ? "Sending WhatsApp..."
                        : "Send WhatsApp to contacts"}
                    </Button>
                  )}

                  <span className="text-xs text-muted-foreground">
                    {new Date(
                      campaign.created_at
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
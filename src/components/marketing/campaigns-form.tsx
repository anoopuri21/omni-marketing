"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  campaignCreateSchema,
  type CampaignCreateInput,
} from "@/lib/validation/campaigns";
import type {
  Campaign,
  CampaignChannel,
} from "@/types/models";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type CampaignsFormProps = {
  onCreated: (campaign: Campaign) => void;
};

export function CampaignsForm({ onCreated }: CampaignsFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiBrief, setAiBrief] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const form = useForm<CampaignCreateInput>({
    resolver: zodResolver(campaignCreateSchema),
    defaultValues: {
      name: "",
      channel: "email",
      subject: "",
      body: "",
    },
  });
  const handleGenerateWithAI = async () => {
    setAiError(null);

    const brief = aiBrief.trim();
    const channel = form.getValues("channel");

    if (!brief) {
      setAiError("Please enter a short description of your offer.");
      return;
    }

    setAiLoading(true);

    try {
      const res = await fetch("/api/ai/generate-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, channel }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiError(data.message ?? "Failed to generate content");
        return;
      }

      form.setValue("subject", data.subject);
      form.setValue("body", data.body);
    } catch (err) {
      console.error("AI generate error:", err);
      setAiError("Unexpected error. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };
  const onSubmit = async (values: CampaignCreateInput) => {
    setServerError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message ?? "Failed to create campaign");
        return;
      }

      onCreated(data.campaign as Campaign);
      form.reset({
        name: "",
        channel: values.channel,
        subject: "",
        body: "",
      });
    } catch (err) {
      console.error("Create campaign error:", err);
      setServerError("Unexpected error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChannelChange = (channel: CampaignChannel) => {
    form.setValue("channel", channel);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3"
      >
        {/* Campaign name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Welcome series"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* AI helper */}
        <div className="space-y-1 rounded-md border bg-muted/40 p-3">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Let AI help
          </label>
          <p className="text-xs text-muted-foreground">
            Describe your product or offer and let AI suggest a
            subject and message.
          </p>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="e.g. 20% off for Black Friday on all e‑commerce plans"
              value={aiBrief}
              onChange={(e) => setAiBrief(e.target.value)}
              className="sm:flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateWithAI}
              disabled={aiLoading}
            >
              {aiLoading ? "Generating..." : "Generate with AI"}
            </Button>
          </div>

          {aiError && (
            <p className="text-xs text-red-600 mt-1">
              {aiError}
            </p>
          )}
        </div>
        {/* Subject */}
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject (email)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Welcome to OmniMarketing"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Body */}
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body (plain text)</FormLabel>
              <FormControl>
                <textarea
                  className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Write your campaign message here..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Channel selector */}
        <FormField
          control={form.control}
          name="channel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channel</FormLabel>
              <FormControl>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleChannelChange("email")}
                    className={`rounded border px-3 py-1 text-sm ${field.value === "email"
                      ? "border-primary bg-primary/10"
                      : "border-input bg-background"
                      }`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleChannelChange("whatsapp")
                    }
                    className={`rounded border px-3 py-1 text-sm ${field.value === "whatsapp"
                      ? "border-primary bg-primary/10"
                      : "border-input bg-background"
                      }`}
                  >
                    WhatsApp
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <p className="text-sm text-red-600">{serverError}</p>
        )}

        <Button
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create campaign"}
        </Button>
      </form>
    </Form>
  );
}
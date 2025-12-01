"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/validation/settings";
import type { Profile } from "@/types/models";

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

export function ProfileSettingsSection() {
  const [initialProfile, setInitialProfile] =
    useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(
    null
  );
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await fetch("/api/settings/profile");
        const data = await res.json();

        if (!res.ok) {
          setServerError(
            data.message ?? "Failed to load profile"
          );
          setLoading(false);
          return;
        }

        if (cancelled) return;

        const profile = data.profile as Profile;
        setInitialProfile(profile);
        form.reset({
          full_name: profile.full_name ?? "",
        });
        setLoading(false);
      } catch (err) {
        console.error("Profile load error:", err);
        if (!cancelled) {
          setServerError(
            "Unexpected error loading profile."
          );
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [form]);

  const onSubmit = async (values: ProfileUpdateInput) => {
    setServerError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(
          data.message ?? "Failed to update profile"
        );
        return;
      }

      const profile = data.profile as Profile;
      setInitialProfile(profile);
      setSuccess("Profile updated.");
    } catch (err) {
      console.error("Profile update error:", err);
      setServerError("Unexpected error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-medium">
          Profile
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Loading profile...
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-medium">
        Profile
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Update your name. Your email comes from authentication.
      </p>

      {serverError && (
        <p className="mb-2 text-sm text-red-600">
          {serverError}
        </p>
      )}
      {success && (
        <p className="mb-2 text-sm text-green-600">
          {success}
        </p>
      )}

      {initialProfile && (
        <div className="mb-4 text-sm">
          <div className="text-xs font-medium text-muted-foreground">
            Email
          </div>
          <div>{initialProfile.email}</div>
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-md space-y-3"
        >
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </Form>
    </section>
  );
}
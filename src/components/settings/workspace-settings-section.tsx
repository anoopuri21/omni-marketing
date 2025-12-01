"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  workspaceUpdateSchema,
  type WorkspaceUpdateInput,
} from "@/lib/validation/settings";
import type { Workspace } from "@/types/models";

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

export function WorkspaceSettingsSection() {
  const [initialWorkspace, setInitialWorkspace] =
    useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(
    null
  );
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<WorkspaceUpdateInput>({
    resolver: zodResolver(workspaceUpdateSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      try {
        const res = await fetch("/api/settings/workspace");
        const data = await res.json();

        if (!res.ok) {
          setServerError(
            data.message ?? "Failed to load workspace"
          );
          setLoading(false);
          return;
        }

        if (cancelled) return;

        const workspace = data.workspace as Workspace;
        setInitialWorkspace(workspace);
        form.reset({ name: workspace.name });
        setLoading(false);
      } catch (err) {
        console.error("Workspace load error:", err);
        if (!cancelled) {
          setServerError(
            "Unexpected error loading workspace."
          );
          setLoading(false);
        }
      }
    }

    loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [form]);

  const onSubmit = async (values: WorkspaceUpdateInput) => {
    setServerError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const res = await fetch("/api/settings/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(
          data.message ?? "Failed to update workspace"
        );
        return;
      }

      const workspace = data.workspace as Workspace;
      setInitialWorkspace(workspace);
      setSuccess("Workspace updated.");
    } catch (err) {
      console.error("Workspace update error:", err);
      setServerError("Unexpected error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-medium">
          Workspace
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Loading workspace...
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-medium">
        Workspace
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        This name is visible in your account and future team
        features.
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

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-md space-y-3"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workspace name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="My brand workspace"
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
            {saving ? "Saving..." : "Save workspace"}
          </Button>
        </form>
      </Form>
    </section>
  );
}
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  contactCreateSchema,
  type ContactCreateInput,
} from "@/lib/validation/contacts";
import type { Contact } from "@/types/models";

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

type ContactsFormProps = {
  onCreated: (contact: Contact) => void;
};

export function ContactsForm({ onCreated }: ContactsFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ContactCreateInput>({
    resolver: zodResolver(contactCreateSchema),
    defaultValues: {
      email: "",
      phone: "",
      first_name: "",
      last_name: "",
    },
  });

  const onSubmit = async (values: ContactCreateInput) => {
    setServerError(null);
    setSubmitting(true);

    // Convert empty strings to undefined so zod's optional + refine work as intended
    const payload: ContactCreateInput = {
      email: values.email || undefined,
      phone: values.phone || undefined,
      first_name: values.first_name || undefined,
      last_name: values.last_name || undefined,
    };

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message ?? "Failed to create contact");
        return;
      }

      onCreated(data.contact);
      form.reset();
    } catch (err) {
      console.error("Create contact error:", err);
      setServerError("Unexpected error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Jane"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Doe"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="contact@example.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+1 555 123 4567"
                    autoComplete="tel"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {serverError && (
          <p className="text-sm text-red-600">{serverError}</p>
        )}

        <p className="text-xs text-muted-foreground">
          Provide at least an email or a phone number.
        </p>

        <Button
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Adding..." : "Add contact"}
        </Button>
      </form>
    </Form>
  );
}
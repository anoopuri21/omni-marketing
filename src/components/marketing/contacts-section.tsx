"use client";

import { useEffect, useState } from "react";
import type { Contact } from "@/types/models";
import { ContactsForm } from "./contacts-form";

export function ContactsSection() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadContacts() {
      try {
        const res = await fetch("/api/contacts");
        const data = await res.json();

        if (!res.ok) {
          setError(data.message ?? "Failed to load contacts");
          return;
        }

        if (!cancelled) {
          setContacts(data.contacts ?? []);
          setLoading(false);
        }
      } catch (err) {
        console.error("Fetch contacts error:", err);
        if (!cancelled) {
          setError("Unexpected error. Please try again.");
          setLoading(false);
        }
      }
    }

    loadContacts();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleContactCreated = (contact: Contact) => {
    setContacts((prev) => [contact, ...prev]);
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">
          Contacts
        </h3>
        <p className="text-sm text-muted-foreground">
          Manage the people you send campaigns to.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h4 className="mb-3 text-sm font-medium">
          Add a contact
        </h4>
        <ContactsForm onCreated={handleContactCreated} />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h4 className="mb-3 text-sm font-medium">
          Your contacts
        </h4>

        {loading && (
          <p className="text-sm text-muted-foreground">
            Loading contacts...
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {!loading && !error && contacts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No contacts yet. Add your first contact above.
          </p>
        )}

        {!loading && !error && contacts.length > 0 && (
          <div className="space-y-2">
            {contacts.map((contact) => {
              const name =
                [contact.first_name, contact.last_name]
                  .filter(Boolean)
                  .join(" ") || "Unnamed contact";

              return (
                <div
                  key={contact.id}
                  className="flex items-center justify-between rounded border bg-background px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium">
                      {name}
                    </div>
                    <div className="text-xs text-muted-foreground space-x-3">
                      {contact.email && (
                        <span>{contact.email}</span>
                      )}
                      {contact.phone && (
                        <span>{contact.phone}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
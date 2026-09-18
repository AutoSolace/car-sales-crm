"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LEAD_SOURCE_LABELS } from "@/lib/types";
import ContactList, { type ContactRow } from "./ContactList";

type SortKey = "name" | "lastContactDate" | "leadSource";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Name (A–Z)" },
  { value: "lastContactDate", label: "Last contact date (newest first)" },
  { value: "leadSource", label: "Lead source (A–Z)" },
];

function sortContacts(contacts: ContactRow[], sortKey: SortKey): ContactRow[] {
  const sorted = [...contacts];
  switch (sortKey) {
    case "lastContactDate":
      return sorted.sort((a, b) => {
        if (!a.lastContactDate && !b.lastContactDate) return 0;
        if (!a.lastContactDate) return 1;
        if (!b.lastContactDate) return -1;
        return b.lastContactDate.getTime() - a.lastContactDate.getTime();
      });
    case "leadSource":
      return sorted.sort((a, b) => {
        const labelA = a.leadSource ? LEAD_SOURCE_LABELS[a.leadSource] : "";
        const labelB = b.leadSource ? LEAD_SOURCE_LABELS[b.leadSource] : "";
        if (!labelA && !labelB) return 0;
        if (!labelA) return 1;
        if (!labelB) return -1;
        return labelA.localeCompare(labelB);
      });
    case "name":
    default:
      return sorted.sort((a, b) => {
        const lastCompare = (a.lastName ?? "").localeCompare(b.lastName ?? "");
        if (lastCompare !== 0) return lastCompare;
        return a.firstName.localeCompare(b.firstName);
      });
  }
}

export default function ContactsFilter({
  contacts,
}: {
  contacts: ContactRow[];
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matching = q
      ? contacts.filter((contact) =>
          `${contact.firstName} ${contact.lastName ?? ""}`
            .toLowerCase()
            .includes(q)
        )
      : contacts;
    return sortContacts(matching, sortKey);
  }, [contacts, query, sortKey]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="max-w-sm flex-1">
          <label htmlFor="contact-search">Search</label>
          <Input
            id="contact-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
          />
        </div>
        <div className="max-w-xs">
          <label htmlFor="contact-sort">Sort by</label>
          <Select
            id="contact-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <ContactList contacts={filtered} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Combobox } from "@/components/ui/combobox";

type ContactOption = {
  id: string;
  firstName: string;
  lastName: string | null;
};

export function NavSearch({
  contacts,
  onNavigate,
}: {
  contacts: ContactOption[];
  onNavigate?: () => void;
}) {
  const [query, setQuery] = useState("");

  const options = contacts.map((c) => ({
    id: c.id,
    label: `${c.firstName} ${c.lastName ?? ""}`.trim(),
    href: `/contacts/${c.id}`,
  }));

  return (
    <div className="px-2 py-2">
      <Combobox
        options={options}
        value={query}
        onValueChange={setQuery}
        onSelect={() => {
          setQuery("");
          onNavigate?.();
        }}
        placeholder="Search contacts..."
        aria-label="Search contacts"
        emptyMessage="No contacts found"
      />
    </div>
  );
}

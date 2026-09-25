"use client";

import { useState } from "react";
import { SectionShell } from "@/components/design-system/SectionShell";
import { Combobox } from "@/components/ui/combobox";

const DEMO_OPTIONS = [
  { id: "1", label: "Ada Lovelace", href: "#" },
  { id: "2", label: "Alan Turing", href: "#" },
  { id: "3", label: "Grace Hopper", href: "#" },
  { id: "4", label: "Katherine Johnson", href: "#" },
];

const code = `import { Combobox } from "@/components/ui/combobox";

const [query, setQuery] = useState("");

<Combobox
  options={contacts.map((c) => ({
    id: c.id,
    label: \`\${c.firstName} \${c.lastName ?? ""}\`.trim(),
    href: \`/contacts/\${c.id}\`,
  }))}
  value={query}
  onValueChange={setQuery}
  onSelect={() => setQuery("")}
  placeholder="Search contacts..."
  emptyMessage="No contacts found"
/>`;

export function ComboboxSection() {
  const [query, setQuery] = useState("");

  return (
    <SectionShell
      id="combobox"
      title="Combobox"
      description={
        <>
          A controlled text input paired with a live-filtered,
          click-to-navigate results list. Each result renders as a real
          link — this is built for &quot;search, then go to that
          thing&apos;s page,&quot; not for choosing a value within a form.
        </>
      }
      whenToUse={
        <ul>
          <li>Global, always-visible search (e.g. the main nav&apos;s contact search).</li>
          <li>Any &quot;type to filter a list of links&quot; picker.</li>
        </ul>
      }
      whenNotToUse={
        <ul>
          <li>For choosing a value inside a form — use <code>Select</code>.</li>
          <li>For a fixed, closed set of action commands — use <code>DropdownMenu</code>.</li>
        </ul>
      }
      preview={
        <div className="max-w-xs">
          <Combobox
            options={DEMO_OPTIONS}
            value={query}
            onValueChange={setQuery}
            onSelect={() => setQuery("")}
            placeholder="Search names..."
            emptyMessage="No results found"
          />
        </div>
      }
      code={code}
      options={
        <ul className="list-disc pl-5">
          <li>
            <strong>Controlled</strong>: <code>value</code>/
            <code>onValueChange</code>, same shape as every other form
            primitive here.
          </li>
          <li>
            <strong>Options</strong>: <code>{"{ id, label, href }"}[]</code> —
            filtered case-insensitively against <code>label</code>, capped at{" "}
            <code>maxResults</code> (default 8).
          </li>
          <li>
            <strong>Selecting a result</strong> navigates via its{" "}
            <code>href</code> (a real <code>Link</code>); <code>onSelect</code>{" "}
            fires alongside for cleanup (e.g. clearing the query, closing a
            mobile drawer).
          </li>
          <li>
            Dismisses on outside click and <kbd>Esc</kbd>; <kbd>Enter</kbd>{" "}
            navigates to the top result. No arrow-key result navigation.
          </li>
        </ul>
      }
    />
  );
}

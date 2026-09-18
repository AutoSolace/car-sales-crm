import Link from "next/link";
import type { Contact, Outcome } from "@prisma/client";
import { LEAD_SOURCE_LABELS } from "@/lib/types";
import { contactNeedsRecontact } from "@/lib/automation";
import { Badge } from "@/components/ui/badge";

export type ContactRow = Contact & {
  deals: { completedLostOutcome: Outcome }[];
};

export default function ContactList({ contacts }: { contacts: ContactRow[] }) {
  if (contacts.length === 0) {
    return <p className="text-ink-muted">No contacts yet.</p>;
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="text-left border-b border-hairline">
          <th className="py-2 pr-4">Name</th>
          <th className="py-2 pr-4">Phone</th>
          <th className="py-2 pr-4">Email</th>
          <th className="py-2 pr-4">Lead source</th>
          <th className="py-2 pr-4">Last contact date</th>
          <th className="py-2 pr-4"></th>
        </tr>
      </thead>
      <tbody>
        {contacts.map((contact) => (
          <tr key={contact.id} className="border-b border-hairline hover:bg-surface">
            <td className="py-2 pr-4">
              <Link href={`/contacts/${contact.id}`} className="hover:underline">
                {contact.firstName} {contact.lastName ?? ""}
              </Link>
            </td>
            <td className="py-2 pr-4">{contact.phone ?? "—"}</td>
            <td className="py-2 pr-4">{contact.email ?? "—"}</td>
            <td className="py-2 pr-4">
              {contact.leadSource ? LEAD_SOURCE_LABELS[contact.leadSource] : "—"}
            </td>
            <td className="py-2 pr-4">
              {contact.lastContactDate
                ? contact.lastContactDate.toLocaleDateString()
                : "—"}
            </td>
            <td className="py-2 pr-4">
              {contactNeedsRecontact(contact) && (
                <Badge tone="signal">Needs recontact</Badge>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

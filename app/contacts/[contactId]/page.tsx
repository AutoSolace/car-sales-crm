import Link from "next/link";
import { notFound } from "next/navigation";
import { getContactWithDeals } from "@/lib/contacts/service";
import { deleteContactAction } from "@/lib/contacts/actions";
import {
  DEAL_STAGE_LABELS,
  LEAD_SOURCE_LABELS,
  PREFERRED_CONTACT_METHOD_LABELS,
} from "@/lib/types";
import { isOverdue } from "@/lib/automation";
import { Button } from "@/components/ui/button";
import { DataTable, DataRow } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ contactId: string }>;
}) {
  const { contactId } = await params;
  const contact = await getContactWithDeals(contactId);
  if (!contact) notFound();

  const deleteAction = deleteContactAction.bind(null, contact.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-hairline pb-6">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3">
          <Link href="/contacts">&larr; Back</Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1>
            {contact.firstName} {contact.lastName ?? ""}
          </h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
              <Link href={`/contacts/${contact.id}/edit`}>Edit</Link>
            </Button>
            <form action={deleteAction}>
              <Button type="submit" variant="danger">
                Delete
              </Button>
            </form>
          </div>
        </div>
      </div>

      <DataTable>
        <DataRow title="Phone">{contact.phone ?? "—"}</DataRow>
        <DataRow title="Email">{contact.email ?? "—"}</DataRow>
        <DataRow title="Address">{contact.address ?? "—"}</DataRow>
        <DataRow title="Lead source">
          {contact.leadSource ? LEAD_SOURCE_LABELS[contact.leadSource] : "—"}
        </DataRow>
        <DataRow title="Preferred contact">
          {contact.preferredContactMethod
            ? PREFERRED_CONTACT_METHOD_LABELS[contact.preferredContactMethod]
            : "—"}
        </DataRow>
        <DataRow title="Notes">{contact.notes ?? "—"}</DataRow>
        <DataRow title="Created date">
          {contact.createdAt.toLocaleDateString()}
        </DataRow>
        <DataRow title="Last contact date">
          {contact.lastContactDate
            ? contact.lastContactDate.toLocaleDateString()
            : "—"}
        </DataRow>
      </DataTable>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2>Deals</h2>
          <Button asChild size="sm">
            <Link href={`/deals/new?contactId=${contact.id}`}>New deal</Link>
          </Button>
        </div>

        {contact.deals.length === 0 ? (
          <p className="text-ink-muted">No deals yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {contact.deals.map((deal) => (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="border border-hairline rounded-md px-4 py-3 hover:bg-surface flex items-center justify-between no-underline"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone="accent">{DEAL_STAGE_LABELS[deal.stage]}</Badge>
                    {isOverdue(deal.createdAt, 24) && (
                      <Badge tone="signal">2+ years old</Badge>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-ink-muted">
                    {deal.finalMake
                      ? `${deal.finalMake} ${deal.finalModel ?? ""}`
                      : deal.carsInterested || "No vehicle set yet"}
                  </div>
                </div>
                <div className="text-sm text-ink-muted">
                  {deal.commissionReceived
                    ? `£${deal.commissionReceived}`
                    : "—"}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

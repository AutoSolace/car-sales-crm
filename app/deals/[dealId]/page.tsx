import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deals/service";
import { deleteDealAction } from "@/lib/deals/actions";
import {
  DEAL_STAGE_LABELS,
  OUTCOME_LABELS,
  ADDITIONAL_PRODUCT_TYPE_LABELS,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DataTable, DataRow } from "@/components/ui/data-table";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { Outcome } from "@prisma/client";
import ActivityLog from "@/components/deals/ActivityLog";

const OUTCOME_TONE: Record<Outcome, BadgeProps["tone"]> = {
  PENDING: "muted",
  YES: "success",
  NO: "danger",
};

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  const deal = await getDeal(dealId);
  if (!deal) notFound();

  const deleteAction = deleteDealAction.bind(null, deal.id, deal.contactId);

  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-hairline pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href={`/contacts/${deal.contactId}`} className="text-sm">
              &larr; {deal.contact.firstName} {deal.contact.lastName ?? ""}
            </Link>
            <h1 className="mt-1">{DEAL_STAGE_LABELS[deal.stage]}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
              <Link href={`/deals/${deal.id}/edit`}>Edit</Link>
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
        <DataRow title="Find Car outcome">
          <Badge tone={OUTCOME_TONE[deal.findCarOutcome]}>
            {OUTCOME_LABELS[deal.findCarOutcome]}
          </Badge>
        </DataRow>
        <DataRow title="Proposal Accepted outcome">
          <Badge tone={OUTCOME_TONE[deal.proposalAcceptedOutcome]}>
            {OUTCOME_LABELS[deal.proposalAcceptedOutcome]}
          </Badge>
        </DataRow>
        <DataRow title="Completed/Lost outcome">
          <Badge tone={OUTCOME_TONE[deal.completedLostOutcome]}>
            {OUTCOME_LABELS[deal.completedLostOutcome]}
          </Badge>
        </DataRow>
        <DataRow title="Commission received">
          {deal.commissionReceived ? `£${deal.commissionReceived}` : "—"}
        </DataRow>
        <DataRow title="Comm %">
          {deal.commissionPercent ? `${deal.commissionPercent}%` : "—"}
        </DataRow>
        <DataRow title="Lender">{deal.lender || "—"}</DataRow>
        <DataRow title="Completed date">
          {deal.completedAt ? deal.completedAt.toLocaleString() : "—"}
        </DataRow>
        <DataRow title="Lost date">
          {deal.lostAt ? deal.lostAt.toLocaleString() : "—"}
        </DataRow>
        <DataRow title="Car(s) interested">
          {deal.carsInterested || "—"}
        </DataRow>
        <DataRow title="Final car">
          {deal.finalMake
            ? `${deal.finalIsNew ? "New" : "Used"} ${deal.finalYear ?? ""} ${
                deal.finalMake
              } ${deal.finalModel ?? ""} — ${deal.finalRegistration ?? "no reg"}, ${
                deal.finalMileage ?? "?"
              } mi, £${deal.finalPrice ?? "?"}`
            : "—"}
        </DataRow>
        <DataRow title="Deposit">
          {deal.deposit ? `£${deal.deposit}` : "—"}
        </DataRow>
      </DataTable>

      <div>
        <h2 className="mb-2">Additional products</h2>
        {deal.additionalProducts.length === 0 ? (
          <p className="text-ink-muted text-sm">None</p>
        ) : (
          <ul className="text-sm flex flex-col gap-1">
            {deal.additionalProducts.map((p) => (
              <li key={p.id}>
                {ADDITIONAL_PRODUCT_TYPE_LABELS[p.type]} — £{p.value.toString()}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ActivityLog dealId={deal.id} />
    </div>
  );
}

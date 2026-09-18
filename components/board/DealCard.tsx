"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DealStage, Outcome } from "@prisma/client";

export type BoardDeal = {
  id: string;
  stage: DealStage;
  findCarOutcome: Outcome;
  proposalAcceptedOutcome: Outcome;
  completedLostOutcome: Outcome;
  createdAt: Date;
  completedAt: Date | null;
  lostAt: Date | null;
  commissionReceived: number | null;
  contact: { firstName: string; lastName: string | null };
};

function outcomeForStage(deal: BoardDeal): Outcome | null {
  switch (deal.stage) {
    case "FIND_CAR":
      return deal.findCarOutcome;
    case "PROPOSAL_ACCEPTED":
      return deal.proposalAcceptedOutcome;
    case "COMPLETED_LOST":
      return deal.completedLostOutcome;
    default:
      return null;
  }
}

const TINT_CLASSES: Record<Outcome, string> = {
  PENDING: "card-tint-pending",
  YES: "card-tint-won",
  NO: "card-tint-lost",
};

/** Pure rendering — shared between the real draggable card and the
 * DragOverlay's presentation-only copy (which must NOT call useDraggable
 * again for the same id). */
function DealCardBody({
  deal,
  dragHandleProps,
  faded,
}: {
  deal: BoardDeal;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement> &
    Record<string, unknown>;
  faded?: boolean;
}) {
  // Stages with no relevant outcome field (Lead/Contacted/Proposal
  // Submitted) fall back to the same tint as an explicit PENDING outcome,
  // so "grey" reads consistently across the whole board.
  const outcome = outcomeForStage(deal);
  const tint = TINT_CLASSES[outcome ?? "PENDING"];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2.5 shadow-sm",
        tint,
        faded && "opacity-40"
      )}
    >
      <button
        type="button"
        aria-label="Drag to move"
        className="cursor-grab touch-none text-ink-muted hover:text-ink-body active:cursor-grabbing"
        {...dragHandleProps}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {/* Deliberately plain-text styling (not the default accent link
          color) — a card title shouldn't read as a hyperlink. */}
      <Link
        href={`/deals/${deal.id}`}
        className="min-w-0 flex-1 truncate text-sm font-medium text-ink-display no-underline"
      >
        {deal.contact.firstName} {deal.contact.lastName ?? ""}
      </Link>
      <Link
        href={`/deals/${deal.id}/edit`}
        aria-label="Edit deal"
        className="text-ink-muted hover:text-ink-body"
      >
        <Pencil className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function DealCard({ deal }: { deal: BoardDeal }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
  });

  return (
    <div ref={setNodeRef}>
      <DealCardBody
        deal={deal}
        dragHandleProps={{ ...listeners, ...attributes }}
        faded={isDragging}
      />
    </div>
  );
}

/** Presentation-only copy for DragOverlay — no useDraggable, so it doesn't
 * register a second draggable for the same id. */
export function DealCardOverlay({ deal }: { deal: BoardDeal }) {
  return <DealCardBody deal={deal} />;
}

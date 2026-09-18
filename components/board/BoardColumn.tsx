"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { DEAL_STAGE_LABELS } from "@/lib/types";
import type { DealStage } from "@prisma/client";
import DealCard, { type BoardDeal } from "./DealCard";

export default function BoardColumn({
  stage,
  deals,
}: {
  stage: DealStage;
  deals: BoardDeal[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex w-72 shrink-0 flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h3>{DEAL_STAGE_LABELS[stage]}</h3>
        <span className="text-xs text-ink-muted">{deals.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 rounded-md border border-dashed p-2 transition-colors",
          isOver ? "border-accent bg-accent-faded/40" : "border-hairline"
        )}
      >
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
        {deals.length === 0 && (
          <p className="px-1 py-2 text-xs text-ink-muted">No deals</p>
        )}
      </div>
    </div>
  );
}

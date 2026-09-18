"use client";

import { DEAL_STAGE_LABELS, DEAL_STAGE_ORDER, OUTCOME_LABELS } from "@/lib/types";
import type { DealStage, Outcome } from "@prisma/client";
import { cn } from "@/lib/utils";

const OUTCOME_ORDER: Outcome[] = ["PENDING", "YES", "NO"];

export default function BoardFilters({
  visibleStages,
  onToggleStage,
  visibleOutcomes,
  onToggleOutcome,
}: {
  visibleStages: Set<DealStage>;
  onToggleStage: (stage: DealStage) => void;
  visibleOutcomes: Set<Outcome>;
  onToggleOutcome: (outcome: Outcome) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-ink-muted">
          Stages
        </span>
        {DEAL_STAGE_ORDER.map((stage) => (
          <button
            key={stage}
            type="button"
            className="toggle-button"
            aria-pressed={visibleStages.has(stage)}
            onClick={() => onToggleStage(stage)}
          >
            {DEAL_STAGE_LABELS[stage]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-ink-muted">
          Outcome
        </span>
        {OUTCOME_ORDER.map((outcome) => (
          <button
            key={outcome}
            type="button"
            className={cn("toggle-button")}
            aria-pressed={visibleOutcomes.has(outcome)}
            onClick={() => onToggleOutcome(outcome)}
          >
            {OUTCOME_LABELS[outcome]}
          </button>
        ))}
      </div>
    </div>
  );
}

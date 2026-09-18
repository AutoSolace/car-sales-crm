"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { DealStage, Outcome } from "@prisma/client";
import { DEAL_STAGE_ORDER } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { moveDealStageAction, setBoardOutcomeAction } from "@/lib/deals/actions";
import BoardColumn from "./BoardColumn";
import BoardFilters from "./BoardFilters";
import OutcomeDialog from "./OutcomeDialog";
import { type BoardDeal, DealCardOverlay } from "./DealCard";

type OutcomeStage = "PROPOSAL_ACCEPTED" | "COMPLETED_LOST";
const OUTCOME_PROMPT_STAGES: DealStage[] = ["PROPOSAL_ACCEPTED", "COMPLETED_LOST"];

type SortOrder = "newest" | "oldest";
type StatusFilter = "all" | "active" | "proposalPending" | "won" | "lost";

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

function matchesStatus(deal: BoardDeal, status: StatusFilter): boolean {
  switch (status) {
    case "active":
      return deal.stage !== "COMPLETED_LOST";
    case "proposalPending":
      return (
        deal.stage === "PROPOSAL_ACCEPTED" &&
        deal.proposalAcceptedOutcome === "PENDING"
      );
    case "won":
      return (
        deal.stage === "COMPLETED_LOST" && deal.completedLostOutcome === "YES"
      );
    case "lost":
      return (
        deal.stage === "COMPLETED_LOST" && deal.completedLostOutcome === "NO"
      );
    case "all":
    default:
      return true;
  }
}

function withinRange(date: Date | null, from: string, to: string): boolean {
  if (!date) return false;
  if (from && date < new Date(from)) return false;
  if (to && date > new Date(`${to}T23:59:59`)) return false;
  return true;
}

export default function Board({
  initialDeals,
}: {
  initialDeals: BoardDeal[];
}) {
  const [deals, setDeals] = useState(initialDeals);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [visibleStages, setVisibleStages] = useState<Set<DealStage>>(
    () => new Set(DEAL_STAGE_ORDER)
  );
  const [visibleOutcomes, setVisibleOutcomes] = useState<Set<Outcome>>(
    () => new Set<Outcome>(["PENDING", "YES", "NO"])
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pendingOutcome, setPendingOutcome] = useState<{
    dealId: string;
    stage: OutcomeStage;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function toggleStage(stage: DealStage) {
    setVisibleStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  }

  function toggleOutcome(outcome: Outcome) {
    setVisibleOutcomes((prev) => {
      const next = new Set(prev);
      if (next.has(outcome)) next.delete(outcome);
      else next.add(outcome);
      return next;
    });
  }

  const statusFiltered = useMemo(() => {
    let result = deals.filter((deal) => matchesStatus(deal, statusFilter));
    if (statusFilter === "won" && (dateFrom || dateTo)) {
      result = result.filter((deal) => withinRange(deal.completedAt, dateFrom, dateTo));
    }
    if (statusFilter === "lost" && (dateFrom || dateTo)) {
      result = result.filter((deal) => withinRange(deal.lostAt, dateFrom, dateTo));
    }
    return result;
  }, [deals, statusFilter, dateFrom, dateTo]);

  const summary = useMemo(() => {
    if (statusFilter === "won") {
      const total = statusFiltered.reduce(
        (sum, d) => sum + (d.commissionReceived ?? 0),
        0
      );
      return `${statusFiltered.length} won deal${statusFiltered.length === 1 ? "" : "s"}, total commission £${total.toFixed(2)}`;
    }
    if (statusFilter === "lost") {
      return `${statusFiltered.length} lost deal${statusFiltered.length === 1 ? "" : "s"}`;
    }
    return null;
  }, [statusFilter, statusFiltered]);

  const sorted = useMemo(() => {
    const copy = [...statusFiltered];
    copy.sort((a, b) =>
      sortOrder === "newest"
        ? b.createdAt.getTime() - a.createdAt.getTime()
        : a.createdAt.getTime() - b.createdAt.getTime()
    );
    return copy;
  }, [statusFiltered, sortOrder]);

  const dealsByStage = useMemo(() => {
    const map = new Map<DealStage, BoardDeal[]>();
    for (const stage of DEAL_STAGE_ORDER) map.set(stage, []);
    for (const deal of sorted) {
      const outcome = outcomeForStage(deal);
      // Outcome filter only affects cards that actually have an outcome for
      // their current stage — cards without one (Lead/Contacted/Proposal
      // Submitted) are unaffected by the colour filter.
      if (outcome && !visibleOutcomes.has(outcome)) continue;
      map.get(deal.stage)?.push(deal);
    }
    return map;
  }, [sorted, visibleOutcomes]);

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    if (!DEAL_STAGE_ORDER.includes(over.id as DealStage)) return;

    const dealId = String(active.id);
    const targetStage = over.id as DealStage;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === targetStage) return;

    setBlockedMessage(null);

    // Dragging into Proposal Accepted or Completed/Lost asks for the
    // outcome (+ commission, for a won Completed/Lost) via a pop-up first,
    // instead of moving immediately — see OutcomeDialog / handleOutcomeConfirm
    // below. The card stays put until that's confirmed or cancelled. Find
    // Car deliberately does NOT get this treatment — dragging in leaves its
    // outcome Pending until set manually on the deal form.
    if (OUTCOME_PROMPT_STAGES.includes(targetStage)) {
      setPendingOutcome({ dealId, stage: targetStage as OutcomeStage });
      return;
    }

    const previousStage = deal.stage;

    // Optimistic move — reverted below if the server rejects it.
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: targetStage } : d))
    );

    const result = await moveDealStageAction(dealId, targetStage);
    if (!result.ok) {
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stage: previousStage } : d))
      );
      setBlockedMessage(result.reason);
    }
  }

  function handleOutcomeCancel() {
    // Nothing was moved yet, so there's nothing to revert.
    setPendingOutcome(null);
  }

  async function handleOutcomeConfirm(
    outcome: "YES" | "NO",
    commissionReceived: string
  ) {
    const target = pendingOutcome;
    setPendingOutcome(null);
    if (!target) return;
    const { dealId, stage: targetStage } = target;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;
    const previousStage = deal.stage;
    const previousProposalAcceptedOutcome = deal.proposalAcceptedOutcome;
    const previousCompletedLostOutcome = deal.completedLostOutcome;

    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              stage: targetStage,
              proposalAcceptedOutcome:
                targetStage === "PROPOSAL_ACCEPTED" ? outcome : d.proposalAcceptedOutcome,
              completedLostOutcome:
                targetStage === "COMPLETED_LOST" ? outcome : d.completedLostOutcome,
              commissionReceived:
                targetStage === "COMPLETED_LOST" && outcome === "YES" && commissionReceived
                  ? Number(commissionReceived)
                  : d.commissionReceived,
            }
          : d
      )
    );

    const result = await setBoardOutcomeAction(
      dealId,
      targetStage,
      outcome,
      commissionReceived
    );
    if (!result.ok) {
      setDeals((prev) =>
        prev.map((d) =>
          d.id === dealId
            ? {
                ...d,
                stage: previousStage,
                proposalAcceptedOutcome: previousProposalAcceptedOutcome,
                completedLostOutcome: previousCompletedLostOutcome,
              }
            : d
        )
      );
      setBlockedMessage(result.reason);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <BoardFilters
        visibleStages={visibleStages}
        onToggleStage={toggleStage}
        visibleOutcomes={visibleOutcomes}
        onToggleOutcome={toggleOutcome}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-ink-muted">
            Status
          </span>
          {(
            [
              ["all", "All"],
              ["active", "Active"],
              ["proposalPending", "Proposal pending"],
              ["won", "Won"],
              ["lost", "Lost"],
            ] as [StatusFilter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="toggle-button"
              aria-pressed={statusFilter === value}
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-ink-muted">
            Sort
          </span>
          <button
            type="button"
            className="toggle-button"
            aria-pressed={sortOrder === "newest"}
            onClick={() => setSortOrder("newest")}
          >
            Newest first
          </button>
          <button
            type="button"
            className="toggle-button"
            aria-pressed={sortOrder === "oldest"}
            onClick={() => setSortOrder("oldest")}
          >
            Oldest first
          </button>
        </div>
      </div>

      {(statusFilter === "won" || statusFilter === "lost") && (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="board-date-from">From</label>
            <Input
              id="board-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="board-date-to">To</label>
            <Input
              id="board-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          {summary && (
            <p className="pb-2 text-sm text-ink-body">{summary}</p>
          )}
        </div>
      )}

      {blockedMessage && (
        <div className="callout callout-danger">
          <p className="text-danger-display">{blockedMessage}</p>
        </div>
      )}

      <DndContext
        id="deal-board"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {DEAL_STAGE_ORDER.filter((stage) => visibleStages.has(stage)).map(
            (stage) => (
              <BoardColumn
                key={stage}
                stage={stage}
                deals={dealsByStage.get(stage) ?? []}
              />
            )
          )}
        </div>
        <DragOverlay>
          {activeDeal ? <DealCardOverlay deal={activeDeal} /> : null}
        </DragOverlay>
      </DndContext>

      <OutcomeDialog
        open={pendingOutcome !== null}
        stage={pendingOutcome?.stage ?? "COMPLETED_LOST"}
        onCancel={handleOutcomeCancel}
        onConfirm={handleOutcomeConfirm}
      />
    </div>
  );
}

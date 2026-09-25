import { prisma } from "@/lib/db/client";
import type { DealStage } from "@prisma/client";
import { DEAL_STAGE_ORDER, DEAL_STAGE_LABELS } from "@/lib/types";
import { dealInputSchema, type DealInput } from "./validation";
import { logStageChange } from "@/lib/activity-log/service";

/**
 * Setting an outcome (Yes/No) on the deal form moves the deal to that
 * outcome's stage automatically — e.g. setting Completed/Lost outcome to
 * Yes moves the deal to the Completed/Lost column, tinted green, without
 * also having to change the Stage dropdown by hand. Checked in
 * furthest-along-first order, so if more than one outcome is non-Pending
 * (e.g. historical data), the most advanced one wins.
 *
 * This only applies to the create/update form path. Dragging a card on the
 * board (moveDealStage) intentionally does NOT set an outcome — the stage
 * moves, the outcome stays whatever it was (Pending/grey by default) until
 * the user explicitly sets it, so nothing is ever guessed.
 */
function deriveStageFromOutcomes(data: DealInput): DealStage {
  if (data.completedLostOutcome !== "PENDING") return "COMPLETED_LOST";
  if (data.proposalAcceptedOutcome !== "PENDING") return "PROPOSAL_ACCEPTED";
  if (data.findCarOutcome !== "PENDING") return "FIND_CAR";
  return data.stage;
}

export async function listBoardDeals() {
  // Selected explicitly (not a bare `include`) — this return value is
  // passed straight into a Client Component. `commissionReceived` is a
  // Prisma Decimal (a class instance), which can't cross the server→client
  // boundary un-serialized, so it's converted to a plain number below.
  const deals = await prisma.deal.findMany({
    select: {
      id: true,
      stage: true,
      findCarOutcome: true,
      proposalAcceptedOutcome: true,
      completedLostOutcome: true,
      createdAt: true,
      completedAt: true,
      lostAt: true,
      commissionReceived: true,
      contact: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return deals.map((d) => ({
    ...d,
    commissionReceived: d.commissionReceived ? Number(d.commissionReceived) : null,
  }));
}

/**
 * A deal can't reach Proposal Submitted (or any stage after it) without a
 * Final car set — see req 04. No other stage currently has a requirement.
 * Backward moves are intentionally unrestricted: this only ever blocks
 * moving INTO a stage whose index is >= Proposal Submitted, so dragging a
 * deal back toward Lead is always allowed regardless of Final car state.
 */
export function canEnterStage(
  deal: { finalMake: string | null },
  targetStage: DealStage
): { ok: true } | { ok: false; reason: string } {
  const targetIndex = DEAL_STAGE_ORDER.indexOf(targetStage);
  const proposalSubmittedIndex = DEAL_STAGE_ORDER.indexOf("PROPOSAL_SUBMITTED");
  if (targetIndex >= proposalSubmittedIndex && !deal.finalMake) {
    return {
      ok: false,
      reason: "Set a Final car on this deal before moving it to Proposal Submitted or later.",
    };
  }
  return { ok: true };
}

export async function moveDealStage(id: string, targetStage: DealStage) {
  const deal = await prisma.deal.findUniqueOrThrow({ where: { id } });
  const check = canEnterStage(deal, targetStage);
  if (!check.ok) return check;

  const data: {
    stage: DealStage;
    findCarOutcome?: "PENDING";
    proposalAcceptedOutcome?: "PENDING";
    completedLostOutcome?: "PENDING";
    completedAt?: null;
    lostAt?: null;
  } = { stage: targetStage };

  // Leaving a stage that carries an outcome resets that outcome to Pending
  // — symmetric with deriveStageFromOutcomes, which moves a deal INTO a
  // stage when its outcome is set. A deal shouldn't sit outside e.g.
  // Completed/Lost while still flagged Won/Lost underneath. completedAt/
  // lostAt reset alongside completedLostOutcome so a reopened deal doesn't
  // keep a stale "closed" timestamp.
  if (deal.stage === "FIND_CAR" && targetStage !== "FIND_CAR") {
    data.findCarOutcome = "PENDING";
  }
  if (deal.stage === "PROPOSAL_ACCEPTED" && targetStage !== "PROPOSAL_ACCEPTED") {
    data.proposalAcceptedOutcome = "PENDING";
  }
  if (deal.stage === "COMPLETED_LOST" && targetStage !== "COMPLETED_LOST") {
    data.completedLostOutcome = "PENDING";
    data.completedAt = null;
    data.lostAt = null;
  }

  await prisma.$transaction(async (tx) => {
    await tx.deal.update({ where: { id }, data });
    await logStageChange(
      tx,
      id,
      DEAL_STAGE_LABELS[deal.stage],
      DEAL_STAGE_LABELS[targetStage]
    );
  });
  return { ok: true } as const;
}

/**
 * Used by the board's "moving into Proposal Accepted / Completed/Lost"
 * pop-ups — sets the stage AND the outcome (plus commission, for a won
 * Completed/Lost) in one action, so a card never sits in either column with
 * an undecided outcome. Find Car deliberately does NOT get this treatment
 * (per user decision) — dragging into Find Car leaves its outcome Pending
 * until set manually on the deal form.
 */
export async function setBoardOutcome(
  id: string,
  targetStage: "PROPOSAL_ACCEPTED" | "COMPLETED_LOST",
  outcome: "YES" | "NO",
  commissionReceived?: string
) {
  const deal = await prisma.deal.findUniqueOrThrow({ where: { id } });
  const check = canEnterStage(deal, targetStage);
  if (!check.ok) return check;

  if (targetStage === "PROPOSAL_ACCEPTED") {
    await prisma.$transaction(async (tx) => {
      await tx.deal.update({
        where: { id },
        data: { stage: "PROPOSAL_ACCEPTED", proposalAcceptedOutcome: outcome },
      });
      await logStageChange(
        tx,
        id,
        DEAL_STAGE_LABELS[deal.stage],
        DEAL_STAGE_LABELS["PROPOSAL_ACCEPTED"],
        outcome === "YES" ? "Accepted" : "Rejected"
      );
    });
    return { ok: true } as const;
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.deal.update({
      where: { id },
      data: {
        stage: "COMPLETED_LOST",
        completedLostOutcome: outcome,
        completedAt: outcome === "YES" ? (deal.completedAt ?? now) : deal.completedAt,
        lostAt: outcome === "NO" ? (deal.lostAt ?? now) : deal.lostAt,
        commissionReceived:
          outcome === "YES" && commissionReceived
            ? commissionReceived
            : deal.commissionReceived,
        // req 10: a pending Stalled reminder is auto-cancelled the instant
        // the deal reaches Completed/Lost.
        ...(deal.nextActionKind === "STALLED"
          ? {
              nextActionCategory: null,
              nextActionDescription: null,
              nextActionDueAt: null,
              nextActionKind: null,
              nextActionReminderSentAt: null,
            }
          : {}),
      },
    });
    await logStageChange(
      tx,
      id,
      DEAL_STAGE_LABELS[deal.stage],
      DEAL_STAGE_LABELS["COMPLETED_LOST"],
      outcome === "YES" ? "Won" : "Lost"
    );
  });
  return { ok: true } as const;
}

export async function getDeal(id: string) {
  return prisma.deal.findUnique({
    where: { id },
    include: { contact: true, additionalProducts: true },
  });
}

export async function createDeal(input: DealInput) {
  const data = dealInputSchema.parse(input);
  const { additionalProducts, ...dealFields } = data;

  return prisma.deal.create({
    data: {
      ...dealFields,
      stage: deriveStageFromOutcomes(data),
      // Stamped here rather than accepted from the form — see updateDeal.
      completedAt: data.completedLostOutcome === "YES" ? new Date() : undefined,
      lostAt: data.completedLostOutcome === "NO" ? new Date() : undefined,
      additionalProducts: {
        create: additionalProducts.map((p) => ({
          type: p.type,
          value: p.value,
        })),
      },
    },
  });
}

export async function updateDeal(id: string, input: DealInput) {
  const data = dealInputSchema.parse(input);
  const { additionalProducts, ...dealFields } = data;

  const existing = await prisma.deal.findUniqueOrThrow({ where: { id } });

  // completedAt/lostAt are never accepted as direct input — only stamped
  // automatically, once, the first time the deal reaches that outcome.
  const completedAt =
    data.completedLostOutcome === "YES" && !existing.completedAt
      ? new Date()
      : existing.completedAt;
  const lostAt =
    data.completedLostOutcome === "NO" && !existing.lostAt
      ? new Date()
      : existing.lostAt;

  const newStage = deriveStageFromOutcomes(data);
  const justReachedCompletedLost =
    existing.completedLostOutcome === "PENDING" &&
    data.completedLostOutcome !== "PENDING";

  return prisma.$transaction(async (tx) => {
    await tx.additionalProduct.deleteMany({ where: { dealId: id } });
    const updated = await tx.deal.update({
      where: { id },
      data: {
        ...dealFields,
        stage: newStage,
        completedAt,
        lostAt,
        additionalProducts: {
          create: additionalProducts.map((p) => ({
            type: p.type,
            value: p.value,
          })),
        },
        // req 10: a pending Stalled reminder is auto-cancelled the instant
        // the deal reaches Completed/Lost.
        ...(justReachedCompletedLost && existing.nextActionKind === "STALLED"
          ? {
              nextActionCategory: null,
              nextActionDescription: null,
              nextActionDueAt: null,
              nextActionKind: null,
              nextActionReminderSentAt: null,
            }
          : {}),
      },
    });
    await logStageChange(
      tx,
      id,
      DEAL_STAGE_LABELS[existing.stage],
      DEAL_STAGE_LABELS[newStage]
    );
    return updated;
  });
}

export async function deleteDeal(id: string) {
  await prisma.deal.delete({ where: { id } });
}

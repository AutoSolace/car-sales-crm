import { prisma } from "@/lib/db/client";
import { addMonthsFromAnchor, isOverdue } from "@/lib/automation";

const RECONNECT_STAGE_1_MONTHS = 6;
const RECONNECT_STAGE_2_MONTHS = 18;
const STALLED_STAGE_1_MONTHS = 6;
const STALLED_STAGE_2_MONTHS = 12;

type ReconnectAction = {
  kind: "schedule-6mo" | "schedule-18mo";
  dealId: string;
  dueAt: Date;
};

type StalledAction = {
  kind: "schedule-6mo" | "schedule-12mo" | "advance-to-12mo" | "cancel";
  dealId: string;
  dueAt?: Date;
};

/**
 * Reconnect (req 09): only genuinely won, completed deals. Never touches a
 * slot already holding a non-RECONNECT next action (user-set or otherwise
 * owned). reconnect6moScheduledAt/reconnect18moScheduledAt are stamped once
 * and never re-checked false, so completing the 6-month reminder early
 * doesn't cause it to be re-scheduled — the emptied slot is disambiguated
 * from "never scheduled" by these flags, since the anchor (completedAt)
 * never resets the way the stalled anchor does.
 */
async function planReconnect(now: Date): Promise<ReconnectAction[]> {
  const deals = await prisma.deal.findMany({
    where: { stage: "COMPLETED_LOST", completedLostOutcome: "YES" },
  });

  const actions: ReconnectAction[] = [];
  for (const deal of deals) {
    if (!deal.completedAt) continue;
    if (deal.nextActionDueAt && deal.nextActionKind !== "RECONNECT") continue;

    if (
      !deal.reconnect6moScheduledAt &&
      isOverdue(deal.completedAt, RECONNECT_STAGE_1_MONTHS, now)
    ) {
      actions.push({
        kind: "schedule-6mo",
        dealId: deal.id,
        dueAt: addMonthsFromAnchor(deal.completedAt, RECONNECT_STAGE_1_MONTHS),
      });
    } else if (
      deal.reconnect6moScheduledAt &&
      !deal.reconnect18moScheduledAt &&
      isOverdue(deal.completedAt, RECONNECT_STAGE_2_MONTHS, now)
    ) {
      actions.push({
        kind: "schedule-18mo",
        dealId: deal.id,
        dueAt: addMonthsFromAnchor(deal.completedAt, RECONNECT_STAGE_2_MONTHS),
      });
    }
  }
  return actions;
}

async function dealLastActivityAt(dealId: string, createdAt: Date): Promise<Date> {
  const latest = await prisma.activityLog.findFirst({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return latest?.createdAt ?? createdAt;
}

/**
 * Stalled (req 10): active (not Completed/Lost) deals only. No persisted
 * "already scheduled" flags — everything is derived fresh from the deal's
 * current last-activity anchor each sweep, which is what makes "the clock
 * resets on any new activity log entry" fall out for free: completing a
 * next action already logs an entry (M4), which moves the anchor forward,
 * so the very next sweep correctly sees the deal as no-longer-stalled.
 */
async function planStalled(now: Date): Promise<StalledAction[]> {
  const deals = await prisma.deal.findMany({
    where: { stage: { not: "COMPLETED_LOST" } },
  });

  const actions: StalledAction[] = [];
  for (const deal of deals) {
    if (deal.nextActionDueAt && deal.nextActionKind !== "STALLED") continue;

    const lastActivityAt = await dealLastActivityAt(deal.id, deal.createdAt);
    const stalled6 = isOverdue(lastActivityAt, STALLED_STAGE_1_MONTHS, now);
    const stalled12 = isOverdue(lastActivityAt, STALLED_STAGE_2_MONTHS, now);

    if (deal.nextActionKind === "STALLED") {
      if (!stalled6) {
        actions.push({ kind: "cancel", dealId: deal.id });
      } else if (
        stalled12 &&
        deal.nextActionDueAt! <
          addMonthsFromAnchor(lastActivityAt, STALLED_STAGE_2_MONTHS)
      ) {
        actions.push({
          kind: "advance-to-12mo",
          dealId: deal.id,
          dueAt: addMonthsFromAnchor(lastActivityAt, STALLED_STAGE_2_MONTHS),
        });
      }
      continue;
    }

    if (stalled12) {
      actions.push({
        kind: "schedule-12mo",
        dealId: deal.id,
        dueAt: addMonthsFromAnchor(lastActivityAt, STALLED_STAGE_2_MONTHS),
      });
    } else if (stalled6) {
      actions.push({
        kind: "schedule-6mo",
        dealId: deal.id,
        dueAt: addMonthsFromAnchor(lastActivityAt, STALLED_STAGE_1_MONTHS),
      });
    }
  }
  return actions;
}

/** Pure preview — plans both sweeps without writing anything. */
export async function previewAutomationSweep(now: Date = new Date()) {
  const [reconnect, stalled] = await Promise.all([
    planReconnect(now),
    planStalled(now),
  ]);
  return { reconnect, stalled };
}

/** The real thing — applies whatever previewAutomationSweep would plan. */
export async function runAutomationSweep(now: Date = new Date()) {
  const { reconnect, stalled } = await previewAutomationSweep(now);

  const reconnectScheduled: string[] = [];
  for (const action of reconnect) {
    const description =
      action.kind === "schedule-6mo"
        ? "6-month post-sale reconnect check-in."
        : "18-month post-sale reconnect check-in.";
    await prisma.deal.update({
      where: { id: action.dealId },
      data: {
        nextActionCategory: "CALL",
        nextActionDescription: description,
        nextActionDueAt: action.dueAt,
        nextActionKind: "RECONNECT",
        nextActionReminderSentAt: null,
        ...(action.kind === "schedule-6mo"
          ? { reconnect6moScheduledAt: now }
          : { reconnect18moScheduledAt: now }),
      },
    });
    reconnectScheduled.push(action.dealId);
  }

  const stalledScheduled: string[] = [];
  const stalledCancelled: string[] = [];
  for (const action of stalled) {
    if (action.kind === "cancel") {
      await prisma.deal.update({
        where: { id: action.dealId },
        data: {
          nextActionCategory: null,
          nextActionDescription: null,
          nextActionDueAt: null,
          nextActionKind: null,
          nextActionReminderSentAt: null,
        },
      });
      stalledCancelled.push(action.dealId);
      continue;
    }

    const stage12 = action.kind !== "schedule-6mo";
    const description = stage12
      ? "Deal has stalled — 12 months since last contact. Reach out to re-engage."
      : "Deal has stalled — 6 months since last contact. Reach out to re-engage.";
    await prisma.deal.update({
      where: { id: action.dealId },
      data: {
        nextActionCategory: "CALL",
        nextActionDescription: description,
        nextActionDueAt: action.dueAt,
        nextActionKind: "STALLED",
        nextActionReminderSentAt: null,
      },
    });
    stalledScheduled.push(action.dealId);
  }

  return { reconnectScheduled, stalledScheduled, stalledCancelled };
}

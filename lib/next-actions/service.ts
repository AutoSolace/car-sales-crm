import { prisma } from "@/lib/db/client";
import { logNextActionCompleted } from "@/lib/activity-log/service";
import { NEXT_ACTION_CATEGORY_LABELS } from "@/lib/types";
import { nextActionInputSchema } from "./validation";

/**
 * Sets/replaces the deal's one active next action (req 07) — overwrites
 * whatever was there before, no history kept of prior next actions.
 */
export async function setNextAction(
  dealId: string,
  input: { category: string; description: string; dueAt: string }
) {
  const data = nextActionInputSchema.parse(input);
  return prisma.deal.update({
    where: { id: dealId },
    data: {
      nextActionCategory: data.category,
      nextActionDescription: data.description,
      nextActionDueAt: data.dueAt,
      nextActionKind: "REGULAR",
      nextActionReminderSentAt: null,
    },
  });
}

/**
 * Marks the deal's active next action done: logs it to the activity log,
 * then clears the slot. No-ops if nothing is currently set (defensive
 * against a stale double-submit).
 */
export async function completeNextAction(dealId: string) {
  const deal = await prisma.deal.findUniqueOrThrow({ where: { id: dealId } });
  if (
    !deal.nextActionDueAt ||
    !deal.nextActionCategory ||
    !deal.nextActionDescription
  ) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.deal.update({
      where: { id: dealId },
      data: {
        nextActionCategory: null,
        nextActionDescription: null,
        nextActionDueAt: null,
        nextActionKind: null,
        nextActionReminderSentAt: null,
      },
    });
    await logNextActionCompleted(
      tx,
      dealId,
      NEXT_ACTION_CATEGORY_LABELS[deal.nextActionCategory!],
      deal.nextActionDescription!,
      deal.nextActionDueAt!
    );
  });
}

/**
 * Cross-deal to-do list (req 11) — every deal with a pending next action,
 * soonest due first.
 */
export async function listPendingNextActions() {
  return prisma.deal.findMany({
    where: { nextActionDueAt: { not: null } },
    orderBy: { nextActionDueAt: "asc" },
    select: {
      id: true,
      stage: true,
      nextActionCategory: true,
      nextActionDescription: true,
      nextActionDueAt: true,
      contact: { select: { firstName: true, lastName: true } },
    },
  });
}

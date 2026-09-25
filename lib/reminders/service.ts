import { prisma } from "@/lib/db/client";
import { logReminderSent } from "@/lib/activity-log/service";
import { NEXT_ACTION_CATEGORY_LABELS } from "@/lib/types";
import { buildReminderEmail, sendReminderEmail } from "./mailer";

async function findDueDeals() {
  return prisma.deal.findMany({
    where: { nextActionDueAt: { lte: new Date() }, nextActionReminderSentAt: null },
    include: { contact: { select: { firstName: true, lastName: true } } },
  });
}

function toReminderInput(deal: Awaited<ReturnType<typeof findDueDeals>>[number]) {
  return {
    dealId: deal.id,
    contactName: `${deal.contact.firstName} ${deal.contact.lastName ?? ""}`.trim(),
    categoryLabel: NEXT_ACTION_CATEGORY_LABELS[deal.nextActionCategory!],
    description: deal.nextActionDescription!,
    dueAt: deal.nextActionDueAt!,
  };
}

/**
 * Pure read — composes what would be sent right now without touching the
 * DB or the mailer. Safe to call any number of times.
 */
export async function previewDueReminders() {
  const deals = await findDueDeals();
  return deals.map((deal) => {
    const input = toReminderInput(deal);
    return { ...input, ...buildReminderEmail(input) };
  });
}

/**
 * Actually sends. For each due deal: sends the email, and only on confirmed
 * success stamps nextActionReminderSentAt + logs a REMINDER_SENT entry (in
 * one $transaction, so a crash between send and stamp is the only way to
 * get a duplicate — accepted as a rare edge case for a personal tool, not
 * worth building real idempotency-key infrastructure for). One deal's
 * failure doesn't stop the rest of the batch.
 */
export async function sendDueReminders() {
  const deals = await findDueDeals();
  const sent: string[] = [];
  const failed: { dealId: string; error: string }[] = [];

  for (const deal of deals) {
    const input = toReminderInput(deal);
    try {
      await sendReminderEmail(input);
      await prisma.$transaction(async (tx) => {
        await tx.deal.update({
          where: { id: deal.id },
          data: { nextActionReminderSentAt: new Date() },
        });
        await logReminderSent(
          tx,
          deal.id,
          input.categoryLabel,
          input.description,
          input.dueAt
        );
      });
      sent.push(deal.id);
    } catch (err) {
      failed.push({
        dealId: deal.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { sent, failed };
}

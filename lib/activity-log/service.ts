import { prisma } from "@/lib/db/client";
import type { Prisma } from "@prisma/client";
import {
  activityLogCreateSchema,
  activityLogUpdateSchema,
} from "./validation";

// Accepted by logStageChange so it can be called inside a deal update's own
// $transaction and commit atomically alongside it.
type Db = typeof prisma | Prisma.TransactionClient;

export async function listActivityLogs(dealId: string) {
  return prisma.activityLog.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createActivityLog(
  dealId: string,
  input: { type: string; note: string }
) {
  const data = activityLogCreateSchema.parse(input);
  return prisma.activityLog.create({
    data: { dealId, type: data.type, note: data.note },
  });
}

export async function updateActivityLog(id: string, input: { note: string }) {
  const data = activityLogUpdateSchema.parse(input);
  return prisma.activityLog.update({
    where: { id },
    data: { note: data.note },
  });
}

export async function deleteActivityLog(id: string) {
  await prisma.activityLog.delete({ where: { id } });
}

/**
 * Auto-logs a stage change (req 06). Called from moveDealStage,
 * setBoardOutcome, and updateDeal — always passed that call's own `tx` so
 * the log entry commits atomically with the deal update that caused it.
 * No-ops if the stage didn't actually change.
 */
export async function logStageChange(
  db: Db,
  dealId: string,
  fromLabel: string,
  toLabel: string,
  detail?: string
) {
  if (fromLabel === toLabel) return;
  const note = detail
    ? `Stage changed: ${fromLabel} → ${toLabel} (${detail})`
    : `Stage changed: ${fromLabel} → ${toLabel}`;
  await db.activityLog.create({
    data: { dealId, type: "STAGE_CHANGE", note },
  });
}

/**
 * Auto-logs a completed next action (req 07). Called from
 * completeNextAction alongside nulling the deal's next-action fields, in
 * the same `tx` so both commit together.
 */
export async function logNextActionCompleted(
  db: Db,
  dealId: string,
  categoryLabel: string,
  description: string,
  dueAt: Date
) {
  await db.activityLog.create({
    data: {
      dealId,
      type: "NEXT_ACTION_COMPLETED",
      note: `Completed: ${categoryLabel} — ${description} (was due ${dueAt.toLocaleString()})`,
    },
  });
}

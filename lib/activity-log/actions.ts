"use server";

import { revalidatePath } from "next/cache";
import * as activityLogService from "./service";

export async function createActivityLogAction(
  dealId: string,
  formData: FormData
) {
  await activityLogService.createActivityLog(dealId, {
    type: String(formData.get("type") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  revalidatePath(`/deals/${dealId}`);
}

/**
 * Called directly from ActivityLogItem's client-side edit handler, not bound
 * to a form — same pattern as the board's moveDealStageAction.
 */
export async function updateActivityLogAction(
  id: string,
  dealId: string,
  note: string
) {
  await activityLogService.updateActivityLog(id, { note });
  revalidatePath(`/deals/${dealId}`);
}

export async function deleteActivityLogAction(id: string, dealId: string) {
  await activityLogService.deleteActivityLog(id);
  revalidatePath(`/deals/${dealId}`);
}

"use server";

import { revalidatePath } from "next/cache";
import * as nextActionService from "./service";

export async function setNextActionAction(dealId: string, formData: FormData) {
  await nextActionService.setNextAction(dealId, {
    category: String(formData.get("category") ?? ""),
    description: String(formData.get("description") ?? ""),
    dueAt: String(formData.get("dueAt") ?? ""),
  });
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/todos");
}

export async function completeNextActionAction(dealId: string) {
  await nextActionService.completeNextAction(dealId);
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/todos");
}

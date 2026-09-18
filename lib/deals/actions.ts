"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { DealStage } from "@prisma/client";
import * as dealService from "./service";
import type { DealInput } from "./validation";

function formDataToDealInput(formData: FormData): DealInput {
  const types = formData.getAll("additionalProductType") as string[];
  const values = formData.getAll("additionalProductValue") as string[];
  const additionalProducts = types
    .map((type, i) => ({ type, value: values[i] }))
    .filter((p) => p.type && p.value) as DealInput["additionalProducts"];

  return {
    contactId: String(formData.get("contactId") ?? ""),
    stage: String(formData.get("stage") ?? "LEAD") as DealInput["stage"],
    findCarOutcome: String(
      formData.get("findCarOutcome") ?? "PENDING"
    ) as DealInput["findCarOutcome"],
    proposalAcceptedOutcome: String(
      formData.get("proposalAcceptedOutcome") ?? "PENDING"
    ) as DealInput["proposalAcceptedOutcome"],
    completedLostOutcome: String(
      formData.get("completedLostOutcome") ?? "PENDING"
    ) as DealInput["completedLostOutcome"],
    commissionReceived: String(formData.get("commissionReceived") ?? ""),
    commissionPercent: String(formData.get("commissionPercent") ?? ""),
    lender: String(formData.get("lender") ?? ""),
    carsInterested: String(formData.get("carsInterested") ?? ""),
    finalMake: String(formData.get("finalMake") ?? ""),
    finalModel: String(formData.get("finalModel") ?? ""),
    finalYear: String(formData.get("finalYear") ?? ""),
    finalRegistration: String(formData.get("finalRegistration") ?? ""),
    finalMileage: String(formData.get("finalMileage") ?? ""),
    finalPrice: String(formData.get("finalPrice") ?? ""),
    deposit: String(formData.get("deposit") ?? ""),
    finalIsNew: formData.get("finalIsNew")
      ? String(formData.get("finalIsNew"))
      : "",
    additionalProducts,
  } as unknown as DealInput;
}

export async function createDealAction(formData: FormData) {
  const deal = await dealService.createDeal(formDataToDealInput(formData));
  revalidatePath(`/contacts/${deal.contactId}`);
  redirect(`/deals/${deal.id}`);
}

export async function updateDealAction(id: string, formData: FormData) {
  const deal = await dealService.updateDeal(id, formDataToDealInput(formData));
  revalidatePath(`/contacts/${deal.contactId}`);
  revalidatePath(`/deals/${id}`);
  redirect(`/deals/${id}`);
}

export async function deleteDealAction(id: string, contactId: string) {
  await dealService.deleteDeal(id);
  revalidatePath(`/contacts/${contactId}`);
  redirect(`/contacts/${contactId}`);
}

/**
 * Called directly from the board's drag handler (a client component) — no
 * redirect, just a result the UI uses to snap the card back on failure.
 */
export async function moveDealStageAction(id: string, targetStage: DealStage) {
  const result = await dealService.moveDealStage(id, targetStage);
  if (result.ok) {
    revalidatePath("/");
  }
  return result;
}

/**
 * Called from the board's outcome pop-up, shown when a card is dragged into
 * Proposal Accepted or Completed/Lost — sets stage + outcome (+ commission,
 * for a won Completed/Lost) together, so the card never lands there without
 * a decided outcome.
 */
export async function setBoardOutcomeAction(
  id: string,
  targetStage: "PROPOSAL_ACCEPTED" | "COMPLETED_LOST",
  outcome: "YES" | "NO",
  commissionReceived?: string
) {
  const result = await dealService.setBoardOutcome(
    id,
    targetStage,
    outcome,
    commissionReceived
  );
  if (result.ok) {
    revalidatePath("/");
  }
  return result;
}

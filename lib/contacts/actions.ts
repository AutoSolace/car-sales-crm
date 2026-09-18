"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as contactService from "./service";
import type { ContactInput } from "./validation";

function formDataToContactInput(formData: FormData): ContactInput {
  return {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    address: String(formData.get("address") ?? ""),
    leadSource: String(formData.get("leadSource") ?? "") as ContactInput["leadSource"],
    preferredContactMethod: String(
      formData.get("preferredContactMethod") ?? ""
    ) as ContactInput["preferredContactMethod"],
    notes: String(formData.get("notes") ?? ""),
    lastContactDate: String(formData.get("lastContactDate") ?? ""),
  } as unknown as ContactInput;
}

export async function createContactAction(formData: FormData) {
  const contact = await contactService.createContact(
    formDataToContactInput(formData)
  );
  revalidatePath("/contacts");
  redirect(`/contacts/${contact.id}`);
}

export async function updateContactAction(id: string, formData: FormData) {
  await contactService.updateContact(id, formDataToContactInput(formData));
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  redirect(`/contacts/${id}`);
}

export async function deleteContactAction(id: string) {
  await contactService.deleteContact(id);
  revalidatePath("/contacts");
  redirect("/contacts");
}

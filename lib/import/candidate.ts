import type { ContactImportField } from "@/lib/types";

export type ImportMapping = Record<string, ContactImportField>;

export interface RawCandidate {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  leadSourceRaw: string;
  preferredContactMethodRaw: string;
  notes: string;
  createdDateRaw: string;
}

export function buildCandidate(
  row: string[],
  mapping: ImportMapping
): RawCandidate {
  const byField: Partial<Record<ContactImportField, string>> = {};
  for (const [headerIndex, field] of Object.entries(mapping)) {
    byField[field] = (row[Number(headerIndex)] ?? "").trim();
  }

  return {
    firstName: byField.firstName ?? "",
    lastName: byField.lastName ?? "",
    phone: byField.phone ?? "",
    email: byField.email ?? "",
    address: byField.address ?? "",
    leadSourceRaw: byField.leadSource ?? "",
    preferredContactMethodRaw: byField.preferredContactMethod ?? "",
    notes: byField.notes ?? "",
    createdDateRaw: byField.createdDate ?? "",
  };
}

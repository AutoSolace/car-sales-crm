"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { CONTACT_IMPORT_FIELDS, type ContactImportField } from "@/lib/types";
import { buildCandidate, type ImportMapping } from "./candidate";
import { findDuplicateMatch } from "./duplicateDetection";
import { coerceLeadSource, coercePreferredContactMethod, coerceDate } from "./coerce";

export async function saveMappingAction(sessionId: string, formData: FormData) {
  const session = await prisma.importSession.findUniqueOrThrow({
    where: { id: sessionId },
  });
  const headers: string[] = JSON.parse(session.headers);

  const mapping: ImportMapping = {};
  headers.forEach((_, i) => {
    const value = formData.get(`map_${i}`);
    if (value && CONTACT_IMPORT_FIELDS.includes(value as ContactImportField)) {
      mapping[i] = value as ContactImportField;
    }
  });

  const hasFirstName = Object.values(mapping).includes("firstName");
  if (!hasFirstName) {
    redirect(
      `/contacts/import/mapping?session=${sessionId}&error=${encodeURIComponent(
        "Map First name to a column before continuing."
      )}`
    );
  }

  await prisma.importSession.update({
    where: { id: sessionId },
    data: { mappingJson: JSON.stringify(mapping) },
  });

  redirect(`/contacts/import/review?session=${sessionId}`);
}

type RowOutcome = {
  row: number;
  data: string;
  outcome: string;
  reason: string;
};

export async function commitImportAction(
  sessionId: string,
  formData: FormData
) {
  const session = await prisma.importSession.findUniqueOrThrow({
    where: { id: sessionId },
  });
  const rows: string[][] = JSON.parse(session.rawDataJson);
  const mapping: ImportMapping = JSON.parse(session.mappingJson ?? "{}");
  const existingContacts = await prisma.contact.findMany();

  const outcomes: RowOutcome[] = [];
  let imported = 0;
  let merged = 0;
  let skippedDuplicate = 0;
  let skippedMissingName = 0;
  let warnings = 0;

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const candidate = buildCandidate(row, mapping);
      const rowLabel = row.join(", ");

      if (!candidate.firstName) {
        skippedMissingName++;
        outcomes.push({
          row: i + 1,
          data: rowLabel,
          outcome: "Skipped",
          reason: "Missing first name",
        });
        continue;
      }

      const leadSource = coerceLeadSource(candidate.leadSourceRaw);
      const preferredContactMethod = coercePreferredContactMethod(
        candidate.preferredContactMethodRaw
      );
      const createdDate = coerceDate(candidate.createdDateRaw);
      const rowWarnings = [
        leadSource.warning,
        preferredContactMethod.warning,
        createdDate.warning,
      ]
        .filter(Boolean)
        .join("; ");
      if (rowWarnings) warnings++;

      // createdAt is deliberately kept out of this object — it's only ever
      // set when creating a brand-new contact (below), never written onto
      // an existing one during a merge; an existing contact's original
      // created date should stay exactly as it is. lastContactDate is fine
      // here — the merge path below only fills it in when the existing
      // contact doesn't already have one. Both dates come from the same
      // CSV column, so a previous contact's last-contacted date starts
      // out matching when they were first created.
      const contactData = {
        firstName: candidate.firstName,
        lastName: candidate.lastName || undefined,
        phone: candidate.phone || undefined,
        email: candidate.email || undefined,
        address: candidate.address || undefined,
        notes: candidate.notes || undefined,
        leadSource: leadSource.value,
        preferredContactMethod: preferredContactMethod.value,
        lastContactDate: createdDate.value,
      };

      const duplicate = findDuplicateMatch(candidate, existingContacts);

      if (!duplicate) {
        await tx.contact.create({
          data: { ...contactData, createdAt: createdDate.value },
        });
        imported++;
        outcomes.push({
          row: i + 1,
          data: rowLabel,
          outcome: "Imported",
          reason: rowWarnings || "—",
        });
        continue;
      }

      const resolution = String(
        formData.get(`resolution_${i}`) ?? "skip"
      );
      const duplicateName = `${duplicate.firstName} ${duplicate.lastName ?? ""}`.trim();

      if (resolution === "skip") {
        skippedDuplicate++;
        outcomes.push({
          row: i + 1,
          data: rowLabel,
          outcome: "Skipped",
          reason: `Duplicate of existing contact "${duplicateName}"`,
        });
      } else if (resolution === "import") {
        await tx.contact.create({
          data: { ...contactData, createdAt: createdDate.value },
        });
        imported++;
        outcomes.push({
          row: i + 1,
          data: rowLabel,
          outcome: "Imported as new",
          reason: `Despite matching existing contact "${duplicateName}"`,
        });
      } else {
        // merge — fill blanks only, never overwrite existing data
        const fillBlanks: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(contactData)) {
          if (value === undefined) continue;
          const existingValue = (duplicate as Record<string, unknown>)[key];
          if (existingValue === null || existingValue === undefined) {
            fillBlanks[key] = value;
          }
        }
        await tx.contact.update({
          where: { id: duplicate.id },
          data: fillBlanks,
        });
        merged++;
        outcomes.push({
          row: i + 1,
          data: rowLabel,
          outcome: "Merged",
          reason: `Blank fields filled on existing contact "${duplicateName}"`,
        });
      }
    }
  });

  const report = {
    imported,
    merged,
    skippedDuplicate,
    skippedMissingName,
    warnings,
    total: rows.length,
    outcomes,
  };

  await prisma.importSession.update({
    where: { id: sessionId },
    data: { reportJson: JSON.stringify(report) },
  });

  revalidatePath("/contacts");
  redirect(`/contacts/import/result?session=${sessionId}`);
}

import type { Contact } from "@prisma/client";

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || undefined;
}

function normalizeName(firstName: string, lastName: string | null | undefined) {
  return `${firstName} ${lastName ?? ""}`
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export interface ImportCandidate {
  firstName: string;
  lastName?: string;
  email?: string;
}

/**
 * Exact match only (case-insensitive, whitespace-normalized) on email OR
 * full name — no fuzzy matching for v1.
 */
export function findDuplicateMatch(
  candidate: ImportCandidate,
  existingContacts: Contact[]
): Contact | undefined {
  const candidateEmail = normalizeEmail(candidate.email);
  const candidateName = normalizeName(candidate.firstName, candidate.lastName);

  return existingContacts.find((contact) => {
    if (candidateEmail && normalizeEmail(contact.email) === candidateEmail) {
      return true;
    }
    return normalizeName(contact.firstName, contact.lastName) === candidateName;
  });
}

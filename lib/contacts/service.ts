import { prisma } from "@/lib/db/client";
import { contactInputSchema, type ContactInput } from "./validation";

export async function listContacts(query?: string) {
  return prisma.contact.findMany({
    where: query
      ? {
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
          ],
        }
      : undefined,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      deals: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { completedLostOutcome: true },
      },
    },
  });
}

/**
 * Minimal name-only list for the global nav search (req 13) — deliberately
 * lighter than listContacts(), which joins in deal outcome data that the
 * nav has no use for and would otherwise load on every single page.
 */
export async function listContactNames() {
  return prisma.contact.findMany({
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function getContactWithDeals(id: string) {
  return prisma.contact.findUnique({
    where: { id },
    include: {
      deals: {
        orderBy: { createdAt: "desc" },
        include: { additionalProducts: true },
      },
    },
  });
}

export async function createContact(input: ContactInput) {
  const data = contactInputSchema.parse(input);
  // A contact you add by hand is, by definition, someone you've just been
  // in touch with — default lastContactDate to now unless the form
  // explicitly set one (e.g. backdating). Does not apply to CSV imports,
  // which go through lib/import/runImport.ts instead.
  return prisma.contact.create({
    data: { ...data, lastContactDate: data.lastContactDate ?? new Date() },
  });
}

export async function updateContact(id: string, input: ContactInput) {
  const data = contactInputSchema.parse(input);
  return prisma.contact.update({ where: { id }, data });
}

export async function deleteContact(id: string) {
  await prisma.contact.delete({ where: { id } });
}

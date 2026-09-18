import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

const optionalInt = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional()
  .transform((v) => (v === undefined ? undefined : Number.parseInt(v, 10)));

const optionalDecimalString = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

export const dealInputSchema = z.object({
  contactId: z.string().min(1),
  stage: z.enum([
    "LEAD",
    "CONTACTED",
    "FIND_CAR",
    "PROPOSAL_SUBMITTED",
    "PROPOSAL_ACCEPTED",
    "COMPLETED_LOST",
  ]),
  findCarOutcome: z.enum(["PENDING", "YES", "NO"]),
  proposalAcceptedOutcome: z.enum(["PENDING", "YES", "NO"]),
  completedLostOutcome: z.enum(["PENDING", "YES", "NO"]),
  commissionReceived: optionalDecimalString,
  commissionPercent: optionalDecimalString,
  lender: optionalString,
  carsInterested: optionalString,
  finalMake: optionalString,
  finalModel: optionalString,
  finalYear: optionalInt,
  finalRegistration: optionalString,
  finalMileage: optionalInt,
  finalPrice: optionalDecimalString,
  deposit: optionalDecimalString,
  finalIsNew: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? undefined : v === "true")),
  additionalProducts: z
    .array(
      z.object({
        type: z.enum([
          "WARRANTY_2YR",
          "WARRANTY_3YR",
          "SHINE_PROTECT_1YR",
          "SHINE_PROTECT_2YR",
        ]),
        value: z.string().trim().min(1),
      })
    )
    .default([]),
});

export type DealInput = z.infer<typeof dealInputSchema>;

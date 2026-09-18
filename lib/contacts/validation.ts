import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

export const contactInputSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: optionalString,
  phone: optionalString,
  email: optionalString,
  address: optionalString,
  leadSource: z
    .enum([
      "WALK_IN",
      "REFERRAL",
      "WEBSITE",
      "PHONE_ENQUIRY",
      "SOCIAL_MEDIA",
      "SOCIAL_MEDIA_AD",
      "OTHER",
    ])
    .optional()
    .or(z.literal("").transform(() => undefined)),
  preferredContactMethod: z
    .enum(["PHONE", "EMAIL", "TEXT_SMS", "WHATSAPP"])
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: optionalString,
  lastContactDate: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : new Date(v)))
    .optional(),
});

export type ContactInput = z.infer<typeof contactInputSchema>;

import { z } from "zod";

export const nextActionInputSchema = z.object({
  category: z.enum(["CALL", "EMAIL", "MEETING", "VIEWING", "OTHER"]),
  description: z.string().trim().min(1, "Description is required"),
  dueAt: z
    .string()
    .trim()
    .min(1, "Due date/time is required")
    .transform((v) => new Date(v)),
});

export type NextActionInput = z.infer<typeof nextActionInputSchema>;

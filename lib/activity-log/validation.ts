import { z } from "zod";

// Manual entries are only ever logged as a Call or a Note — Stage change and
// Reminder sent are system-generated categories (see service.ts's
// logStageChange), never picked by hand from the "add entry" form.
export const activityLogCreateSchema = z.object({
  type: z.enum(["CALL", "NOTE"]),
  note: z.string().trim().min(1, "Note is required"),
});

export type ActivityLogCreateInput = z.infer<typeof activityLogCreateSchema>;

// Type is fixed at creation time and never edited afterward — only the note
// text can change.
export const activityLogUpdateSchema = z.object({
  note: z.string().trim().min(1, "Note is required"),
});

export type ActivityLogUpdateInput = z.infer<typeof activityLogUpdateSchema>;

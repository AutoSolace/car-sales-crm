/**
 * The date recontact-style automations were switched on. Elapsed time for
 * any automation is measured from max(the real anchor date, this date) —
 * so historical data (e.g. a bulk CSV import with old dates) never floods
 * everything with "overdue" flags the moment automation goes live. Flags
 * only start appearing once the relevant window has passed since launch.
 */
export const AUTOMATION_START_DATE = new Date("2026-09-18T00:00:00.000Z");

const MS_PER_MONTH = (1000 * 60 * 60 * 24 * 365.25) / 12;

export function monthsSinceAnchor(date: Date, now: Date = new Date()): number {
  const anchor = date > AUTOMATION_START_DATE ? date : AUTOMATION_START_DATE;
  return (now.getTime() - anchor.getTime()) / MS_PER_MONTH;
}

export function isOverdue(
  date: Date | null | undefined,
  thresholdMonths: number,
  now: Date = new Date()
): boolean {
  if (!date) return false;
  return monthsSinceAnchor(date, now) >= thresholdMonths;
}

/**
 * The date `thresholdMonths` after `date`, using the same
 * AUTOMATION_START_DATE clamping as monthsSinceAnchor/isOverdue — so a
 * reminder auto-scheduled from an old pre-launch date lands
 * `thresholdMonths` after launch, not after the original (already long
 * past) anchor date, consistent with how "is this overdue" is judged.
 */
export function addMonthsFromAnchor(date: Date, thresholdMonths: number): Date {
  const anchor = date > AUTOMATION_START_DATE ? date : AUTOMATION_START_DATE;
  return new Date(anchor.getTime() + thresholdMonths * MS_PER_MONTH);
}

const RECONTACT_THRESHOLD_MONTHS = 6;

/**
 * Flags a contact as overdue for recontact — 6 months since lastContactDate
 * (clamped to AUTOMATION_START_DATE), skipped entirely if their most recent
 * deal already completed, since req 09's post-sale reconnect schedule owns
 * that relationship instead. lastContactDate defaults to today when a
 * contact is created by hand and otherwise only changes via manual edit —
 * it does not update just from viewing the contact.
 */
export function contactNeedsRecontact(contact: {
  lastContactDate: Date | null;
  deals: { completedLostOutcome: "PENDING" | "YES" | "NO" }[];
}): boolean {
  const mostRecentDeal = contact.deals[0];
  if (mostRecentDeal?.completedLostOutcome === "YES") return false;
  return isOverdue(contact.lastContactDate, RECONTACT_THRESHOLD_MONTHS);
}

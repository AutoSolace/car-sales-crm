import type { LeadSource, PreferredContactMethod } from "@prisma/client";
import {
  LEAD_SOURCE_LABELS,
  PREFERRED_CONTACT_METHOD_LABELS,
} from "@/lib/types";

function matchEnumByLabel<T extends string>(
  raw: string,
  labels: Record<T, string>
): T | undefined {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return undefined;

  const entry = (Object.entries(labels) as [T, string][]).find(
    ([key, label]) =>
      label.toLowerCase() === normalized || key.toLowerCase() === normalized
  );
  return entry?.[0];
}

export function coerceLeadSource(raw: string): {
  value?: LeadSource;
  warning?: string;
} {
  if (!raw.trim()) return {};
  const value = matchEnumByLabel(raw, LEAD_SOURCE_LABELS);
  if (value) return { value };
  return { warning: `Lead source not recognized: "${raw}"` };
}

export function coercePreferredContactMethod(raw: string): {
  value?: PreferredContactMethod;
  warning?: string;
} {
  if (!raw.trim()) return {};
  const value = matchEnumByLabel(raw, PREFERRED_CONTACT_METHOD_LABELS);
  if (value) return { value };
  return { warning: `Preferred contact method not recognized: "${raw}"` };
}

export function coerceDate(raw: string): { value?: Date; warning?: string } {
  if (!raw.trim()) return {};
  const parsed = new Date(raw.trim());
  if (!Number.isNaN(parsed.getTime())) return { value: parsed };
  return { warning: `Last contact date not recognized: "${raw}"` };
}

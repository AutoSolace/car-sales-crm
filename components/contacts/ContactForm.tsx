import Link from "next/link";
import type { Contact } from "@prisma/client";
import {
  LEAD_SOURCE_LABELS,
  PREFERRED_CONTACT_METHOD_LABELS,
} from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function ContactForm({
  action,
  defaultValues,
  submitLabel = "Save contact",
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: Partial<Contact>;
  submitLabel?: string;
  cancelHref?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4 max-w-lg">
      <div>
        <label htmlFor="firstName">First name *</label>
        <Input
          id="firstName"
          name="firstName"
          required
          defaultValue={defaultValues?.firstName ?? ""}
        />
      </div>

      <div>
        <label htmlFor="lastName">Last name</label>
        <Input
          id="lastName"
          name="lastName"
          defaultValue={defaultValues?.lastName ?? ""}
        />
      </div>

      <div>
        <label htmlFor="phone">Phone</label>
        <Input
          id="phone"
          name="phone"
          defaultValue={defaultValues?.phone ?? ""}
        />
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultValues?.email ?? ""}
        />
      </div>

      <div>
        <label htmlFor="address">Address</label>
        <Input
          id="address"
          name="address"
          defaultValue={defaultValues?.address ?? ""}
        />
      </div>

      <div>
        <label htmlFor="leadSource">Lead source</label>
        <Select
          id="leadSource"
          name="leadSource"
          defaultValue={defaultValues?.leadSource ?? ""}
        >
          <option value="">—</option>
          {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label htmlFor="preferredContactMethod">Preferred contact method</label>
        <Select
          id="preferredContactMethod"
          name="preferredContactMethod"
          defaultValue={defaultValues?.preferredContactMethod ?? ""}
        >
          <option value="">—</option>
          {Object.entries(PREFERRED_CONTACT_METHOD_LABELS).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </Select>
      </div>

      <div>
        <label htmlFor="lastContactDate">Last contact date</label>
        <Input
          id="lastContactDate"
          name="lastContactDate"
          type="date"
          defaultValue={
            defaultValues?.lastContactDate
              ? new Date(defaultValues.lastContactDate).toISOString().slice(0, 10)
              : ""
          }
        />
        <p className="text-xs text-ink-muted mt-1">
          Defaults to today when you first create a contact — edit it
          manually any time to keep it accurate.
        </p>
      </div>

      <div>
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={defaultValues?.notes ?? ""}
          rows={4}
          className="form-control form-control-textarea"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit">{submitLabel}</Button>
        {cancelHref && (
          <Button asChild variant="ghost">
            <Link href={cancelHref}>Discard changes</Link>
          </Button>
        )}
      </div>
    </form>
  );
}

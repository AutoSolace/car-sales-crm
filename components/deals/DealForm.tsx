import Link from "next/link";
import type { Deal, AdditionalProduct } from "@prisma/client";
import { DEAL_STAGE_LABELS, OUTCOME_LABELS } from "@/lib/types";
import VehicleFields from "./VehicleFields";
import AdditionalProductsFieldArray from "./AdditionalProductsFieldArray";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DealForm({
  action,
  contactId,
  defaultValues,
  defaultAdditionalProducts,
  submitLabel = "Save deal",
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  contactId: string;
  defaultValues?: Partial<Deal>;
  defaultAdditionalProducts?: Pick<AdditionalProduct, "type" | "value">[];
  submitLabel?: string;
  cancelHref?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-6 max-w-2xl">
      <input type="hidden" name="contactId" value={contactId} />

      <div>
        <label htmlFor="stage">Stage</label>
        <Select
          id="stage"
          name="stage"
          defaultValue={defaultValues?.stage ?? "LEAD"}
        >
          {Object.entries(DEAL_STAGE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="findCarOutcome">Find Car outcome</label>
          <Select
            id="findCarOutcome"
            name="findCarOutcome"
            defaultValue={defaultValues?.findCarOutcome ?? "PENDING"}
          >
            {Object.entries(OUTCOME_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="proposalAcceptedOutcome">
            Proposal Accepted outcome
          </label>
          <Select
            id="proposalAcceptedOutcome"
            name="proposalAcceptedOutcome"
            defaultValue={defaultValues?.proposalAcceptedOutcome ?? "PENDING"}
          >
            {Object.entries(OUTCOME_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="completedLostOutcome">Completed/Lost outcome</label>
          <Select
            id="completedLostOutcome"
            name="completedLostOutcome"
            defaultValue={defaultValues?.completedLostOutcome ?? "PENDING"}
          >
            {Object.entries(OUTCOME_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-xl">
        <div>
          <label htmlFor="commissionReceived">Commission received (£)</label>
          <Input
            id="commissionReceived"
            name="commissionReceived"
            type="number"
            step="0.01"
            defaultValue={
              defaultValues?.commissionReceived
                ? String(defaultValues.commissionReceived)
                : ""
            }
            placeholder="Left blank until deal completes"
          />
        </div>
        <div>
          <label htmlFor="commissionPercent">Comm %</label>
          <Input
            id="commissionPercent"
            name="commissionPercent"
            type="number"
            step="0.01"
            defaultValue={
              defaultValues?.commissionPercent
                ? String(defaultValues.commissionPercent)
                : ""
            }
          />
        </div>
        <div>
          <label htmlFor="lender">Lender</label>
          <Input
            id="lender"
            name="lender"
            defaultValue={defaultValues?.lender ?? ""}
          />
        </div>
      </div>

      <VehicleFields defaultValues={defaultValues} />

      <div>
        <label>Additional products</label>
        <AdditionalProductsFieldArray
          defaultValues={defaultAdditionalProducts}
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

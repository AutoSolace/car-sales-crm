import type { NextActionCategory } from "@prisma/client";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NEXT_ACTION_CATEGORY_LABELS } from "@/lib/types";
import {
  setNextActionAction,
  completeNextActionAction,
} from "@/lib/next-actions/actions";

type Deal = {
  id: string;
  nextActionCategory: NextActionCategory | null;
  nextActionDescription: string | null;
  nextActionDueAt: Date | null;
};

// datetime-local inputs need "YYYY-MM-DDTHH:mm" — this trims the seconds
// and trailing "Z" off a full ISO string, same pattern ContactForm uses for
// its date-only `lastContactDate` field (.slice(0, 10)), just one input
// type further.
function toDatetimeLocalValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function NextAction({ deal }: { deal: Deal }) {
  const hasActive = Boolean(deal.nextActionDueAt);
  const overdue = hasActive && deal.nextActionDueAt! < new Date();
  const setAction = setNextActionAction.bind(null, deal.id);
  const completeAction = completeNextActionAction.bind(null, deal.id);

  return (
    <div>
      <h2 className="mb-2">Next action</h2>

      {hasActive && (
        <div className="rounded-lg border border-hairline p-3 mb-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge tone="accent">
              {NEXT_ACTION_CATEGORY_LABELS[deal.nextActionCategory!]}
            </Badge>
            <span className="text-sm">
              {deal.nextActionDueAt!.toLocaleString()}
            </span>
            {overdue && <Badge tone="signal">Overdue</Badge>}
          </div>
          <p className="text-sm">{deal.nextActionDescription}</p>
          <form action={completeAction}>
            <Button type="submit" size="sm">
              Mark done
            </Button>
          </form>
        </div>
      )}

      <form action={setAction} className="flex flex-col gap-3 max-w-md">
        <div className="max-w-[160px]">
          <label htmlFor="next-action-category">Type</label>
          <Select
            id="next-action-category"
            name="category"
            defaultValue={deal.nextActionCategory ?? "CALL"}
          >
            {Object.entries(NEXT_ACTION_CATEGORY_LABELS).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </Select>
        </div>
        <div>
          <label htmlFor="next-action-description">Description *</label>
          <Input
            id="next-action-description"
            name="description"
            required
            defaultValue={deal.nextActionDescription ?? ""}
            placeholder="What needs doing?"
          />
        </div>
        <div>
          <label htmlFor="next-action-due">Due date/time *</label>
          <Input
            id="next-action-due"
            name="dueAt"
            type="datetime-local"
            required
            defaultValue={
              deal.nextActionDueAt
                ? toDatetimeLocalValue(deal.nextActionDueAt)
                : ""
            }
          />
        </div>
        <div>
          <Button type="submit" size="sm" variant={hasActive ? "secondary" : "primary"}>
            {hasActive ? "Update next action" : "Set next action"}
          </Button>
        </div>
      </form>
    </div>
  );
}

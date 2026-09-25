import Link from "next/link";
import type { NextActionKind } from "@prisma/client";
import { listPendingNextActions } from "@/lib/next-actions/service";
import { completeNextActionAction } from "@/lib/next-actions/actions";
import {
  DEAL_STAGE_LABELS,
  NEXT_ACTION_CATEGORY_LABELS,
  NEXT_ACTION_KIND_LABELS,
} from "@/lib/types";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// "signal" (amber) is already used for the Overdue badge shown alongside
// this one, so Stalled uses "danger" (red) instead to stay visually
// distinct when both appear together.
const KIND_TONE: Record<NextActionKind, BadgeProps["tone"]> = {
  REGULAR: "neutral",
  RECONNECT: "accent",
  STALLED: "danger",
};

export default async function TodosPage() {
  const items = await listPendingNextActions();

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-hairline pb-6">
        <h1>To-do</h1>
      </div>

      {items.length === 0 ? (
        <p className="text-ink-muted">No pending next actions.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left border-b border-hairline">
              <th className="py-2 pr-4">Contact</th>
              <th className="py-2 pr-4">Deal stage</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Due</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const overdue = item.nextActionDueAt! < new Date();
              const completeAction = completeNextActionAction.bind(
                null,
                item.id
              );
              return (
                <tr
                  key={item.id}
                  className="border-b border-hairline hover:bg-surface"
                >
                  <td className="py-2 pr-4">
                    <Link
                      href={`/deals/${item.id}`}
                      className="hover:underline"
                    >
                      {item.contact.firstName} {item.contact.lastName ?? ""}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">
                    {DEAL_STAGE_LABELS[item.stage]}
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <Badge tone="accent">
                        {NEXT_ACTION_CATEGORY_LABELS[item.nextActionCategory!]}
                      </Badge>
                      {item.nextActionKind && item.nextActionKind !== "REGULAR" && (
                        <Badge tone={KIND_TONE[item.nextActionKind]}>
                          {NEXT_ACTION_KIND_LABELS[item.nextActionKind]}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-4">
                    {item.nextActionDueAt!.toLocaleString()}
                    {overdue && (
                      <Badge tone="signal" className="ml-2">
                        Overdue
                      </Badge>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <form action={completeAction}>
                      <Button type="submit" variant="secondary" size="sm">
                        Mark done
                      </Button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

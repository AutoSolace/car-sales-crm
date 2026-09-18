"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type OutcomeStage = "PROPOSAL_ACCEPTED" | "COMPLETED_LOST";

const COPY: Record<
  OutcomeStage,
  { title: string; description: string; yesLabel: string; noLabel: string; showCommission: boolean }
> = {
  PROPOSAL_ACCEPTED: {
    title: "Proposal accepted?",
    description: "Did the customer accept the proposal?",
    yesLabel: "Accepted",
    noLabel: "Rejected",
    showCommission: false,
  },
  COMPLETED_LOST: {
    title: "Complete this deal",
    description: "Was it won or lost?",
    yesLabel: "Won",
    noLabel: "Lost",
    showCommission: true,
  },
};

export default function OutcomeDialog({
  open,
  stage,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  stage: OutcomeStage;
  onCancel: () => void;
  onConfirm: (outcome: "YES" | "NO", commissionReceived: string) => void;
}) {
  const [outcome, setOutcome] = useState<"YES" | "NO" | "">("");
  const [commissionReceived, setCommissionReceived] = useState("");
  const copy = COPY[stage];

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      onCancel();
      setOutcome("");
      setCommissionReceived("");
    }
  }

  function handleConfirm() {
    if (!outcome) return;
    onConfirm(outcome, commissionReceived);
    setOutcome("");
    setCommissionReceived("");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={outcome === "YES" ? "primary" : "secondary"}
            onClick={() => setOutcome("YES")}
          >
            {copy.yesLabel}
          </Button>
          <Button
            type="button"
            variant={outcome === "NO" ? "danger" : "secondary"}
            onClick={() => setOutcome("NO")}
          >
            {copy.noLabel}
          </Button>
        </div>

        {copy.showCommission && outcome === "YES" && (
          <div>
            <label htmlFor="board-commission">Commission received (£)</label>
            <Input
              id="board-commission"
              type="number"
              step="0.01"
              value={commissionReceived}
              onChange={(e) => setCommissionReceived(e.target.value)}
              placeholder="Optional — can also be added later"
            />
          </div>
        )}

        <DialogFooter>
          <Button type="button" disabled={!outcome} onClick={handleConfirm}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

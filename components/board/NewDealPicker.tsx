"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export type PickableContact = {
  id: string;
  firstName: string;
  lastName: string | null;
};

export default function NewDealPicker({
  contacts,
}: {
  contacts: PickableContact[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState("");

  const sorted = [...contacts].sort((a, b) => {
    const nameA = `${a.lastName ?? ""} ${a.firstName}`.trim();
    const nameB = `${b.lastName ?? ""} ${b.firstName}`.trim();
    return nameA.localeCompare(nameB);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">New deal</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>New deal</DialogTitle>
          <DialogDescription>
            Choose which contact this deal is for.
          </DialogDescription>
        </DialogHeader>
        <Select
          aria-label="Choose a contact"
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
        >
          <option value="">Choose a contact…</option>
          {sorted.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName ?? ""}
            </option>
          ))}
        </Select>
        <DialogFooter>
          <Button
            type="button"
            disabled={!contactId}
            onClick={() => router.push(`/deals/new?contactId=${contactId}`)}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import type { ActivityLogType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { ACTIVITY_LOG_TYPE_LABELS } from "@/lib/types";
import {
  updateActivityLogAction,
  deleteActivityLogAction,
} from "@/lib/activity-log/actions";

const TYPE_TONE: Record<ActivityLogType, BadgeProps["tone"]> = {
  STAGE_CHANGE: "accent",
  CALL: "neutral",
  NOTE: "muted",
  REMINDER_SENT: "signal",
  NEXT_ACTION_COMPLETED: "success",
};

type Entry = {
  id: string;
  type: ActivityLogType;
  note: string;
  createdAt: Date;
  updatedAt: Date;
};

export default function ActivityLogItem({
  entry,
  dealId,
}: {
  entry: Entry;
  dealId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(entry.note);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!note.trim()) return;
    setSaving(true);
    await updateActivityLogAction(entry.id, dealId, note);
    setSaving(false);
    setIsEditing(false);
  }

  function handleCancel() {
    setNote(entry.note);
    setIsEditing(false);
  }

  const deleteAction = deleteActivityLogAction.bind(null, entry.id, dealId);
  const wasEdited = entry.updatedAt.getTime() !== entry.createdAt.getTime();

  return (
    <div className="rounded-lg border border-hairline p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge tone={TYPE_TONE[entry.type]}>
            {ACTIVITY_LOG_TYPE_LABELS[entry.type]}
          </Badge>
          <span className="text-ink-muted text-sm">
            {entry.createdAt.toLocaleString()}
          </span>
          {wasEdited && (
            <span className="text-ink-muted text-sm">(edited)</span>
          )}
        </div>
        {!isEditing && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
            <form action={deleteAction}>
              <Button type="submit" variant="ghost" size="sm">
                Delete
              </Button>
            </form>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="form-control form-control-textarea"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={saving || !note.trim()}
              onClick={handleSave}
            >
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm">{entry.note}</p>
      )}
    </div>
  );
}

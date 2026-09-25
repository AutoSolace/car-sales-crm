import { listActivityLogs } from "@/lib/activity-log/service";
import { createActivityLogAction } from "@/lib/activity-log/actions";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ActivityLogItem from "./ActivityLogItem";

export default async function ActivityLog({ dealId }: { dealId: string }) {
  const entries = await listActivityLogs(dealId);
  const addAction = createActivityLogAction.bind(null, dealId);

  return (
    <div>
      <h2 className="mb-2">Activity log</h2>

      <form action={addAction} className="flex flex-col gap-3 mb-6">
        <div className="max-w-[160px]">
          <label htmlFor="log-type">Type</label>
          <Select id="log-type" name="type" defaultValue="CALL">
            <option value="CALL">Call</option>
            <option value="NOTE">Note</option>
          </Select>
        </div>
        <div>
          <label htmlFor="log-note">Note</label>
          <textarea
            id="log-note"
            name="note"
            rows={3}
            required
            placeholder="What happened?"
            className="form-control form-control-textarea"
          />
        </div>
        <div>
          <Button type="submit" size="sm">
            Add entry
          </Button>
        </div>
      </form>

      {entries.length === 0 ? (
        <p className="text-ink-muted text-sm">No activity yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <ActivityLogItem entry={entry} dealId={dealId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

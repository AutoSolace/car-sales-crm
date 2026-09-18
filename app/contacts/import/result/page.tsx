import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RowOutcome {
  row: number;
  data: string;
  outcome: string;
  reason: string;
}

interface ImportReport {
  imported: number;
  merged: number;
  skippedDuplicate: number;
  skippedMissingName: number;
  warnings: number;
  total: number;
  outcomes: RowOutcome[];
}

export default async function ImportResultPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionId } = await searchParams;
  if (!sessionId) notFound();

  const session = await prisma.importSession.findUnique({
    where: { id: sessionId },
  });
  if (!session || !session.reportJson) notFound();

  const report: ImportReport = JSON.parse(session.reportJson);

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-hairline pb-6">
        <h1>Import complete</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
        <Stat label="Imported" value={report.imported} />
        <Stat label="Merged" value={report.merged} />
        <Stat label="Skipped (duplicate)" value={report.skippedDuplicate} />
        <Stat label="Skipped (missing name)" value={report.skippedMissingName} />
        <Stat label="Warnings" value={report.warnings} />
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left border-b border-hairline">
            <th className="py-2 pr-4">Row</th>
            <th className="py-2 pr-4">Data</th>
            <th className="py-2 pr-4">Outcome</th>
            <th className="py-2 pr-4">Reason</th>
          </tr>
        </thead>
        <tbody>
          {report.outcomes.map((o) => (
            <tr key={o.row} className="border-b border-hairline">
              <td className="py-2 pr-4">{o.row}</td>
              <td className="py-2 pr-4 max-w-xs truncate" title={o.data}>
                {o.data}
              </td>
              <td className="py-2 pr-4">
                <Badge tone={o.outcome.startsWith("Skipped") ? "muted" : "accent"}>
                  {o.outcome}
                </Badge>
              </td>
              <td className="py-2 pr-4">{o.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Button asChild className="self-start">
        <Link href="/contacts">Go to contacts</Link>
      </Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-hairline rounded-md px-3 py-2">
      <div className="text-ink-muted text-xs">{label}</div>
      <div className="text-lg font-semibold text-ink-display">{value}</div>
    </div>
  );
}

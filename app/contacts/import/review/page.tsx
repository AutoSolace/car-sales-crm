import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { buildCandidate, type ImportMapping } from "@/lib/import/candidate";
import { findDuplicateMatch } from "@/lib/import/duplicateDetection";
import { commitImportAction } from "@/lib/import/runImport";
import { Radio } from "@/components/ui/radio";
import { Button } from "@/components/ui/button";

export default async function ImportReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionId } = await searchParams;
  if (!sessionId) notFound();

  const session = await prisma.importSession.findUnique({
    where: { id: sessionId },
  });
  if (!session || !session.mappingJson) notFound();

  const rows: string[][] = JSON.parse(session.rawDataJson);
  const mapping: ImportMapping = JSON.parse(session.mappingJson);
  const existingContacts = await prisma.contact.findMany();

  const flagged: {
    rowIndex: number;
    candidateName: string;
    duplicateName: string;
  }[] = [];
  let missingCount = 0;
  let readyCount = 0;

  rows.forEach((row, i) => {
    const candidate = buildCandidate(row, mapping);
    if (!candidate.firstName) {
      missingCount++;
      return;
    }
    const duplicate = findDuplicateMatch(candidate, existingContacts);
    if (duplicate) {
      flagged.push({
        rowIndex: i,
        candidateName: `${candidate.firstName} ${candidate.lastName}`.trim(),
        duplicateName: `${duplicate.firstName} ${duplicate.lastName ?? ""}`.trim(),
      });
    } else {
      readyCount++;
    }
  });

  const action = commitImportAction.bind(null, sessionId);

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-hairline pb-6">
        <h1>Review before import</h1>
        <p className="mt-1">
          {readyCount} contact{readyCount === 1 ? "" : "s"} ready to import,{" "}
          {flagged.length} possible duplicate{flagged.length === 1 ? "" : "s"}{" "}
          need a decision, {missingCount} will be skipped for missing first
          name.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-6">
        {flagged.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2>Possible duplicates</h2>
            {flagged.map((f) => (
              <div key={f.rowIndex} className="callout flex flex-col gap-2">
                <p>
                  CSV row <strong>{f.candidateName}</strong> looks like it
                  matches existing contact <strong>{f.duplicateName}</strong>.
                </p>
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-1 font-normal text-ink-body">
                    <Radio
                      name={`resolution_${f.rowIndex}`}
                      value="skip"
                      defaultChecked
                    />
                    Skip
                  </label>
                  <label className="flex items-center gap-1 font-normal text-ink-body">
                    <Radio name={`resolution_${f.rowIndex}`} value="merge" />
                    Merge (fill blanks only)
                  </label>
                  <label className="flex items-center gap-1 font-normal text-ink-body">
                    <Radio name={`resolution_${f.rowIndex}`} value="import" />
                    Import as new
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button type="submit" className="self-start">
          Complete import
        </Button>
      </form>
    </div>
  );
}

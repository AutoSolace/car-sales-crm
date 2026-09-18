import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { saveMappingAction } from "@/lib/import/runImport";
import { CONTACT_IMPORT_FIELD_LABELS, CONTACT_IMPORT_FIELDS } from "@/lib/types";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default async function ImportMappingPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; error?: string }>;
}) {
  const { session: sessionId, error } = await searchParams;
  if (!sessionId) notFound();

  const session = await prisma.importSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) notFound();

  const headers: string[] = JSON.parse(session.headers);
  const action = saveMappingAction.bind(null, sessionId);

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-hairline pb-6">
        <h1>Map columns</h1>
        <p className="mt-1">
          Match each column from &quot;{session.filename}&quot; to a contact
          field, or leave it as Ignore. Nothing is pre-filled — choose every
          mapping yourself.
        </p>
      </div>

      {error && (
        <div className="callout callout-danger">
          <p className="text-danger-display">{error}</p>
        </div>
      )}

      <form action={action} className="flex flex-col gap-3 max-w-xl">
        {headers.map((header, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-48 text-sm font-medium truncate">{header}</div>
            <Select name={`map_${i}`} defaultValue="" className="flex-1">
              <option value="">Ignore</option>
              {CONTACT_IMPORT_FIELDS.map((field) => (
                <option key={field} value={field}>
                  {CONTACT_IMPORT_FIELD_LABELS[field]}
                </option>
              ))}
            </Select>
          </div>
        ))}

        <Button type="submit" className="self-start mt-2">
          Next: review duplicates
        </Button>
      </form>
    </div>
  );
}

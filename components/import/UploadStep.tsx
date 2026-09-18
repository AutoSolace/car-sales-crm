"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function UploadStep() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        setLoading(false);
        return;
      }
      router.push(`/contacts/import/mapping?session=${data.sessionId}`);
    } catch {
      setError("Upload failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <div>
        <label htmlFor="file">CSV file</label>
        <Input id="file" name="file" type="file" accept=".csv,text/csv" />
        <p className="text-xs text-ink-muted mt-1">
          Your file should have a header row. You&apos;ll map columns to
          contact fields on the next step.
        </p>
      </div>

      {error && (
        <div className="callout callout-danger">
          <p className="text-danger-display">{error}</p>
        </div>
      )}

      <Button type="submit" disabled={loading} className="self-start">
        {loading ? "Uploading…" : "Upload"}
      </Button>
    </form>
  );
}

import UploadStep from "@/components/import/UploadStep";

export default function ImportUploadPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-hairline pb-6">
        <h1>Import contacts from CSV</h1>
      </div>
      <UploadStep />
    </div>
  );
}

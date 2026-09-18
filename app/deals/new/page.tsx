import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import DealForm from "@/components/deals/DealForm";
import { createDealAction } from "@/lib/deals/actions";

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ contactId?: string }>;
}) {
  const { contactId } = await searchParams;
  if (!contactId) notFound();

  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-hairline pb-6">
        <h1>New deal for {contact.firstName} {contact.lastName ?? ""}</h1>
      </div>
      <DealForm
        action={createDealAction}
        contactId={contact.id}
        submitLabel="Create deal"
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import ContactForm from "@/components/contacts/ContactForm";
import { updateContactAction } from "@/lib/contacts/actions";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ contactId: string }>;
}) {
  const { contactId } = await params;
  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) notFound();

  const action = updateContactAction.bind(null, contact.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-hairline pb-6">
        <h1>
          Edit {contact.firstName} {contact.lastName ?? ""}
        </h1>
      </div>
      <ContactForm
        action={action}
        defaultValues={contact}
        submitLabel="Save changes"
        cancelHref={`/contacts/${contact.id}`}
      />
    </div>
  );
}

import ContactForm from "@/components/contacts/ContactForm";
import { createContactAction } from "@/lib/contacts/actions";

export default function NewContactPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-hairline pb-6">
        <h1>New contact</h1>
      </div>
      <ContactForm action={createContactAction} submitLabel="Create contact" />
    </div>
  );
}

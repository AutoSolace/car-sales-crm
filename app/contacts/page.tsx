import Link from "next/link";
import { listContacts } from "@/lib/contacts/service";
import ContactsFilter from "@/components/contacts/ContactsFilter";
import { Button } from "@/components/ui/button";

export default async function ContactsPage() {
  const contacts = await listContacts();

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-hairline pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1>Contacts</h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/contacts/import">Import CSV</Link>
            </Button>
            <Button asChild>
              <Link href="/contacts/new">New contact</Link>
            </Button>
          </div>
        </div>
      </div>

      <ContactsFilter contacts={contacts} />
    </div>
  );
}

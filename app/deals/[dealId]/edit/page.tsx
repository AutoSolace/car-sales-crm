import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deals/service";
import DealForm from "@/components/deals/DealForm";
import { updateDealAction } from "@/lib/deals/actions";

export default async function EditDealPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  const deal = await getDeal(dealId);
  if (!deal) notFound();

  const action = updateDealAction.bind(null, deal.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-hairline pb-6">
        <h1>Edit deal</h1>
      </div>
      <DealForm
        action={action}
        contactId={deal.contactId}
        defaultValues={deal}
        defaultAdditionalProducts={deal.additionalProducts}
        submitLabel="Save changes"
        cancelHref={`/deals/${deal.id}`}
      />
    </div>
  );
}

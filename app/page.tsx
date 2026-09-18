import { listBoardDeals } from "@/lib/deals/service";
import { listContacts } from "@/lib/contacts/service";
import Board from "@/components/board/Board";
import NewDealPicker from "@/components/board/NewDealPicker";

export default async function Home() {
  const [deals, contacts] = await Promise.all([
    listBoardDeals(),
    listContacts(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-hairline pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1>Pipeline</h1>
          <NewDealPicker contacts={contacts} />
        </div>
      </div>
      <Board initialDeals={deals} />
    </div>
  );
}

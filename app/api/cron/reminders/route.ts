import { NextResponse } from "next/server";
import {
  previewDueReminders,
  sendDueReminders,
} from "@/lib/reminders/service";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";

  if (dryRun) {
    const wouldSend = await previewDueReminders();
    return NextResponse.json({ dryRun: true, wouldSend });
  }

  const result = await sendDueReminders();
  return NextResponse.json({ dryRun: false, ...result });
}

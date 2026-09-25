import { NextResponse } from "next/server";
import {
  previewDueReminders,
  sendDueReminders,
} from "@/lib/reminders/service";
import {
  previewAutomationSweep,
  runAutomationSweep,
} from "@/lib/scheduler/service";

/**
 * One cron trigger does the whole periodic CRM chore list (M6, then M5):
 * first make sure anything newly due for reconnect/stalled automation gets
 * scheduled onto a deal's next-action slot, then send email reminders for
 * anything now due — including anything the scheduling step above just
 * created.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";

  if (dryRun) {
    const wouldSchedule = await previewAutomationSweep();
    const wouldSend = await previewDueReminders();
    return NextResponse.json({ dryRun: true, wouldSchedule, wouldSend });
  }

  const scheduled = await runAutomationSweep();
  const result = await sendDueReminders();
  return NextResponse.json({ dryRun: false, scheduled, ...result });
}

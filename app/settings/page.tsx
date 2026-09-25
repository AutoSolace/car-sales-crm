import Link from "next/link";
import { LogOut, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import { isAuthEnabled } from "@/lib/auth/session";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-hairline pb-6">
        <h1>Settings</h1>
      </div>

      <ul className="divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-page">
        <li>
          <Link
            href="/admin/design-system"
            className="flex items-center gap-3 px-4 py-3 hover:bg-surface no-underline"
          >
            <Palette className="h-4 w-4 text-ink-muted" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink-display">
                Design system
              </div>
              <div className="truncate text-xs text-ink-muted">
                Colors, typography, and components used to customize the app&apos;s look
              </div>
            </div>
          </Link>
        </li>
      </ul>

      {isAuthEnabled() && (
        <form action={logoutAction}>
          <Button type="submit" variant="secondary">
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </form>
      )}
    </div>
  );
}

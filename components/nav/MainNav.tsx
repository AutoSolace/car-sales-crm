"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NavSearch } from "@/components/nav/NavSearch";
import {
  ChevronsLeft,
  ChevronsRight,
  Kanban,
  ListChecks,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "car-crm-main-nav-open";

type ContactOption = {
  id: string;
  firstName: string;
  lastName: string | null;
};

const NAV_ITEMS = [
  { href: "/", icon: Kanban, label: "Pipeline" },
  { href: "/contacts", icon: Users, label: "Contacts" },
  { href: "/todos", icon: ListChecks, label: "To-do" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function useMainNavOpen() {
  const [open, setOpen] = React.useState(true);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // localStorage can't be read during SSR without a hydration mismatch,
    // so re-syncing from it here (mount-only) is the correct pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored !== null) setOpen(stored === "true");
  }, []);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, String(open));
  }, [open]);
  return [open, setOpen] as const;
}

export function MainNav({ contacts = [] }: { contacts?: ContactOption[] }) {
  const [open, setOpen] = useMainNavOpen();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      {/* Desktop rail — hidden below lg */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-hairline bg-page transition-[width] duration-200 lg:flex",
          open ? "w-56" : "w-14",
        )}
      >
        <RailBody open={open} onToggle={() => setOpen(!open)} contacts={contacts} />
      </aside>

      {/* Mobile drawer — slides in from the left, dismisses on overlay click */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-display/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-page shadow-xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-hairline px-4">
              <span className="font-display text-sm font-semibold text-ink-display">
                AutoSolace CRM
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-ink-display"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavSearch contacts={contacts} onNavigate={() => setMobileOpen(false)} />
            <RailNav open onClose={() => setMobileOpen(false)} />
            <div className="border-t border-hairline p-2">
              <ThemeToggle block />
            </div>
          </aside>
        </div>
      )}

      {/* Mobile hamburger — fixed to the top-right corner of the viewport */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed right-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-page text-ink-body hover:bg-surface lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>
    </>
  );
}

function RailBody({
  open,
  onToggle,
  contacts,
}: {
  open: boolean;
  onToggle: () => void;
  contacts: ContactOption[];
}) {
  return (
    <>
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-3 border-b border-hairline px-3",
          open ? "justify-between" : "justify-center",
        )}
      >
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-ink-display no-underline"
          aria-label="Home"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-faded font-display text-sm font-semibold text-accent">
            A
          </span>
          {open && (
            <span className="truncate font-display text-sm font-semibold">
              AutoSolace CRM
            </span>
          )}
        </Link>
        {open && (
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-ink-display"
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && <NavSearch contacts={contacts} />}

      <RailNav open={open} />

      {!open && (
        <div className="border-t border-hairline p-2">
          <button
            type="button"
            onClick={onToggle}
            className="flex h-9 w-full items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-ink-display"
            aria-label="Expand sidebar"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className={cn("border-t border-hairline p-2", !open && "flex justify-center")}>
        <ThemeToggle block={open} />
      </div>
    </>
  );
}

function RailNav({ open, onClose }: { open: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  return (
    <nav
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-1 p-2 text-sm",
        open ? "overflow-x-hidden overflow-y-auto" : "overflow-visible",
      )}
    >
      {NAV_ITEMS.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={item.label}
          active={isActive(pathname, item.href)}
          open={open}
          onClick={onClose}
        />
      ))}
    </nav>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  open,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  open: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="group/nav-item relative">
      <Link
        href={href}
        onClick={onClick}
        aria-label={open ? undefined : label}
        className={cn(
          "flex items-center gap-3 rounded-md no-underline",
          open ? "px-3 py-2" : "mx-auto h-9 w-9 justify-center",
          active
            ? "bg-accent-faded text-accent-display"
            : "text-ink-body hover:bg-surface hover:text-ink-display",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {open && <span className="truncate">{label}</span>}
      </Link>
      {!open && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-[13px] -translate-y-1/2 whitespace-nowrap rounded-md border border-hairline bg-page px-2 py-1 text-xs font-medium text-ink-display opacity-0 shadow-sm transition-opacity group-hover/nav-item:opacity-100"
        >
          {label}
        </span>
      )}
    </div>
  );
}

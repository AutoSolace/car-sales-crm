# Build milestones — status & handoff

This file tracks progress through the 7 build milestones defined in the PRD, and carries the context a fresh agent/session needs to pick up the next one. Update it at the end of every milestone before handing off.

PRD (source of truth for all requirements): https://claude.ai/artifact/LTuEeRQB98MZmAWyosVLsz

## Stack (decided, don't re-litigate without asking the user)

- **Next.js 16** (App Router, TypeScript) — scaffolded via `create-next-app`, Tailwind v4
- **Prisma 6.19.3 + SQLite** — pinned deliberately, see "Gotchas" below before upgrading
- **Next.js Server Actions** for all mutations (not REST API routes) — business logic lives in a separate `service.ts` layer per domain so a REST API can be bolted on later without rewriting logic
- **Deploy target: Railway**, connected to GitHub repo `AutoSolace/car-sales-crm` (branch `main`) — needed for a persistent disk (SQLite) and native cron (future milestones' reminders). Not deployed yet — still local-only as of this writing.
- **App name: "AutoSolace CRM"** (renamed from "Car Sales CRM") — shows in the page title and the sidebar nav brand
- **Design system**: scaffolded via the `bm-design-system` skill, see its own section below — this is now a hard constraint on all UI work, not optional
- **Email (M5, not built yet)**: Gmail/Google Workspace SMTP

## Milestone status

- [x] **M1 — Contacts & deals foundation** (req 01, 02, 03, 14) — **DONE**, built, verified live, and substantially extended beyond the original scope (see below)
- [x] **M2 — Kanban pipeline** (req 04, 05, 12) — **DONE**, built, verified live, extended with sort/status/date-range filters and a reporting summary
- [ ] **M3 — Deal activity log** (req 06) — next up
- [ ] **M4 — Next actions & to-do list** (req 07, 11)
- [ ] **M5 — Email reminders** (req 08)
- [ ] **M6 — Reconnect & stalled-deal automation** (req 09, 10)
- [ ] **M7 — Contact search** (req 13)

---

## M1 — what was built

Full CRUD for contacts and deals, CSV contact import, a design system, a recontact automation layer, and various UX refinements requested after the initial build. No Kanban board yet — deal stage/outcome are set via a plain dropdown on the deal edit form.

### Core CRUD (original M1 scope)

**Files:**
- `prisma/schema.prisma` — full data model, including fields M2+ will need (`Deal.stage`, `findCarOutcome`, `proposalAcceptedOutcome`, `completedLostOutcome`, all already present)
- `lib/types.ts` — shared enum → label maps (reuse these for the board's column headers and outcome colours, don't redefine)
- `lib/contacts/*`, `lib/deals/*` — validation (zod), service (business logic + Prisma calls), actions (`"use server"` wrappers around FormData)
- `lib/import/*` — CSV import: parsing (PapaParse), duplicate detection (exact match on email/full name), the multi-step wizard's server actions
- `app/contacts/*`, `app/deals/*` — pages (list/detail/new/edit for both, plus the 4-step import wizard)
- `components/contacts/*`, `components/deals/*`, `components/import/*`

**Verified working** (live, both via curl simulating real form POSTs — including React's bound-server-action encoding — and direct DB checks):
- Contact create (minimal + full), edit, delete, list with live client-side search + sort (name/last-contact-date/lead-source)
- Deal create/edit across all stages, Find Car/Proposal Accepted outcomes, Final car structured fields, new/used toggle, multiple additional products, commission, lender (free text)
- `completedAt`/`lostAt` auto-stamp once on first transition to that outcome and stay fixed on later re-saves (`lib/deals/service.ts`)
- CSV import end-to-end: upload → blank-by-default column mapping → duplicate flagging (exact match only) → skip/merge/import-as-new resolution → commit → result report

### Design system (added after initial M1 build — now a hard constraint)

Scaffolded via the `bm-design-system` skill (`~/.claude/skills/bm-design-system`). Full writeup of what this involved is in the session transcript; the load-bearing facts for future work:

- **`AGENTS.md`/`CLAUDE.md` now carry mandatory rules**: always check `/admin/design-system` and reuse `components/ui/*` primitives before writing new markup; never apply Tailwind text-sizing/color utilities to bare semantic elements (`<h1>`, `<label>`, etc. — they're already styled by the base layer); propose new primitives rather than one-off styling. **Read that block before building M2's board UI.**
- Primitives available: `Button`, `Input`, `Select`, `Radio`, `Checkbox`, `Badge`, `Dialog`, `DropdownMenu`, `RichTextField`, `DataTable`/`DataRow`, `ThemeToggle` — all in `components/ui/`.
- Tokens (in `app/design-system.css`, a Tailwind v4 `@theme` block): `bg-page`, `bg-surface`, `border-hairline`, `text-ink-body`/`text-ink-display`/`text-ink-muted`, `bg-accent`/`accent-faded`/`accent-display`, `bg-signal`/`signal-faded`/`signal-display`, `bg-danger`/`danger-faded`/`danger-display`. **`Badge` only has tones `neutral`/`accent`/`signal`/`muted`/`solid` — no true "danger" tone**, so red-ish signaling currently borrows `signal` (amber) or raw `text-danger`/`bg-danger-faded` classes directly.
- **App shell**: `components/nav/MainNav.tsx` — collapsible left sidebar (desktop) + slide-in drawer (mobile), replacing the original top-bar header. Nav items are hardcoded: Contacts, Settings. **M2 will likely want to add a nav item for the board** (or fold it into Contacts' navigation — not yet decided).
- **Page header pattern**: every page wraps its `<h1>` + actions in `<div className="border-b border-hairline pb-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">...</div></div>` — follow this for any new top-level page.
- `/settings` page exists (`app/settings/page.tsx`) as a simple listing page, currently linking only to the design system reference. No auth — this whole app is unauthenticated by deliberate decision (single-user tool, PRD non-goal).
- Known upstream quirk: the `bm-design-system` skill's own `SKILL.md` docs are out of sync with its actual shipped templates (documents a simpler 10-token flat-hex palette; the real files ship a richer 13-token oklch-based system with a `danger` family). We went with the real files, not the stale docs — don't be surprised if re-running the skill's docs disagree with what's actually in this repo.

### Recontact automation (added after initial M1 build — new PRD-adjacent feature, not in the original req list)

- `lib/automation.ts` — `AUTOMATION_START_DATE` (hardcoded to 2026-09-18, the day this went live) with `monthsSinceAnchor`/`isOverdue` helpers that clamp elapsed time to that start date, so historical/imported data never floods the UI with "overdue" flags the moment automation switches on. `contactNeedsRecontact(contact)` — 6 months since `Contact.lastContactDate`, skipped if the contact's most recent deal already completed (that relationship is meant to be owned by M6's post-sale reconnect schedule instead, once built).
- `Contact.lastContactDate` (schema field) — **only** auto-set to "now" when a contact is created manually through the app's own form (defaults there, but is editable); never touched just by viewing/opening a contact. Manually editable on the contact form at any time.
- `Contact.createdAt` — used normally by Prisma, but CSV import can now explicitly set it from a mapped "Created date" column (`CONTACT_IMPORT_FIELDS` in `lib/types.ts`), overriding the default `now()`. When set this way, `lastContactDate` is set to the *same* value (one CSV column drives both, since a bulk-imported historical contact's "last contact" is presumably that same original date). This value is permanent — never touched by merges onto existing contacts during re-import (deliberately excluded from the generic fill-blanks merge object in `lib/import/runImport.ts`).
- Contacts list shows a `Badge tone="signal"` "Needs recontact" flag per the above. Deals show a similar `Badge tone="signal"` "2+ years old" flag on the contact's deal-list rows, based on `isOverdue(deal.createdAt, 24)` — no stage restriction, applies to any deal regardless of outcome.
- **This whole feature is a scope addition the user asked for mid-M1, not part of the original PRD requirements (01–14).** If it needs documenting into the PRD proper at some point, that hasn't been done — the PRD artifact itself hasn't been updated to reflect it.

### Other post-initial-build changes

- `Deal.lender` — free-text field, shown next to Commission on the deal form and detail page.
- Contact/deal edit forms both have a "Discard changes" button (ghost-style, next to Save) that navigates back to the detail page without submitting — `cancelHref` prop on `ContactForm`/`DealForm`.
- Contacts list search is **client-side** (`components/contacts/ContactsFilter.tsx`, a client component holding the full contact list and filtering/sorting in-browser) — not server `?q=` params anymore. `/contacts` is a static page as a result.

**Not yet done:** deployment to Railway hasn't happened. (Git history: the repo started with a single "Initial commit" containing only the README/PRD link; everything else — the entire app through M1 and M2 — was committed in one follow-up commit once the user asked to "save the project" at the end of this session. Future work should go back to small, incremental commits rather than one big catch-up commit.)

## Gotchas for whoever builds M2+

- **This machine had no Node.js/npm initially.** Installed via `nvm` (`~/.nvm`). If you're a fresh session on the *same* machine, Node should now be present — if `node`/`npm` aren't on PATH, source nvm: `export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"`. A different machine/environment needs Node installed from scratch.
- **Prisma is pinned to 6.19.3, not latest.** `npm install prisma@latest` will pull an 8.x release candidate built around Prisma's own hosted platform (different product) with a totally different CLI. Prisma 7 (stable) also changed the config model to require driver adapters instead of a schema `url`. Don't upgrade without deliberately re-planning around whichever new config model is current.
- **Next.js 16 conventions**: `params` and `searchParams` in pages/layouts/route handlers are `Promise`s — always `await` them.
- **Design system compliance is enforced by `AGENTS.md`** — build with `components/ui/*` primitives and token classes, not raw Tailwind grays/blues. `Badge` now has a `danger` tone (added in M2); a `.card-tint-pending`/`.card-tint-won`/`.card-tint-lost` class set exists in `app/design-system.css` for full-card colour coding (as opposed to badges, which only tint part of a layout).
- **`@dnd-kit/core` (v6.3.1) is installed and in use** for the board's drag-and-drop — see `components/board/Board.tsx` for the `DndContext`/`DragOverlay` pattern. If a card ever needs to render twice simultaneously (e.g. a second overlay use case), remember `useDraggable` can't be called twice for the same id — `DealCard.tsx` splits a `DealCardBody` (pure render) from `DealCard` (draggable) and `DealCardOverlay` (presentation-only) for exactly this reason.
- **Prisma `Decimal` fields cannot cross the server→client component boundary.** `commissionReceived`, `finalPrice`, `deposit`, `commissionPercent`, and `AdditionalProduct.value` are all `Decimal`. Any query whose result gets passed into a `"use client"` component must either `select` around them or convert to `Number()`/`String()` first — see `lib/deals/service.ts`'s `listBoardDeals()`. This bit M2 for real: a first draft passed a raw `Deal` into `<Board>` and threw at runtime (`eslint`/`tsc`/`next build` all passed clean — this only surfaces when the page actually loads, so **always load the page after touching a server→client data path**, don't rely on static checks alone).
- **Server Actions use React's bound-action form encoding** (`$ACTION_REF_1` / `$ACTION_1:0` / `$ACTION_1:1` hidden fields for bound actions like `updateContactAction.bind(null, id)`) when testing via raw HTTP/curl instead of a browser. A non-bound action called directly from a client event handler (like `moveDealStageAction`, called from the board's drag handler, not a form) isn't practical to exercise this way — verify that kind of action's underlying logic directly (e.g. a one-off Node script calling the service function/reimplementing its logic against real DB rows) rather than trying to fake the client-side call over HTTP.
- **`.env.example` is deliberately un-ignored** via `!.env.example` in `.gitignore`.
- **No browser tool has been available in any session so far** — all UI verification has been done via curl against the dev server plus direct DB checks, not actual visual/interactive testing (dragging, clicking, etc.). Flag this limitation to the user when reporting on future milestones. Note the user *does* have their own browser open against the same dev server at times — real data from their own testing can show up in the DB (e.g. "James N"/"James S" contacts appeared mid-M2 from the user's own session) — always check what's in the DB before assuming it's all your own test data, and never bulk-delete without confirming scope with the user first.

## M2 — what was built

Full Kanban board at `/` (now the app's home page), plus scope the user asked for once the board's filter bar came up in conversation.

**Core board** (`components/board/*`, `lib/deals/service.ts`'s `listBoardDeals`/`canEnterStage`/`moveDealStage`, `lib/deals/actions.ts`'s `moveDealStageAction`):
- Six columns, drag forward/backward via `@dnd-kit/core` with `DragOverlay` (not source-node transform — avoids flicker and clipping by the column row's `overflow-x-auto`)
- Entering Proposal Submitted+ without a Final car set (`finalMake`) snaps the card back and shows an inline `callout callout-danger` message; optimistic local-state move + server-authoritative revert on rejection
- Full-card colour tint via `.card-tint-pending`/`-won`/`-lost` (grey/green/red), consistent for both "explicit PENDING outcome" and "stage has no outcome field" cases
- Column show/hide + outcome-colour filters (req 12), whole-board scope, `.toggle-button` pattern

**Extensions added mid-milestone** (not in the original req 04/05/12 text — flagged here so they don't get lost):
- Sort toggle: newest/oldest by `createdAt`
- Status quick-filter: All / Active / Proposal pending (`PROPOSAL_ACCEPTED` + outcome `PENDING`) / Won / Lost — independent of the stage/outcome filters, not a replacement
- Date-range filter (on `completedAt` for Won, `lostAt` for Lost) + a small reporting summary: total commission across filtered Won deals, count of filtered Lost deals. This is a narrow, deliberately-scoped reporting add-on — not the fuller "win rate by source" analytics the PRD defers to v2; worth keeping that boundary in mind if asked to extend it further.
- "New deal" button on the board (a contact picker, since the board has no single "current contact" context) and a per-card edit shortcut (pencil icon → `/deals/[id]/edit` directly) — both just link to the existing new/edit deal pages, no new creation/editing logic
- Two new `Deal` fields: `deposit` (Decimal, in the Final car section) and `commissionPercent` (Decimal, next to Commission received) — manually entered, no derived/calculated behavior

**Design system additions**: `Badge` gained a `danger` tone (`components/ui/badge.tsx` + `.badge-danger` in `design-system.css`). A genuine `success` token family (green, oklch hue 145 — `--color-success`/`-faded`/`-display`) was also added; `app/deals/[dealId]/page.tsx`'s `OUTCOME_TONE` map and the board's `.card-tint-won` now both use `success`/`danger` instead of `accent`/`signal`. **This fixed a real colour-correctness bug**: `card-tint-won` and `OUTCOME_TONE.YES` originally pointed at the `accent` token, which is cyan/teal in this palette, not green — so "Won" rendered pale cyan (and, in one regression, plain white) instead of green, directly contradicting PRD req 05. Confirmed via the user's own screenshot before the fix, then re-confirmed fixed. `card-tint-pending` uses `signal` (amber/orange), `card-tint-lost` uses `danger` (red) — so the board is now green/red/orange, not grey/red as originally scaffolded.

**Drag-out-resets-outcome + outcome popups** (`lib/deals/service.ts`'s `moveDealStage`/`setBoardOutcome`, `lib/deals/actions.ts`'s `setBoardOutcomeAction`, `components/board/OutcomeDialog.tsx`, wired into `components/board/Board.tsx`):
- Dragging a deal **out of** any of the three outcome-bearing stages (Find Car, Proposal Accepted, Completed/Lost) resets that stage's outcome field back to `PENDING`; leaving Completed/Lost also nulls `completedAt`/`lostAt` — symmetric with the existing forward-sync (`deriveStageFromOutcomes`) where setting an outcome on the form moves the deal into that stage. `commissionReceived` is left untouched by this reset (only the outcome/timestamp fields).
- Dragging a deal **into Proposal Accepted or Completed/Lost** no longer moves it immediately — `Board.tsx`'s `handleDragEnd` special-cases those two drop targets (`OUTCOME_PROMPT_STAGES`), holds the card in place, and opens `OutcomeDialog` via new `pendingOutcome` state (`{ dealId, stage }`). The dialog's copy is stage-specific (`COPY` map in `OutcomeDialog.tsx`): Proposal Accepted asks "Proposal accepted?" with Accepted/Rejected buttons and no commission field; Completed/Lost asks "Was it won or lost?" with Won/Lost buttons and an optional "Commission received (£)" field shown only on Won. Confirming calls `setBoardOutcomeAction`, which sets stage + the relevant outcome field (+ `completedAt`/`lostAt`/commission, for Completed/Lost) together in one update, so a card can never sit in either column with an undecided outcome. Cancelling closes the dialog with nothing changed (the card was never optimistically moved).
- **Find Car deliberately does NOT get a popup** — explicit user decision when asked, since only Proposal Accepted + Completed/Lost were requested. Dragging into Find Car still just moves the stage; its outcome stays Pending (orange) until set manually on the deal form. Worth reconsidering for full symmetry if it comes up again.

**Verified live**: page loads without the Decimal runtime error (confirmed via curl + dev server log, both clean), `canEnterStage` validation logic (blocks/allows correctly, tested against a real DB row), deposit/commissionPercent persist and display correctly, board tint classes render correctly (green/red/orange, colour bug fixed), edit-shortcut and New-deal contact-picker links are correct, all filter/sort/status controls render. The drag-out reset and `setBoardOutcome` logic were verified with two Node scripts (26 + 13 assertions) run directly against the real Prisma/SQLite DB (mirroring the service functions exactly, using disposable `ZZTEST` contacts cleaned up immediately after) — covering all three outcome-bearing stages' reset-on-exit, `completedAt`/`lostAt` clearing, commission preservation on reset, both outcome paths for Proposal Accepted and Completed/Lost (including commission being saved on a won Completed/Lost, and `completedAt`/`lostAt` stamping correctly per branch), and the finalMake gate still blocking `setBoardOutcome` when unset. **Not verified**: the actual drag gesture, the popups' on-screen appearance/interaction, and the optimistic-update/revert UX, since no browser tool is available — the underlying business logic is confirmed correct, but nothing in this session has interactively driven the board itself.

**Hydration fix**: `DndContext` in `Board.tsx` gained an explicit `id="deal-board"` prop. Without it, `@dnd-kit/core` generates its internal `aria-describedby` ids from a module-level counter that isn't guaranteed to produce the same sequence on the server render vs. the client hydration pass, throwing a real (harmless but noisy) React hydration mismatch warning — reported by the user from their own console. Passing an explicit `id` seeds that generator deterministically (confirmed via curl: `aria-describedby="deal-board"` on every draggable now, not an incrementing `DndDescribedBy-N`). Worth remembering for any *other* future `DndContext` instance in this app — always set `id` explicitly, don't rely on the default.

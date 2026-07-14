# BUG-6A — Double-clicking "Confirm booking" sends duplicate requests

**Status:** OPEN · **Severity:** Medium · **Owner file:** `client/App.tsx` (`onSubmit` / submit button)

## Problem

- **Observed:** nothing prevents re-submission while a booking request is in flight (~200ms). A double-click fires two identical `POST /api/bookings`. (Before BUG-1 was fixed this double-booked the slot; now the second request costs a round-trip and surfaces a spurious "slot already booked" error to the very user who booked it.)
- **Expected:** one user action produces exactly one booking request; the UI ignores or blocks re-submission until the in-flight request settles.

## Root cause (confirmed by repro)

`onSubmit` has no in-flight guard and the submit button is never disabled during the request, so the handler runs once per submit event.

## Requirements

- **MUST** ensure that submitting while a booking request is in flight does not send a second `POST /api/bookings` — guard inside the handler (e.g. a `submitting` state flag), not merely a disabled button, so programmatic/keyboard submits are covered too.
- **SHOULD** disable the "Confirm booking" button while in flight (UX).
- **MUST** re-enable submission after the request settles (success or failure).
- **MUST NOT** change the server, `client/api.ts`, or the markup structure (`div.slot`, "Choose"/"Booked" labels, `p.ok`/`p.err`).

## Out of scope

BUG-2, BUG-3, BUG-4 (optimistic render/rollback — do not fix here), BUG-6B.

## Acceptance criteria (the loop's goal)

**Goal command:** `bash specs/goals/bug6a.goal.sh` — exits 0 iff ALL criteria pass. It bundles:

1. jsdom auto-installed (`--no-save`) and a fresh API server restart on :3000, then `npx tsx specs/checks/bug6a.check.ts` exits 0 — it drives the real `App.tsx` in jsdom, dispatches two submit events 30ms apart, and asserts exactly **1** `POST /api/bookings` went out and the booking succeeded.
2. `npm test` passes.
3. Diff-scope guard: the worktree diff touches only `client/App.tsx` (beyond changes already pending when the loop started).

## Loop prompt

```text
/loop Work in /Users/pablo/Desktop/fullstack-booking on spec specs/bug-6a-double-submit.md.
Each iteration:
1. Run the goal command: bash specs/goals/bug6a.goal.sh
2. If it exits 0 (GOAL MET): report the final `git diff client/App.tsx` and the goal output, then STOP the loop.
3. Otherwise: read its FAIL lines, implement the smallest change that satisfies the spec's Requirements section (handler-level in-flight guard, button disabled during flight, re-enabled after settle), and iterate.
Constraints: keep the existing markup/classes/labels; do NOT fix anything listed under Out of scope.
```

# BUG-4 — Optimistic slot update never renders and never rolls back

**Status:** OPEN · **Severity:** Medium · **Owner file:** `client/App.tsx` (`onSubmit`)

## Problem

Two observable defects from one root cause, both reproduced against the real component:

- **(a) Observed:** while a booking request is in flight (~200ms), the chosen slot still shows "Choose" — the intended instant feedback never appears. **Expected:** the slot renders as taken immediately on submit.
- **(b) Observed:** when a booking FAILS (e.g. server 400/409), the error message renders and the slot flips to "Booked" (disabled) even though the server still reports it free; it stays unbookable until page reload. **Expected:** a failed booking leaves the slot selectable.

## Root cause (confirmed by repro)

`onSubmit` mutates state in place — `selected.taken = true` — then calls `setSlots(slots)` with the **same array reference**. React bails out of re-rendering on identical references, so the optimistic update never paints (a). The mutation is never reverted, so the next unrelated render (the error message) leaks the stale `taken=true` into the UI (b).

## Requirements

- **MUST** render the selected slot as taken immediately after submit (optimistic), without mutating existing state objects — produce a new array/objects for `setSlots`.
- **MUST** roll the optimistic update back if the booking request fails, leaving the slot enabled and labeled "Choose".
- **MUST** keep the existing success behavior (confirmation message, form reset).
- **MUST NOT** change the server, `client/api.ts`, markup structure (`div.slot`, button labels "Choose"/"Booked", `p.ok`/`p.err`), or add libraries.

## Out of scope

BUG-2, BUG-3, BUG-6A (submit guard — do not add one here), BUG-6B.

## Acceptance criteria (the loop's goal)

**Goal command:** `bash specs/goals/bug4.goal.sh` — exits 0 iff ALL criteria pass. It bundles:

1. jsdom auto-installed (`--no-save`) and a fresh API server restart on :3000, then `npx tsx specs/checks/bug4.check.ts` exits 0 — it drives the real `App.tsx` in jsdom and asserts:
   - (a) 100ms after submitting a valid booking (server still writing), the slot's button reads "Booked";
   - (b) after a failed booking, the slot's button reads "Choose" and is enabled.
2. `npm test` passes.
3. Diff-scope guard: the worktree diff touches only `client/App.tsx` (beyond changes already pending when the loop started).

## Loop prompt

```text
/loop Work in /Users/pablo/Desktop/fullstack-booking on spec specs/bug-4-optimistic-update.md.
Each iteration:
1. Run the goal command: bash specs/goals/bug4.goal.sh
2. If it exits 0 (GOAL MET): report the final `git diff client/App.tsx` and the goal output, then STOP the loop.
3. Otherwise: read its FAIL lines, implement the smallest change that satisfies the spec's Requirements section (immutable optimistic update + rollback on failure), and iterate.
Constraints: keep the existing markup/classes/labels; do NOT add a submit guard (that is BUG-6A) or fix anything else listed under Out of scope.
```

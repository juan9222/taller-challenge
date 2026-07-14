# BUG-3 — Booking times render wrong for non-UTC users

**Status:** OPEN · **Severity:** High · **Owner file:** `client/api.ts` (`formatSlot`)

## Problem

- **Observed:** a slot stored as `2026-07-14T23:00:00.000Z` renders as `11:00:00 PM` for a user in UTC-5, whose correct local time is `6:00:00 PM`. Every user outside UTC sees the office's UTC clock time labeled as their own.
- **Expected:** slot times render in the viewer's local timezone.

## Root cause (confirmed by repro)

`formatSlot` does `new Date(startsAtIso.slice(0, 19))`. The slice strips the `Z` suffix (and milliseconds), so JavaScript parses the UTC timestamp as if it were local time.

## Requirements

- **MUST** treat `startsAt` as UTC and render it in the viewer's local timezone; `formatSlot(iso)` must equal `new Date(iso).toLocaleString()` for any valid UTC ISO input.
- **MUST NOT** change the function's signature or call sites (`App.tsx` uses it in 3 places).
- **MUST NOT** touch server code or any other client behavior.

## Out of scope

BUG-2, BUG-4, BUG-6A, BUG-6B. Formatting niceties (12/24h, date-fns, Intl options) — keep `toLocaleString()`.

## Acceptance criteria (the loop's goal)

**Goal command:** `bash specs/goals/bug3.goal.sh` — exits 0 iff ALL criteria pass (no server needed). It bundles:

1. `TZ=America/New_York npx tsx specs/checks/bug3.check.ts` exits 0 (summer, winter, and date-line-crossing cases).
2. `TZ=Asia/Tokyo npx tsx specs/checks/bug3.check.ts` exits 0 (positive UTC offset).
3. Diff-scope guard: the worktree diff touches only `client/api.ts` (beyond changes already pending when the loop started).

## Loop prompt

```text
/loop Work in /Users/pablo/Desktop/fullstack-booking on spec specs/bug-3-timezone-display.md.
Each iteration:
1. Run the goal command: bash specs/goals/bug3.goal.sh
2. If it exits 0 (GOAL MET): report the final `git diff client/api.ts` and the goal output, then STOP the loop.
3. Otherwise: read its FAIL lines, implement the smallest change that satisfies the spec's Requirements section (only formatSlot), and iterate.
Constraints: keep the function signature and toLocaleString(); do NOT fix or alter anything listed under Out of scope.
```

# BUG-2 — Past time slots are listed as available

**Status:** OPEN · **Severity:** High · **Owner file:** `server/index.ts` (GET `/api/slots` handler)

## Problem

- **Observed:** `GET /api/slots` returns slots whose `startsAt` is already in the past (e.g. 21 of 24 slots returned at 20:42 UTC). Users see — and can book — times that already happened.
- **Expected:** the endpoint returns only slots that start strictly in the future.

## Root cause (confirmed by repro)

`server/index.ts` filters with `s.startsAt > today` where `today` is the bare date string `"YYYY-MM-DD"`. Every full ISO timestamp of the current day (`"YYYY-MM-DDT..."`) compares lexicographically greater than the bare date, so the filter removes nothing from today.

## Requirements

- **MUST** exclude every slot with `startsAt <= now` at request time.
- **MUST** still return every slot with `startsAt > now`, each with its correct `taken` flag.
- **MUST NOT** change the response shape (`{ slots: [{ id, startsAt, durationMinutes, taken }] }`), routes, or slot generation.
- **MUST NOT** touch any other handler or any client code.

## Out of scope

BUG-3 (timezone display), BUG-4 (optimistic UI), BUG-6A (double submit), BUG-6B (email validation), and server-side rejection of *booking* a past slot (a separate, unfiled issue).

## Acceptance criteria (the loop's goal)

**Goal command:** `bash specs/goals/bug2.goal.sh` — exits 0 iff ALL criteria pass. It bundles:

1. Fresh API server restart on :3000, then `npx tsx specs/checks/bug2.check.ts` exits 0 (no past slots AND the correct number of future slots — an empty list fails).
2. `npm test` passes (both smoke tests).
3. Diff-scope guard: the worktree diff touches only `server/index.ts` (beyond changes already pending when the loop started).

## Loop prompt

```text
/loop Work in /Users/pablo/Desktop/fullstack-booking on spec specs/bug-2-past-slots.md.
Each iteration:
1. Run the goal command: bash specs/goals/bug2.goal.sh
2. If it exits 0 (GOAL MET): report the final `git diff server/index.ts` and the goal output, then STOP the loop.
3. Otherwise: read its FAIL lines, implement the smallest change that satisfies the spec's Requirements section (only the GET /api/slots handler), and iterate.
Constraints: preserve the architecture (in-memory arrays, same routes/response shape); do NOT fix or alter anything listed under Out of scope.
```

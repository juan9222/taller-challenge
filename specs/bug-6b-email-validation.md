# BUG-6B — Server accepts syntactically invalid emails

**Status:** OPEN · **Severity:** Low · **Owner file:** `server/index.ts` (POST `/api/bookings` handler)

## Problem

- **Observed:** `POST /api/bookings` with `customerEmail: "not-an-email"` returns 201. Any confirmation email downstream would be undeliverable, and the contact data is junk.
- **Expected:** the server rejects a syntactically invalid `customerEmail` with `400` and a clear error message.

## Root cause (confirmed by repro)

The handler checks only that `customerEmail` is present (truthy), never its shape.

## Requirements

- **MUST** reject requests whose `customerEmail` does not look like an email with `400 { "error": ... }`. A pragmatic shape check is sufficient and preferred: non-empty local part, one `@`, non-empty domain containing a dot (e.g. `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`). Do NOT attempt full RFC 5322.
- **MUST** continue accepting valid emails with 201 and an unchanged response body.
- **MUST** keep the existing 400 for a missing email, 404 for unknown slot, 409 for taken slot.
- **MUST NOT** touch any other route or any client code; no new dependencies.

## Out of scope

BUG-2, BUG-3, BUG-4, BUG-6A. Client-side email validation (server is the authority here).

## Acceptance criteria (the loop's goal)

**Goal command:** `bash specs/goals/bug6b.goal.sh` — exits 0 iff ALL criteria pass. It bundles:

1. Fresh API server restart on :3000, then `npx tsx specs/checks/bug6b.check.ts` exits 0 — invalid shapes (`not-an-email`, `user.example.com`, `user@`, missing) all get 400; a valid email still gets 201.
2. `npm test` passes.
3. Diff-scope guard: the worktree diff touches only `server/index.ts` (beyond changes already pending when the loop started).

## Loop prompt

```text
/loop Work in /Users/pablo/Desktop/fullstack-booking on spec specs/bug-6b-email-validation.md.
Each iteration:
1. Run the goal command: bash specs/goals/bug6b.goal.sh
2. If it exits 0 (GOAL MET): report the final `git diff server/index.ts` and the goal output, then STOP the loop.
3. Otherwise: read its FAIL lines, implement the smallest change that satisfies the spec's Requirements section (only the POST /api/bookings validation block), and iterate.
Constraints: simple shape check only (no RFC 5322, no libraries); do NOT fix anything listed under Out of scope.
```

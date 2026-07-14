# Bug specifications

Spec-driven fixes for the 5 open bugs. Each spec has:

- an executable acceptance check under `specs/checks/` — **the check asserts
  the FIXED behavior**, so it fails (exit 1) until the bug is fixed;
- a **goal command** under `specs/goals/` — the loop's stop condition. It
  bundles everything the spec requires (fresh server, acceptance check,
  smoke tests, diff-scope guard) and exits 0 iff ALL acceptance criteria
  pass, printing a PASS/FAIL line per criterion;
- a `/loop` prompt that runs the goal command each iteration and stops on
  exit 0.

| ID | Spec | Owner file | Goal command (loop stop condition) |
|---|---|---|---|
| BUG-2 | [bug-2-past-slots.md](bug-2-past-slots.md) | `server/index.ts` | `bash specs/goals/bug2.goal.sh` |
| BUG-3 | [bug-3-timezone-display.md](bug-3-timezone-display.md) | `client/api.ts` | `bash specs/goals/bug3.goal.sh` |
| BUG-4 | [bug-4-optimistic-update.md](bug-4-optimistic-update.md) | `client/App.tsx` | `bash specs/goals/bug4.goal.sh` |
| BUG-6A | [bug-6a-double-submit.md](bug-6a-double-submit.md) | `client/App.tsx` | `bash specs/goals/bug6a.goal.sh` |
| BUG-6B | [bug-6b-email-validation.md](bug-6b-email-validation.md) | `server/index.ts` | `bash specs/goals/bug6b.goal.sh` |

Already resolved, no spec needed: BUG-1 (double-booking race — fixed in
`server/index.ts`); "BUG-5" (duplicate booking ids — investigated and
disproved: id creation and push are in one synchronous block).

## Running

```bash
# The goal command is all you need — it restarts the server, installs jsdom
# if required, runs the acceptance check + smoke tests + diff-scope guard:
bash specs/goals/bug2.goal.sh && echo DONE

# Individual checks can also be run directly (fresh server on :3000 needed
# for bug2/bug4/bug6a/bug6b; jsdom via `npm i --no-save jsdom` for bug4/6a):
npx tsx specs/checks/bug2.check.ts
TZ=America/New_York npx tsx specs/checks/bug3.check.ts
```

Notes:
- The diff-scope guard snapshots the dirty files on its first run
  (`specs/goals/.baseline-*`, git-ignored) so pre-existing uncommitted work
  (e.g. the BUG-1 fix) doesn't trip it; only NEW out-of-scope edits fail.
  Delete the baseline file to re-arm from scratch.
- `bug2.check.ts` assumes the server was started the same UTC day (slots are
  generated for "today" at startup).
- BUG-4 and BUG-6A both edit `client/App.tsx`; fix them in separate loops
  (each spec's Out of scope forbids fixing the other) — the diffs compose.
- Order recommendation: BUG-2, BUG-3, BUG-6B (independent files), then BUG-4,
  then BUG-6A.

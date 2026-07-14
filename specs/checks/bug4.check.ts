// Acceptance check for BUG-4 (optimistic update never renders + no rollback).
// Drives the REAL client/App.tsx in jsdom against the live API on :3000.
// Mutates server state (books one slot) — restart the server before re-runs.
// Exit 0 = spec satisfied, exit 1 = not.
import { dom, doc, sleep, waitFor, freeRow, click, submitForm, setInputValue, mountApp } from "./harness.ts";

const fails: string[] = [];

await mountApp();

// (a) Optimistic render: submit a VALID booking. The server takes ~200ms to
// reply, so mid-flight the only thing that can show "Booked" is the
// optimistic update itself.
const rowA = freeRow();
click(rowA.querySelector("button")!);
await waitFor(() => !!doc.querySelector("form"), "booking form (a)");
setInputValue("Email", "spec4@example.com");
submitForm();
await sleep(100); // server replies at ~200ms
const midFlight = rowA.querySelector("button")!.textContent;
if (midFlight === "Booked") {
  console.log(`PASS bug4(a): slot shows "Booked" while the request is still in flight`);
} else {
  fails.push(`(a) 100ms after submit the button shows "${midFlight}" — optimistic update did not render`);
}
await waitFor(() => !!doc.querySelector("p.ok"), "success message (a)");

// (b) Rollback: submit with an EMPTY email (server rejects with 400). After
// the failure the slot must NOT be left marked as taken.
const rowB = freeRow();
click(rowB.querySelector("button")!);
await waitFor(() => !!doc.querySelector("form"), "booking form (b)");
submitForm(); // email empty -> 400
await waitFor(() => !!doc.querySelector("p.err"), "error message (b)");
await sleep(100); // allow any rollback re-render to flush
const afterError = rowB.querySelector("button")!;
if (afterError.textContent === "Choose" && !afterError.disabled) {
  console.log(`PASS bug4(b): failed booking left the slot selectable ("Choose", enabled)`);
} else {
  fails.push(`(b) after a FAILED booking the button shows "${afterError.textContent}" (disabled=${afterError.disabled}) — mutation not rolled back`);
}

if (fails.length) {
  for (const f of fails) console.error(`FAIL bug4${f}`);
  process.exit(1);
}
process.exit(0);

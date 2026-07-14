// Acceptance check for BUG-6A (double-submit sends duplicate bookings).
// Drives the REAL client/App.tsx in jsdom against the live API on :3000 and
// counts outgoing POST /api/bookings requests while double-submitting.
// Mutates server state (books one slot) — restart the server before re-runs.
// Exit 0 = spec satisfied, exit 1 = not.
import { doc, sleep, waitFor, freeRow, click, submitForm, setInputValue, mountApp, stats } from "./harness.ts";

await mountApp();

const row = freeRow();
click(row.querySelector("button")!);
await waitFor(() => !!doc.querySelector("form"), "booking form");
setInputValue("Email", "spec6a@example.com");

// Simulate a double-click on "Confirm booking": two submits 30ms apart,
// both while the first request is still in flight (~200ms server latency).
submitForm();
await sleep(30);
if (doc.querySelector("form")) submitForm();

await waitFor(() => !!doc.querySelector("p.ok"), "success message");
await sleep(250); // let any straggler request finish

const fails: string[] = [];
if (stats.bookingPosts !== 1) {
  fails.push(`double-submit produced ${stats.bookingPosts} POST /api/bookings requests — expected exactly 1`);
}
if (!doc.querySelector("p.ok")) {
  fails.push("the (single) legitimate booking did not succeed");
}

if (fails.length) {
  for (const f of fails) console.error(`FAIL bug6a: ${f}`);
  process.exit(1);
}
console.log("PASS bug6a: double-submit sent exactly 1 booking request and it succeeded");
process.exit(0);

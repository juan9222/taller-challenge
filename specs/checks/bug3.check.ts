// Acceptance check for BUG-3 (wrong timezone in formatSlot).
// Run with an explicit non-UTC timezone so the result is deterministic:
//   TZ=America/New_York npx tsx specs/checks/bug3.check.ts
// Exit 0 = spec satisfied, exit 1 = not.
import { formatSlot } from "../../client/api.ts";

if (new Date().getTimezoneOffset() === 0) {
  console.error("FAIL bug3: this check must run in a non-UTC timezone (e.g. TZ=America/New_York) to be meaningful");
  process.exit(1);
}

const cases = [
  "2026-07-14T23:00:00.000Z", // evening UTC -> previous-afternoon/evening local in US
  "2026-07-15T00:30:00.000Z", // crosses the date line for negative offsets
  "2026-01-05T04:00:00.000Z", // winter date (different DST offset)
];

let ok = true;
for (const iso of cases) {
  const got = formatSlot(iso);
  const want = new Date(iso).toLocaleString(); // canonical local rendering
  const pass = got === want;
  ok &&= pass;
  console.log(`${pass ? "PASS" : "FAIL"} bug3: formatSlot("${iso}") = "${got}"${pass ? "" : ` — expected "${want}"`}`);
}
process.exit(ok ? 0 : 1);

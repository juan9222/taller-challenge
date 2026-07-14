// Acceptance check for BUG-2 (past slots listed).
// Requires the API server FRESHLY started on :3000 the same UTC day.
// Exit 0 = spec satisfied, exit 1 = not.
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const { slots } = (await (await fetch(`${BASE}/api/slots`)).json()) as {
  slots: { id: string; startsAt: string; taken: boolean }[];
};
const now = new Date();

// Expected future-slot count given the generation scheme (24 hourly slots
// starting today 00:00 UTC). Guards against "fixing" by returning nothing.
const dayStart = new Date();
dayStart.setUTCHours(0, 0, 0, 0);
let expected = 0;
for (let i = 0; i < 24; i++) {
  if (dayStart.getTime() + i * 3_600_000 > now.getTime()) expected++;
}

const past = slots.filter((s) => new Date(s.startsAt) <= now);
const fails: string[] = [];
if (past.length > 0) fails.push(`${past.length} past slot(s) returned, e.g. ${past[0].startsAt} (now=${now.toISOString()})`);
if (slots.length !== expected) fails.push(`expected ${expected} future slot(s), got ${slots.length} — future slots must not be over-filtered`);

if (fails.length) {
  console.error("FAIL bug2:", fails.join(" | "));
  process.exit(1);
}
console.log(`PASS bug2: ${slots.length} slot(s) returned, all strictly in the future`);

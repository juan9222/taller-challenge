// Acceptance check for BUG-6B (server accepts invalid emails).
// Requires the API server running on :3000; books one slot (s3) when passing.
// Exit 0 = spec satisfied, exit 1 = not.
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

async function post(body: Record<string, unknown>): Promise<number> {
  const r = await fetch(`${BASE}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (r.status === 201) await r.json();
  return r.status;
}

// One slot per case so a wrongly-accepted booking can't turn later cases
// into misleading 409s.
const cases: { label: string; body: Record<string, unknown>; want: number }[] = [
  { label: "invalid email 'not-an-email'", body: { slotId: "s3", customerEmail: "not-an-email" }, want: 400 },
  { label: "missing @ 'user.example.com'", body: { slotId: "s4", customerEmail: "user.example.com" }, want: 400 },
  { label: "missing domain 'user@'", body: { slotId: "s5", customerEmail: "user@" }, want: 400 },
  { label: "missing email entirely", body: { slotId: "s6", customerName: "X" }, want: 400 },
  { label: "valid email still accepted", body: { slotId: "s7", customerName: "Spec", customerEmail: "valid@example.com", customerPhone: "" }, want: 201 },
];

let ok = true;
for (const c of cases) {
  const got = await post(c.body);
  const pass = got === c.want;
  ok &&= pass;
  console.log(`${pass ? "PASS" : "FAIL"} bug6b: ${c.label} -> ${got}${pass ? "" : ` (expected ${c.want})`}`);
}
process.exit(ok ? 0 : 1);

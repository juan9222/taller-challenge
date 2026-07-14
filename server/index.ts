import express from "express";
import type { Request, Response } from "express";

// ============================================================
//  Booking service — tiny appointment scheduler
// ============================================================
//  GET  /api/slots                — list all slots (with availability)
//  POST /api/bookings             — book a slot
//  GET  /api/bookings/:id         — fetch a booking
// ============================================================

type Slot = {
  id: string;
  // ISO datetime (UTC) when the slot starts
  startsAt: string;
  durationMinutes: number;
};

type Booking = {
  id: string;
  slotId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
};

// In-memory data ---------------------------------------------------------

const slots: Slot[] = generateSlots();
const bookings: Booking[] = [];

function generateSlots(): Slot[] {
  // 24 slots, one per hour starting today 00:00 UTC
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const out: Slot[] = [];
  for (let i = 0; i < 24; i++) {
    const dt = new Date(start.getTime() + i * 60 * 60 * 1000);
    out.push({
      id: "s" + (i + 1),
      startsAt: dt.toISOString(),
      durationMinutes: 60,
    });
  }
  return out;
}

// Routes -----------------------------------------------------------------

const app = express();
app.use(express.json());

app.get("/api/slots", (_req: Request, res: Response) => {
  const taken = new Set(bookings.map((b) => b.slotId));
  // Only return slots that start strictly in the future
  const now = new Date().toISOString();
  const available = slots
    .filter((s) => s.startsAt > now)
    .map((s) => ({ ...s, taken: taken.has(s.id) }));
  res.json({ slots: available });
});

app.post("/api/bookings", (req: Request, res: Response) => {
  const { slotId, customerName, customerEmail, customerPhone } = req.body ?? {};

  console.log("[bookings] new booking request:", JSON.stringify(req.body));

  if (!slotId || !customerEmail) {
    return res.status(400).json({ error: "slotId and customerEmail are required" });
  }

  // Pragmatic shape check: non-empty local part, one @, domain with a dot
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return res.status(400).json({ error: "customerEmail is not a valid email address" });
  }

  const slot = slots.find((s) => s.id === slotId);
  if (!slot) return res.status(404).json({ error: "slot not found" });

  // Is it already taken?
  const alreadyBooked = bookings.some((b) => b.slotId === slotId);
  if (alreadyBooked) {
    return res.status(409).json({ error: "slot already booked" });
  }

  // Record the booking in the same synchronous block as the availability
  // check above — no await/timer in between — so a concurrent request for the
  // same slot is guaranteed to see it and get the 409.
  const booking: Booking = {
    id: "b" + (bookings.length + 1),
    slotId,
    customerName: customerName ?? "",
    customerEmail,
    customerPhone: customerPhone ?? "",
    createdAt: new Date().toISOString(),
  };
  bookings.push(booking);

  // Simulate the latency of writing to a database
  setTimeout(() => {
    res.status(201).json(booking);
  }, 200);
});

app.get("/api/bookings/:id", (req: Request, res: Response) => {
  const b = bookings.find((x) => x.id === req.params.id);
  return b ? res.json(b) : res.status(404).end();
});

const PORT = 3000;
app.listen(PORT, () => console.log(`booking server listening on :${PORT}`));

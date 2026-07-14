// Shared jsdom harness for client-side acceptance checks (BUG-4, BUG-6A).
// Mounts the REAL client/App.tsx against the live API on :3000.
// Prerequisites: `npm i --no-save jsdom` and the API server running.
import { JSDOM } from "jsdom";

export const dom = new JSDOM(
  `<!doctype html><html><body><div id="root"></div></body></html>`,
  { url: "http://localhost:5173/", pretendToBeVisual: true },
);

const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.MouseEvent = dom.window.MouseEvent;
g.Event = dom.window.Event;
if (!g.navigator) g.navigator = dom.window.navigator;

// The client uses relative fetch("/api/...") — rewrite to the API server,
// and count booking POSTs so checks can assert on network behavior.
export const stats = { bookingPosts: 0 };
const realFetch = globalThis.fetch;
g.fetch = (url: any, init?: any) => {
  if (typeof url === "string" && url.startsWith("/")) {
    if (url.startsWith("/api/bookings") && init?.method === "POST") stats.bookingPosts++;
    return realFetch(`http://localhost:3000${url}`, init);
  }
  return realFetch(url, init);
};

export const doc = dom.window.document;
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function waitFor(pred: () => boolean, what: string, ms = 3000) {
  const t0 = Date.now();
  while (!pred()) {
    if (Date.now() - t0 > ms) throw new Error(`timed out waiting for: ${what}`);
    await sleep(25);
  }
}

export function slotRows() {
  return [...doc.querySelectorAll("div.slot")] as HTMLElement[];
}

export function freeRow() {
  const row = slotRows().find((r) => !r.querySelector("button")!.disabled);
  if (!row) throw new Error("no free slot row available");
  return row;
}

export function click(el: Element) {
  el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
}

export function submitForm() {
  doc.querySelector("form")!.dispatchEvent(
    new dom.window.Event("submit", { bubbles: true, cancelable: true }),
  );
}

export function setInputValue(placeholder: string, value: string) {
  const input = [...doc.querySelectorAll("input")].find((i) => i.placeholder === placeholder)!;
  // Controlled React inputs need the native setter + an 'input' event
  const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!;
  setter.call(input, value);
  input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
}

export async function mountApp() {
  await import("../../client/App.tsx"); // mounts into #root as a side effect
  await waitFor(() => slotRows().length > 0, "slots to render");
}

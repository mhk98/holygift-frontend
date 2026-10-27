declare global {
  interface Window {
    fbq: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; };
    _fbq: unknown;
  }
}

import { BASE } from "@/lib/api";

// Meta Pixel (browser) + Conversions API (server) tracking.
//
// Every event is fired in the browser with an eventID and posted to
// /tracking/events with the same id, so Meta keeps one of the two copies.
// Purchase is the exception: the backend sends it from the saved order, and the
// browser only fires its copy with the event id and values the order API returns.

const CURRENCY = "BDT";

export interface TrackItem {
  id: string | number;
  name?: string;
  price: number;
  quantity: number;
}

/** Purchase data returned by POST /orders (calculated on the server). */
export interface PurchaseTracking {
  eventId: string;
  order_id: string;
  value: number;
  currency: string;
  content_type: string;
  content_ids: string[];
  contents: { id: string; quantity: number; item_price: number }[];
  content_name?: string;
  num_items: number;
}

// ---------------------------------------------------------------------------
// First-party Meta identifiers (_fbp / _fbc)
// ---------------------------------------------------------------------------

const FBC_MAX_AGE_S = 90 * 24 * 60 * 60;

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const row = document.cookie.split("; ").find((item) => item.startsWith(`${name}=`));
  return row ? decodeURIComponent(row.slice(name.length + 1)) : "";
}

function param(name: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) || "";
}

/**
 * Stores fbclid from a Meta ad click as _fbc (fb.1.<first-seen ms>.<fbclid>).
 * The same fbclid keeps its original timestamp; nothing is written without a real fbclid.
 */
export function captureFbclid() {
  const fbclid = param("fbclid").trim();
  if (!fbclid || !/^[\w-]{10,500}$/.test(fbclid)) return;
  const existing = readCookie("_fbc");
  if (existing.split(".").slice(3).join(".") === fbclid) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `_fbc=fb.1.${Date.now()}.${fbclid}; Max-Age=${FBC_MAX_AGE_S}; Path=/; SameSite=Lax${secure}`;
}

function attribution() {
  return {
    fbp: readCookie("_fbp") || undefined,
    fbc: readCookie("_fbc") || undefined,
  };
}

/** Attribution saved with an order; the server re-validates every field. */
export function getPixelClickData() {
  captureFbclid();
  return {
    ...attribution(),
    eventSourceUrl: typeof window === "undefined" ? undefined : window.location.href,
    gclid: param("gclid") || undefined,
    gbraid: param("gbraid") || undefined,
    wbraid: param("wbraid") || undefined,
    ttclid: param("ttclid") || undefined,
    ttp: readCookie("_ttp") || undefined,
  };
}

// ---------------------------------------------------------------------------
// Browser pixel
// ---------------------------------------------------------------------------

// Pixels are initialised once /tracking/config loads (MetaPixel.tsx). Events
// fired earlier — e.g. ViewContent on mount — wait here instead of being lost.
let pixelsReady = false;
let pixelIds: string[] = [];
const pendingBrowserEvents: (() => void)[] = [];

export function markPixelsReady(ids: string[] = []) {
  pixelIds = ids;
  pixelsReady = true;
  pendingBrowserEvents.splice(0).forEach((send) => send());
}

function runWhenPixelsReady(send: () => void) {
  if (pixelsReady) send();
  else pendingBrowserEvents.push(send);
}

// trackSingle sends to each configured pixel explicitly, never to a pixel some
// other script initialised on the page.
function fireBrowser(eventName: string, eventId: string, customData?: Record<string, unknown>) {
  runWhenPixelsReady(() => {
    if (typeof window.fbq !== "function") return;
    pixelIds.forEach((id) => window.fbq("trackSingle", id, eventName, customData || {}, { eventID: eventId }));
  });
}

// ---------------------------------------------------------------------------
// Server copy
// ---------------------------------------------------------------------------

function newEventId(prefix: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}_${random}`;
}

function sendServer(eventName: string, eventId: string, customData?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // A logged-in customer's token lets the server add their account details for matching.
  let token: string | null = null;
  try { token = window.localStorage.getItem("customer_token"); } catch { /* storage blocked */ }
  fetch(`${BASE}/tracking/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      eventName,
      eventId,
      eventSourceUrl: window.location.href,
      attribution: attribution(),
      customData,
    }),
    keepalive: true,
  }).catch(() => {});
}

function track(eventName: string, prefix: string, customData?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  captureFbclid();
  const eventId = newEventId(prefix);
  fireBrowser(eventName, eventId, customData);
  sendServer(eventName, eventId, customData);
}

const round = (value: number) => Math.round((Number(value) || 0) * 100) / 100;

function itemsData(items: TrackItem[]) {
  const contents = items
    .filter((item) => item.id !== undefined && item.id !== null && item.quantity > 0)
    .map((item) => ({ id: String(item.id), quantity: item.quantity, item_price: round(item.price) }));
  return {
    content_type: "product",
    content_ids: contents.map((item) => item.id),
    contents,
    content_name: items.map((item) => item.name).filter(Boolean).join(", ").slice(0, 200) || undefined,
    value: round(contents.reduce((sum, item) => sum + item.item_price * item.quantity, 0)),
    currency: CURRENCY,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function trackPageView() {
  track("PageView", "pv");
}

export function trackViewContent(item: TrackItem, category?: string | null) {
  track("ViewContent", "vc", { ...itemsData([item]), content_category: category || undefined });
}

/** Call only after the item was actually added to the cart. */
export function trackAddToCart(item: TrackItem) {
  track("AddToCart", "atc", itemsData([item]));
}

export function trackInitiateCheckout(items: TrackItem[]) {
  if (!items.length) return;
  const data = itemsData(items);
  track("InitiateCheckout", "ic", { ...data, num_items: data.contents.reduce((sum, item) => sum + item.quantity, 0) });
}

/** Browser copy of the server-side Purchase; ids and values come from the order API. */
export function trackPurchase(purchase: PurchaseTracking | null | undefined) {
  if (typeof window === "undefined" || !purchase?.eventId) return;
  const { eventId, ...customData } = purchase;
  fireBrowser("Purchase", eventId, customData);
}

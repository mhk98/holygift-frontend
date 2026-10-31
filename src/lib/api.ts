const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Server-side Node.js fetch needs absolute URL; browser uses relative (goes through Next.js rewrites)
export const BASE =
  typeof window === "undefined" ? `${API_URL}/api/v1` : "/api/v1";

export const IMAGES = "/images";

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
  /** Extra attempts on network errors, empty/non-JSON bodies or 502/503/504.
   *  Only pass this for requests that are safe to repeat (e.g. orders with a checkoutKey). */
  retries?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const NETWORK_ERROR_MESSAGE =
  "সার্ভারের সাথে সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।";
const RETRYABLE_STATUS = new Set([502, 503, 504]);

class RetryableError extends Error {}

// Server-side rendering calls the backend directly (not through src/proxy.ts);
// the shared secret marks them as our own server so they aren't rate limited.
// PROXY_SECRET is not NEXT_PUBLIC_, so it never reaches the browser bundle.
const serverHeaders: Record<string, string> =
  typeof window === "undefined" && process.env.PROXY_SECRET
    ? { "x-proxy-secret": process.env.PROXY_SECRET }
    : {};

async function fetchOnce<T>(
  urlStr: string,
  init: RequestInit,
  headers: HeadersInit | undefined,
  externalSignal: AbortSignal | null | undefined,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const abort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) abort();
    else externalSignal.addEventListener("abort", abort, { once: true });
  }

  try {
    let res: Response;
    try {
      // `headers` is pulled out of init above so a caller's headers (e.g. Authorization)
      // are merged with the JSON Content-Type instead of replacing it.
      res = await fetch(urlStr, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...serverHeaders,
          ...headers,
        },
        signal: controller.signal,
      });
    } catch (err) {
      if (externalSignal?.aborted) throw err;
      throw new RetryableError(NETWORK_ERROR_MESSAGE);
    }

    // A proxy/gateway hiccup can return an empty or HTML body; never surface the
    // raw "Unexpected end of JSON input" to the customer.
    const text = await res.text().catch(() => "");
    let json: (T & { message?: string }) | undefined;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      json = undefined;
    }

    if (!json) throw new RetryableError(NETWORK_ERROR_MESSAGE);
    if (!res.ok) {
      const message = json.message || "API error";
      if (RETRYABLE_STATUS.has(res.status)) throw new RetryableError(message);
      throw new Error(message);
    }
    return json;
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", abort);
  }
}

export async function apiFetch<T>(
  path: string,
  {
    params,
    signal: externalSignal,
    headers,
    retries = 0,
    ...init
  }: FetchOptions = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  let urlStr = `${BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    if (qs) urlStr += `?${qs}`;
  }

  for (let attempt = 0; ; attempt++) {
    try {
      return await fetchOnce<T>(
        urlStr,
        init,
        headers,
        externalSignal,
        timeoutMs,
      );
    } catch (err) {
      if (!(err instanceof RetryableError) || attempt >= retries) {
        throw err instanceof RetryableError ? new Error(err.message) : err;
      }
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
    }
  }
}

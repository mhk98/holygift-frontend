import { BASE } from "@/lib/api";

export interface WebsitePage {
  Id: number;
  name: string;
  title: string | null;
  description: string | null;
  status: string;
  slug: string;
}

export function toPageSlug(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchPublicPages(): Promise<WebsitePage[]> {
  const json = await fetchJson<{ data?: WebsitePage[] }>(`${BASE}/website-pages/public`);
  return Array.isArray(json?.data) ? json.data : [];
}

export async function fetchPublicPageBySlug(slug: string): Promise<WebsitePage | null> {
  const normalized = toPageSlug(slug);
  const json = await fetchJson<{ data?: WebsitePage }>(
    `${BASE}/website-pages/public/${encodeURIComponent(normalized)}`,
  );
  return json?.data || null;
}

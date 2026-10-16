import { cache } from "react";
import { BASE, IMAGES } from "@/lib/api";
import { NavItem, NavChildItem, NavSubItem } from "@/data/products";

interface ApiMenuItem {
  Id: number;
  label: string;
  subItems: unknown;
  sortOrder: number;
  isActive: boolean;
  imageFile?: string | null;
  image?: string | null;
}

export interface CategoryMenuItem {
  Id: number;
  label: string;
  imageUrl: string | null;
}

function normalizeChildItems(value: unknown): NavChildItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return { label: item };
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const label = record.label ?? record.name ?? record.title;
        const Id = typeof record.Id === "number" ? record.Id : undefined;
        return typeof label === "string" ? { Id, label } : null;
      }
      return null;
    })
    .filter((item): item is NavChildItem => Boolean(item?.label));
}

function normalizeSubItems(value: unknown): NavSubItem[] {
  if (Array.isArray(value)) {
    return value
      .map((item): NavSubItem | null => {
        if (typeof item === "string") return { label: item };
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          const label = record.label ?? record.name ?? record.title;
          const Id = typeof record.Id === "number" ? record.Id : undefined;
          const childItems = normalizeChildItems(record.childItems ?? record.children ?? record.child);
          return typeof label === "string" ? { Id, label, childItems } : null;
        }
        return null;
      })
      .filter((item): item is NavSubItem => Boolean(item?.label));
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try { return normalizeSubItems(JSON.parse(trimmed)); }
    catch { return trimmed.split(",").map((label) => label.trim()).filter(Boolean).map((label) => ({ label })); }
  }
  return [];
}

function toImageUrl(file: string | null | undefined): string | null {
  if (!file) return null;
  if (file.startsWith("http") || file.startsWith("data:")) return file;
  if (file.startsWith("/images/")) return `${IMAGES}${file.slice("/images".length)}`;
  if (file.startsWith("/")) return `${IMAGES.replace(/\/images$/, "")}${file}`;
  return `${IMAGES}/${file}`;
}

// Category images are stored as URLs now, so the response is small enough to
// cache; cache() still dedupes the menu + category calls within one render.
const fetchPublicMenus = cache(async (): Promise<ApiMenuItem[]> => {
  try {
    const res = await fetch(`${BASE}/menu/public`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
});

export async function fetchNavItems(): Promise<NavItem[]> {
  const items = await fetchPublicMenus();
  return items.map((m) => ({ label: m.label, sub: normalizeSubItems(m.subItems) }));
}

// Returns public category menu items with their admin-managed images.
export async function fetchCategoryMenus(): Promise<CategoryMenuItem[]> {
  const items = await fetchPublicMenus();
  return items
    .map((m) => ({ Id: m.Id, label: m.label, imageUrl: toImageUrl(m.imageFile ?? m.image) }))
    .filter((m) => m.imageUrl);
}

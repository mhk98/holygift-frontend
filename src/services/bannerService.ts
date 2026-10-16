import { BASE, IMAGES } from "@/lib/api";

export interface BannerItem {
  Id: number;
  file: string;
  type: "slider" | "side" | "popup" | "scratch_card" | "scratch_card_mobile" | "custom";
  category?: string;
  linkUrl: string | null;
  alt: string;
  sortOrder: number;
}

export interface BannersResult {
  slides: BannerItem[];
  sideBanners: BannerItem[];
  popupBanners: BannerItem[];
}

function toUrl(file: string): string {
  if (file.startsWith("http")) return file;
  return `${IMAGES}/${file}`;
}

/**
 * Banners from the admin "Scratch Card" banner categories, shown on the scratch
 * card pages: `scratch_card` for all screens, optional `scratch_card_mobile` for phones.
 */
export async function fetchScratchCardBanners(): Promise<BannerItem[]> {
  try {
    const res = await fetch(`${BASE}/banners/public`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || [])
      .filter((b: BannerItem) => b.type === "scratch_card" || b.type === "scratch_card_mobile")
      .map((b: BannerItem) => ({ ...b, file: toUrl(b.file) }));
  } catch {
    return [];
  }
}

export async function fetchBanners(): Promise<BannersResult> {
  try {
    const res = await fetch(`${BASE}/banners/public`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return { slides: [], sideBanners: [], popupBanners: [] };
    const json = await res.json();
    const items: BannerItem[] = (json.data || []).map((b: BannerItem) => ({
      ...b,
      file: toUrl(b.file),
    }));
    return {
      slides: items.filter((b) => b.type === "slider"),
      sideBanners: items.filter((b) => b.type === "side"),
      popupBanners: items.filter((b) => b.type === "popup"),
    };
  } catch {
    return { slides: [], sideBanners: [], popupBanners: [] };
  }
}

import { BASE, IMAGES } from "@/lib/api";

export interface ScratchCardPrize {
  Id: number;
  /** Stored on the claim; also the English line on the prize card. */
  name: string;
  nameBn: string | null;
  image: string | null;
  sortOrder: number;
}

/**
 * Active prizes from the admin "Scratch Card > Prizes" page, in display order.
 * Returns null when the request fails, so the form can fall back to its built-in list.
 */
export async function fetchScratchCardPrizes(): Promise<ScratchCardPrize[] | null> {
  try {
    const res = await fetch(`${BASE}/scratch-card-prizes/public`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data || []).map((p: ScratchCardPrize) => ({
      ...p,
      image: p.image ? (p.image.startsWith("http") ? p.image : `${IMAGES}/${p.image}`) : null,
    }));
  } catch {
    return null;
  }
}

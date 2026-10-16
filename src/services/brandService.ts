import { BASE, IMAGES } from "@/lib/api";

export interface BrandItem {
  Id: number;
  name: string;
  file: string;
  linkUrl: string | null;
  sortOrder: number;
}

function toUrl(file: string): string {
  if (file.startsWith("data:")) return file;
  if (file.startsWith("http")) return file;
  return `${IMAGES}/${file}`;
}

export async function fetchBrands(): Promise<BrandItem[]> {
  try {
    const res = await fetch(`${BASE}/brand/public`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).map((b: BrandItem) => ({
      ...b,
      file: toUrl(b.file),
    }));
  } catch {
    return [];
  }
}

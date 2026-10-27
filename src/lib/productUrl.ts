import type { Product } from "@/data/products";

// Products with an English slug get /product/<slug>; the rest keep /product/<id>.
export function productHref(product: Pick<Product, "id" | "slug">): string {
  return `/product/${product.slug ? encodeURIComponent(product.slug) : product.id}`;
}

// Returns the YouTube video id from watch, youtu.be, shorts or embed links.
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      id = u.searchParams.get("v");
      const match = u.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/);
      if (!id && match) id = match[1];
    }
    return id && /^[\w-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

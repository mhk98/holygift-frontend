import { apiFetch, IMAGES, BASE } from "@/lib/api";
import { ApiMeta, ApiProduct, ApiResponse } from "@/types/api";
import { Product } from "@/data/products";

interface StorefrontParams {
  searchTerm?: string;
  limit?: number;
  page?: number;
}

export interface StorefrontResult {
  products: Product[];
  meta: { total: number; page: number; limit: number };
}

export interface ProductReview {
  Id: number;
  productId: number | null;
  productName: string | null;
  customerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

function toImgUrl(file: string | null | undefined): string {
  if (!file) return "/placeholder.jpg";
  return file.startsWith("http") ? file : `${IMAGES}/${file}`;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return ["true", "1", "yes", "active"].includes(value.toLowerCase());
  }
  return false;
}

function uniqueImages(images: string[]): string[] {
  const seen = new Set<string>();
  return images.filter((image) => {
    if (!image || seen.has(image)) return false;
    seen.add(image);
    return true;
  });
}

function mapToProduct(item: ApiProduct): Product {
  const variants = (Array.isArray(item.variants) ? item.variants : []).map((v) => ({
    id: Number(v.id),
    options: v.options || {},
    oldPrice: Number(v.oldPrice || v.newPrice || 0),
    newPrice: Number(v.newPrice || 0),
    stock: Number(v.stock || 0),
    inStock: Boolean(v.inStock),
    image: v.image ? toImgUrl(v.image) : null,
  }));
  const options = (item.options || []).filter((option) => option.values?.length);
  const originalPrice = Number(item.original_price ?? item.sale_price ?? 0);
  const discountedPrice = Number(item.sale_price ?? item.original_price ?? 0);
  const apiDiscount = Number(item.discount ?? 0);
  const discount =
    apiDiscount > 0
      ? apiDiscount
      : originalPrice > 0 && discountedPrice > 0 && originalPrice > discountedPrice
        ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
        : 0;

  return {
    id: item.Id,
    name: item.name,
    originalPrice,
    discountedPrice,
    discount,
    image: toImgUrl(item.file),
    gallery: uniqueImages((item.gallery || []).map((f) => toImgUrl(f))),
    description: item.description ?? null,
    shortDescription: item.shortDescription ?? null,
    features: item.features || [],
    sku: item.sku ?? null,
    freeShipping: toBoolean(item.freeShipping),
    hasVariants: variants.length > 1,
    priceMin: Number(item.price_min ?? discountedPrice),
    priceMax: Number(item.price_max ?? discountedPrice),
    options,
    variants,
    inStock: item.inStock,
    category: item.category,
    subCategory: item.subCategory,
    childCategory: item.childCategory ?? item.childcategory ?? null,
  };
}

// Returns null only when the product does not exist; network/server errors
// throw so a cached product page is kept instead of being replaced by a 404.
export async function fetchProductById(id: number): Promise<Product | null> {
  const res = await fetch(`${BASE}/product/storefront/${id}`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(15_000) } as RequestInit);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch product ${id}: ${res.status}`);
  const json = await res.json();
  if (!json.data) return null;
  return mapToProduct(json.data as ApiProduct);
}

export async function fetchStorefrontProducts(
  params: StorefrontParams = {}
): Promise<StorefrontResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (params.searchTerm?.trim()) qs.set("searchTerm", params.searchTerm.trim());

  const raw = await fetch(`${BASE}/product/storefront?${qs.toString()}`, {
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(15_000),
  } as RequestInit);
  if (!raw.ok) throw new Error("Failed to fetch storefront products");
  const res: ApiResponse<{ products: ApiProduct[]; meta: ApiMeta }> = await raw.json();

  const products = (res.data?.products || []).map(mapToProduct);

  return {
    products,
    meta: res.data?.meta ?? { total: products.length, page, limit },
  };
}

export async function fetchProductReviews(
  product: Pick<Product, "id" | "name">,
): Promise<ProductReview[]> {
  const qs = new URLSearchParams({
    productId: String(product.id),
    productName: product.name,
    limit: "20",
  });

  try {
    const res = await fetch(`${BASE}/review/public?${qs.toString()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    } as RequestInit);
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

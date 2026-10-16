// ─── Types ───────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  image: string;
  gallery?: string[];
  description?: string | null;
  shortDescription?: string | null;
  features?: string[];
  sku?: string | null;
  freeShipping?: boolean;
  /** True when the customer must pick a variant (more than one to choose from). */
  hasVariants?: boolean;
  priceMin?: number;
  priceMax?: number;
  options?: ProductOption[];
  variants?: ProductVariant[];
  inStock?: boolean;
  category?: string | null;
  subCategory?: string | null;
  childCategory?: string | null;
}

export interface ProductVariant {
  id: number;
  options: Record<string, string>;
  oldPrice: number;
  newPrice: number;
  stock: number;
  inStock: boolean;
  image?: string | null;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface NavItem {
  label: string;
  sub: NavSubItem[];
}

export interface NavSubItem {
  Id?: number;
  label: string;
  childItems?: NavChildItem[];
}

export interface NavChildItem {
  Id?: number;
  label: string;
}

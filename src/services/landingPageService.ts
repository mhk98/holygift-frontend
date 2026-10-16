import { BASE } from "@/lib/api";

export interface LandingProductOption {
  id?: string | number;
  productId?: string | number;
  name?: string;
  price?: string | number;
  originalPrice?: string | number;
  image?: string;
}

export interface LandingPageData {
  Id: number;
  pageType?: string;
  productId?: number | null;
  product?: string | null;
  title: string;
  subTitle?: string | null;
  bannerImageUrl?: string | null;
  prizeImageUrl?: string | null;
  reviewImages?: string[] | string | null;
  shortDescription?: string | null;
  video?: string | null;
  reviewTitle?: string | null;
  descriptionTitle?: string | null;
  description?: string | null;
  whyChooseTitle?: string | null;
  whyChooseUs?: string | null;
  price?: string | number | null;
  originalPrice?: string | number | null;
  phone?: string | null;
  template?: string | null;
  countdown?: string | null;
  regularData?: Record<string, unknown> | string | null;
  status?: boolean;
  freeShippingProductIds?: number[];
}

export async function fetchLandingPage(id: string | number): Promise<LandingPageData | null> {
  try {
    const res = await fetch(`${BASE}/landing-pages/public/${encodeURIComponent(String(id))}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(15_000),
    } as RequestInit);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}


export interface LandingHeaderSocialLink {
  platform?: string;
  label?: string;
  url?: string;
}

export interface LandingHeaderData {
  helpText?: string;
  supportPhone?: string;
  supportText?: string;
  supportUrl?: string;
  trackOrderText?: string;
  followUsText?: string;
  socialLinks?: LandingHeaderSocialLink[];
  logoUrl?: string | null;
  logoAlt?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  status?: boolean;
}

export async function fetchLandingHeader(): Promise<LandingHeaderData | null> {
  try {
    const res = await fetch(`${BASE}/landing-pages/header/public`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(15_000),
    } as RequestInit);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

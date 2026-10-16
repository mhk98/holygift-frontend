import { BASE, IMAGES } from "@/lib/api";

export interface SiteSetting {
  logoUrl: string | null;
  faviconUrl: string | null;
  marqueeText: string | null;
  metaTitle: string | null;
  metaKeyword: string | null;
  metaDescription: string | null;
  bkashNumber: string | null;
  nagadNumber: string | null;
  rocketNumber: string | null;
  orderBlockLimit: string | null;
  blockTime: string | null;
  timeUnit: string | null;
  // Footer
  hotlineNumber: string | null;
  hotMail: string | null;
  phoneNumber: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  whatsappNumber: string | null;
  mapLink: string | null;
  copyrightText: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  whatsappUrl: string | null;
  messengerUrl: string | null;
  telegramUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  tiktokUrl: string | null;
  deliveryPartnerUrl: string | null;
  websiteFooter: FooterSetting;
}

function toUrl(file: string | null | undefined): string | null {
  if (!file) return null;
  if (file.startsWith("http") || file.startsWith("data:") || file.startsWith("/")) return file;
  return `${IMAGES}/${file}`;
}

export interface FooterLinkSetting {
  label: string;
  url: string;
}

export interface FooterSetting {
  status?: boolean;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  customerLinksTitle?: string | null;
  customerLinks?: FooterLinkSetting[];
  quickLinksTitle?: string | null;
  quickLinks?: FooterLinkSetting[];
  importantLinksTitle?: string | null;
  importantLinks?: FooterLinkSetting[];
  socialLinksTitle?: string | null;
  socialLinks?: FooterSocialLinkSetting[];
  deliveryPartnerTitle?: string | null;
  deliveryPartnerFile?: string | null;
  deliveryPartnerUrl?: string | null;
  deliveryPartners?: FooterDeliveryPartnerSetting[];
  paymentMethodsImageUrl?: string | null;
}

export interface FooterDeliveryPartnerSetting {
  label: string;
  imageUrl: string;
}

export interface FooterSocialLinkSetting extends FooterLinkSetting {
  platform: string;
  active?: boolean;
}

function toLinks(value: unknown): FooterLinkSetting[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const link = item as Record<string, unknown>;
      return {
        label: String(link.label || link.name || "").trim(),
        url: String(link.url || link.link || "#").trim() || "#",
      };
    })
    .filter((item) => item.label);
}

function toSocialLinks(value: unknown): FooterSocialLinkSetting[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const link = item as Record<string, unknown>;
      const platform = String(link.platform || link.key || "").trim();
      return {
        platform,
        label: String(link.label || link.name || platform || "").trim(),
        url: String(link.url || link.link || "#").trim() || "#",
        active: link.active !== false,
      };
    })
    .filter((item) => item.active && item.label);
}

function toDeliveryPartners(value: unknown): FooterDeliveryPartnerSetting[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const partner = item as Record<string, unknown>;
      const imageUrl = toUrl(
        typeof partner.imageUrl === "string"
          ? partner.imageUrl
          : typeof partner.url === "string"
            ? partner.url
            : typeof partner.file === "string"
              ? partner.file
              : null,
      );
      return {
        label: String(partner.label || partner.name || "Delivery Partner").trim(),
        imageUrl: imageUrl || "",
      };
    })
    .filter((item) => item.imageUrl);
}

function toFooter(value: unknown): FooterSetting {
  const d = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  const deliveryPartnerUrl = toUrl(
    typeof d.deliveryPartnerUrl === "string" ? d.deliveryPartnerUrl : null,
  );
  const deliveryPartners = toDeliveryPartners(d.deliveryPartners);
  if (deliveryPartnerUrl && !deliveryPartners.some((item) => item.imageUrl === deliveryPartnerUrl)) {
    deliveryPartners.unshift({ label: "Delivery Partner", imageUrl: deliveryPartnerUrl });
  }

  return {
    status: d.status !== false,
    logoUrl: toUrl(typeof d.logoUrl === "string" ? d.logoUrl : null),
    address: typeof d.address === "string" ? d.address : null,
    phone: typeof d.phone === "string" ? d.phone : null,
    email: typeof d.email === "string" ? d.email : null,
    customerLinksTitle: typeof d.customerLinksTitle === "string" ? d.customerLinksTitle : null,
    customerLinks: toLinks(d.customerLinks),
    quickLinksTitle: typeof d.quickLinksTitle === "string" ? d.quickLinksTitle : null,
    quickLinks: toLinks(d.quickLinks),
    importantLinksTitle: typeof d.importantLinksTitle === "string" ? d.importantLinksTitle : null,
    importantLinks: toLinks(d.importantLinks),
    socialLinksTitle: typeof d.socialLinksTitle === "string" ? d.socialLinksTitle : null,
    socialLinks: toSocialLinks(d.socialLinks),
    deliveryPartnerTitle: typeof d.deliveryPartnerTitle === "string" ? d.deliveryPartnerTitle : null,
    deliveryPartnerFile: typeof d.deliveryPartnerFile === "string" ? d.deliveryPartnerFile : null,
    deliveryPartnerUrl,
    deliveryPartners,
    paymentMethodsImageUrl: toUrl(
      typeof d.paymentMethodsImageUrl === "string" ? d.paymentMethodsImageUrl : null,
    ),
  };
}

export async function fetchSiteSettings(): Promise<SiteSetting> {
  const empty: SiteSetting = {
    logoUrl: null, faviconUrl: null, marqueeText: null,
    metaTitle: null, metaKeyword: null, metaDescription: null,
    bkashNumber: null, nagadNumber: null, rocketNumber: null,
    orderBlockLimit: null, blockTime: null, timeUnit: null,
    hotlineNumber: null, hotMail: null, phoneNumber: null,
    address: null, phone: null, email: null, whatsappNumber: null,
    mapLink: null, copyrightText: null,
    facebookUrl: null, instagramUrl: null, youtubeUrl: null,
    whatsappUrl: null, messengerUrl: null, telegramUrl: null,
    twitterUrl: null, linkedinUrl: null, tiktokUrl: null,
    deliveryPartnerUrl: null,
    websiteFooter: {},
  };
  try {
    const res = await fetch(`${BASE}/site-settings/public`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return empty;
    const json = await res.json();
    const d = json.data || {};
    const logoFile = d.logoFile || d.whiteLogo || d.darkLogo || null;
    const faviconFile = d.faviconFile || d.faviconLogo || null;
    const websiteFooter = toFooter(d.websiteFooter);
    return {
      logoUrl:            toUrl(logoFile),
      faviconUrl:         toUrl(faviconFile),
      marqueeText:        d.marqueeText || d.scrollText || null,
      metaTitle:          d.metaTitle          || null,
      metaKeyword:        d.metaKeyword        || null,
      metaDescription:    d.metaDescription    || null,
      bkashNumber:        d.bkashNumber        || null,
      nagadNumber:        d.nagadNumber        || null,
      rocketNumber:       d.rocketNumber       || null,
      orderBlockLimit:    d.orderBlockLimit    || null,
      blockTime:          d.blockTime          || null,
      timeUnit:           d.timeUnit           || null,
      hotlineNumber:      d.hotlineNumber      || null,
      hotMail:            d.hotMail            || null,
      phoneNumber:        d.phoneNumber        || null,
      address:            d.address            || null,
      phone:              d.phone              || d.phoneNumber || d.hotlineNumber || null,
      email:              d.email              || d.hotMail || null,
      whatsappNumber:     d.whatsappNumber     || null,
      mapLink:            d.mapLink            || null,
      copyrightText:      d.copyrightText      || null,
      facebookUrl:        d.facebookUrl        || null,
      instagramUrl:       d.instagramUrl       || null,
      youtubeUrl:         d.youtubeUrl         || null,
      whatsappUrl:        d.whatsappUrl        || null,
      messengerUrl:       d.messengerUrl       || null,
      telegramUrl:        d.telegramUrl        || null,
      twitterUrl:         d.twitterUrl         || d.xUrl || null,
      linkedinUrl:        d.linkedinUrl        || null,
      tiktokUrl:          d.tiktokUrl          || null,
      deliveryPartnerUrl: toUrl(d.deliveryPartnerFile) || websiteFooter.deliveryPartnerUrl || toUrl(websiteFooter.deliveryPartnerFile),
      websiteFooter,
    };
  } catch {
    return empty;
  }
}

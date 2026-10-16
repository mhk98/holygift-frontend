"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchPublicPages, type WebsitePage } from "@/services/pageService";
import { fetchSiteSettings, type SiteSetting } from "@/services/settingService";

const SOCIAL_DEFS = [
  {
    key: "facebookUrl" as const,
    name: "Facebook",
    color: "#1877f2",
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
      </svg>
    ),
  },
  {
    key: "instagramUrl" as const,
    name: "Instagram",
    color: "#e1306c",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "youtubeUrl" as const,
    name: "YouTube",
    color: "#ff0000",
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
        <polygon
          fill="white"
          points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"
        />
      </svg>
    ),
  },
  {
    key: "whatsappUrl" as const,
    name: "WhatsApp",
    color: "#25d366",
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.136.563 4.14 1.544 5.876L.057 23.6a.5.5 0 00.61.666l5.878-1.54A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.888a9.87 9.87 0 01-5.032-1.378l-.36-.214-3.733.979.998-3.648-.235-.374A9.863 9.863 0 012.112 12C2.112 6.58 6.58 2.112 12 2.112c5.42 0 9.888 4.468 9.888 9.888 0 5.42-4.468 9.888-9.888 9.888z" />
      </svg>
    ),
  },
  {
    key: "messengerUrl" as const,
    name: "Messenger",
    color: "#0099ff",
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 5.149 0 11.5c0 3.612 1.852 6.836 4.75 8.934V24l4.333-2.375c1.16.312 2.386.48 3.66.48C20.627 22.105 24 17.044 24 11.5 24 5.15 18.627 0 12 0zm1.208 15.484l-3.093-3.28-6.054 3.28L10.98 8.516l3.168 3.28 5.98-3.28-6.92 6.968z" />
      </svg>
    ),
  },
  {
    key: "telegramUrl" as const,
    name: "Telegram",
    color: "#229ED9",
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9.78 15.43l-.37 5.2c.53 0 .76-.23 1.04-.5l2.5-2.39 5.18 3.79c.95.52 1.62.25 1.88-.88L23.41 4.7c.35-1.61-.58-2.24-1.5-1.9L1.94 10.5c-1.36.53-1.34 1.28-.23 1.62l5.1 1.59L18.67 6.3c.56-.37 1.07-.17.65.2l-9.54 8.93z" />
      </svg>
    ),
  },
  {
    key: "twitterUrl" as const,
    name: "Twitter / X",
    color: "#111827",
    icon: <span style={{ fontSize: 13, fontWeight: 900, lineHeight: 1 }}>X</span>,
  },
  {
    key: "linkedinUrl" as const,
    name: "LinkedIn",
    color: "#0A66C2",
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S.02 4.88.02 3.5 1.14 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4v15h-4V8zm7.5 0h3.83v2.05h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.14V23h-4v-7.85c0-1.87-.03-4.28-2.61-4.28-2.61 0-3.01 2.04-3.01 4.15V23h-4V8z" />
      </svg>
    ),
  },
  {
    key: "tiktokUrl" as const,
    name: "TikTok",
    color: "#000000",
    icon: <span style={{ fontSize: 11, fontWeight: 900, lineHeight: 1 }}>TT</span>,
  },
];

const DEFAULT_CUSTOMER_LINKS = [
  { label: "Register", url: "/login?mode=register" },
  { label: "Login", url: "/login" },
  { label: "Forgot Password?", url: "/login" },
  { label: "Contact", url: "/contact" },
];

const DEFAULT_FOOTER_SOCIAL_KEYS = new Set([
  "facebookUrl",
  "instagramUrl",
  "youtubeUrl",
  "messengerUrl",
  "telegramUrl",
  "twitterUrl",
  "linkedinUrl",
  "tiktokUrl",
]);

function ColHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: 14,
        fontWeight: 900,
        color: "#111",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 20,
      }}
    >
      {children}
    </h3>
  );
}

function FooterLink({
  href = "#",
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        style={{
          fontSize: 14,
          color: "#444",
          lineHeight: "24px",
          display: "block",
        }}
        className="hover:text-[#404040] transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}

interface Props {
  settings?: Partial<SiteSetting> | null;
  // Fetched on the server by SiteFooter; skips the client request below.
  pages?: WebsitePage[];
}

export default function Footer({ settings, pages: pagesProp }: Props) {
  const [resolvedSettings, setResolvedSettings] = useState<Partial<SiteSetting> | null>(settings || null);
  const [fetchedPages, setFetchedPages] = useState<WebsitePage[]>([]);
  const pages = pagesProp ?? fetchedPages;
  const s = settings || resolvedSettings || {};
  const logoUrl = s.logoUrl || null;
  const footerConfig = s.websiteFooter || {};
  const deliveryPartners = footerConfig.deliveryPartners?.length
    ? footerConfig.deliveryPartners
    : s.deliveryPartnerUrl
      ? [{ label: "Delivery Partner", imageUrl: s.deliveryPartnerUrl }]
      : [];
  const socialLinks = footerConfig.socialLinks?.length
    ? footerConfig.socialLinks.map((item, index) => {
      const platform = (item.platform || item.label || "").toLowerCase();
      const def =
        SOCIAL_DEFS.find((social) => social.key.toLowerCase().startsWith(platform)) ||
        SOCIAL_DEFS.find((social) => social.name.toLowerCase().includes(platform)) ||
        SOCIAL_DEFS[0];
      return { ...def, id: `${platform || def.name}-${index}`, name: item.label || def.name, url: item.url || "#" };
    })
    : SOCIAL_DEFS
      .filter((social) => DEFAULT_FOOTER_SOCIAL_KEYS.has(social.key))
      .map((social) => ({ ...social, id: social.key, url: s[social.key] || null }))
      .filter((social) => social.url);
  const configuredUsefulLinks = [
    ...(footerConfig.quickLinks || []),
    ...(footerConfig.importantLinks || []),
  ];
  const customerLinks = footerConfig.customerLinks?.length
    ? footerConfig.customerLinks
    : DEFAULT_CUSTOMER_LINKS;
  const address = footerConfig.address || s.address || null;
  const phone = footerConfig.phone || s.phone || null;
  const email = footerConfig.email || s.email || null;
  const copyright = s.copyrightText || null;
  const footerLogoUrl = footerConfig.logoUrl || logoUrl;
  const hasContactInfo = Boolean(footerLogoUrl || address || phone || email);

  // Split copyright into text + brand link if it contains "Developed By"
  const devIdx = copyright?.indexOf("Developed By") ?? -1;
  const copyrightMain =
    devIdx >= 0
      ? copyright!.slice(0, devIdx + "Developed By".length)
      : copyright || "";
  const copyrightBrand =
    devIdx >= 0 ? copyright!.slice(devIdx + "Developed By".length).trim() : "";

  useEffect(() => {
    if (settings) return;
    fetchSiteSettings().then(setResolvedSettings).catch(() => setResolvedSettings({}));
  }, [settings]);

  useEffect(() => {
    if (pagesProp) return;
    fetchPublicPages().then(setFetchedPages).catch(() => setFetchedPages([]));
  }, [pagesProp]);

  if (footerConfig.status === false) return null;

  return (
    <footer className="bg-white mt-4">
      <div
        style={{
          width: "90%",
          margin: "0 auto",
          paddingTop: 50,
          paddingBottom: 50,
        }}
      >
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: 40 }}
        >
          {hasContactInfo && (
            <div>
              {footerLogoUrl && (
                <Link href="/" style={{ display: "block", marginBottom: 16 }}>
                  <div className="relative" style={{ width: 150, height: 65 }}>
                    <Image
                      src={footerLogoUrl}
                      alt="Logo"
                      fill
                      className="object-contain object-left"
                    />
                  </div>
                </Link>
              )}
              <div
                style={{
                  fontSize: 14,
                  color: "#444",
                  lineHeight: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {address && <span>{address}</span>}
                {phone && <span>{phone}</span>}
                {email && <span>{email}</span>}
              </div>
            </div>
          )}

          {/* Col 2 — Useful Links */}
          {(configuredUsefulLinks.length > 0 || pages.length > 0) && (
          <div>
            <ColHeading>{footerConfig.quickLinksTitle || "USEFUL LINK"}</ColHeading>
            <ul style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {configuredUsefulLinks.length > 0
                ? configuredUsefulLinks.map((link) => (
                  <FooterLink key={`${link.label}-${link.url}`} href={link.url}>
                    {link.label}
                  </FooterLink>
                ))
                : pages.map((page) => (
                  <FooterLink key={page.Id} href={`/page/${page.slug}`}>
                    {page.title || page.name}
                  </FooterLink>
                ))}
            </ul>
          </div>
          )}

          {/* Col 3 — Customer Links */}
          {customerLinks.length > 0 && (
          <div>
            <ColHeading>{footerConfig.customerLinksTitle || "CUSTOMER LINK"}</ColHeading>
            <ul style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {customerLinks.map((link) => (
                <FooterLink key={`${link.label}-${link.url}`} href={link.url}>
                  {link.label}
                </FooterLink>
              ))}
            </ul>
          </div>
          )}

          {/* Col 4 — Follow Us + Delivery Partner */}
          {(socialLinks.length > 0 || deliveryPartners.length > 0) && (
          <div>
            {socialLinks.length > 0 && (
              <>
                <ColHeading>{footerConfig.socialLinksTitle || "FOLLOW US"}</ColHeading>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginBottom: 24,
                  }}
                >
                  {socialLinks.map((social) => (
                  <a
                    key={social.id}
                    href={social.url!}
                    target={social.url === "#" ? undefined : "_blank"}
                    rel={social.url === "#" ? undefined : "noreferrer"}
                    title={social.name}
                    className="flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 5,
                      backgroundColor: social.color,
                      flexShrink: 0,
                    }}
                  >
                    {social.icon}
                  </a>
                  ))}
                </div>
              </>
            )}

            {deliveryPartners.length > 0 && (
              <>
                <ColHeading>{footerConfig.deliveryPartnerTitle || "DELIVERY PARTNER"}</ColHeading>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {deliveryPartners.map((partner, index) => (
                    <div
                      key={`${partner.imageUrl}-${index}`}
                      className="relative"
                      style={{ width: 88, height: 42 }}
                    >
                      <Image
                        src={partner.imageUrl}
                        alt={partner.label || "Delivery Partner"}
                        fill
                        className="object-contain object-left"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Copyright */}
      {copyright && (
      <div className="bg-[#14203A] py-3.5 text-center">
        <p style={{ fontSize: 13, color: "#aaa" }}>
          {copyrightMain}{" "}
          {copyrightBrand && (
            <a
              href="#"
              className="hover:underline"
              style={{ color: "#404040" }}
            >
              {copyrightBrand}
            </a>
          )}
        </p>
      </div>
      )}
    </footer>
  );
}

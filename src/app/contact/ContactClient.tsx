"use client";
import type { SiteChromeSlots } from "@/components/SiteChrome";
import { useEffect, useMemo, useState } from "react";
import FloatingContact from "@/components/FloatingContact";
import MarqueeBanner from "@/components/MarqueeBanner";
import { fetchSiteSettings, type SiteSetting } from "@/services/settingService";

type ContactItem = {
  key: string;
  label: string;
  value: string;
  sub?: string;
  href?: string;
  target?: string;
  bg: string;
  color: string;
  icon: "phone" | "mail" | "map" | "whatsapp";
};

const clean = (value?: string | null) => String(value || "").trim();

const waUrlFromPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const phone = digits.startsWith("880")
    ? digits
    : digits.startsWith("0")
      ? `88${digits}`
      : digits;
  return `https://wa.me/${phone}`;
};

function ContactIcon({
  icon,
  color,
}: {
  icon: ContactItem["icon"];
  color: string;
}) {
  if (icon === "mail") {
    return (
      <svg
        width="24"
        height="24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    );
  }

  if (icon === "map") {
    return (
      <svg
        width="24"
        height="24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    );
  }

  if (icon === "whatsapp") {
    return (
      <svg width="24" height="24" fill={color} viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.136.563 4.14 1.544 5.876L.057 23.6a.5.5 0 00.61.666l5.878-1.54A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
      </svg>
    );
  }

  return (
    <svg
      width="24"
      height="24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.34 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012.25 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
    </svg>
  );
}

function ContactCard({ item }: { item: ContactItem }) {
  const content = (
    <>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: item.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <ContactIcon icon={item.icon} color={item.color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 3 }}>
          {item.label}
        </p>
        <p
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1.4,
            wordBreak: "break-word",
          }}
        >
          {item.value}
        </p>
        {item.sub && (
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            {item.sub}
          </p>
        )}
      </div>
    </>
  );

  const style = {
    background: "#fff",
    borderRadius: 16,
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
    textDecoration: "none",
  };

  if (!item.href) return <div style={style}>{content}</div>;

  return (
    <a
      href={item.href}
      target={item.target}
      rel={item.target ? "noopener noreferrer" : undefined}
      style={style}
    >
      {content}
    </a>
  );
}

interface Props extends SiteChromeSlots {
  initialSettings?: SiteSetting | null;
}

export default function ContactPage({ header, footer, initialSettings }: Props) {
  const [settings, setSettings] = useState<SiteSetting | null>(initialSettings ?? null);
  const [loading, setLoading] = useState(!initialSettings);

  useEffect(() => {
    if (initialSettings) return;
    fetchSiteSettings()
      .then(setSettings)
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, [initialSettings]);

  const contactItems = useMemo<ContactItem[]>(() => {
    const phone = clean(settings?.phoneNumber || settings?.phone);
    const hotline = clean(settings?.hotlineNumber);
    const email = clean(settings?.email);
    const hotMail = clean(settings?.hotMail);
    const address = clean(settings?.address);
    const mapLink = clean(settings?.mapLink);
    const whatsappNumber = clean(
      settings?.whatsappNumber || settings?.phoneNumber || settings?.phone,
    );
    const whatsappUrl =
      waUrlFromPhone(whatsappNumber) || clean(settings?.whatsappUrl);

    return [
      phone && {
        key: "phone",
        label: "ফোন",
        value: phone,
        href: `tel:${phone}`,
        bg: "#eff6ff",
        color: "#404040",
        icon: "phone" as const,
      },
      hotline && {
        key: "hotline",
        label: "হটলাইন",
        value: hotline,
        href: `tel:${hotline}`,
        bg: "#fef3c7",
        color: "#d97706",
        icon: "phone" as const,
      },
      email && {
        key: "email",
        label: "ইমেইল",
        value: email,
        href: `mailto:${email}`,
        bg: "#fef2f2",
        color: "#111111",
        icon: "mail" as const,
      },
      hotMail && {
        key: "hotMail",
        label: "হট মেইল",
        value: hotMail,
        href: `mailto:${hotMail}`,
        bg: "#fdf2f8",
        color: "#db2777",
        icon: "mail" as const,
      },
      address && {
        key: "address",
        label: "ঠিকানা",
        value: address,
        href:
          mapLink ||
          `https://maps.google.com/?q=${encodeURIComponent(address)}`,
        target: "_blank",
        bg: "#f0fdf4",
        color: "#16a34a",
        icon: "map" as const,
      },
      whatsappNumber && {
        key: "whatsapp",
        label: "WhatsApp",
        value: whatsappNumber,
        sub: "মেসেজ করুন",
        href: whatsappUrl,
        target: "_blank",
        bg: "#f0fdf4",
        color: "#25d366",
        icon: "whatsapp" as const,
      },
    ].filter(Boolean) as ContactItem[];
  }, [settings]);

  const mapLink = clean(settings?.mapLink);
  const hasContact = contactItems.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <MarqueeBanner text={settings?.marqueeText ?? null} />
      {header}
      <main className="flex-1 py-10">
        <div style={{ width: "90%", maxWidth: 980, margin: "40px auto 40px" }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#1f2937",
              marginBottom: 4,
            }}
          >
            যোগাযোগ করুন
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 32 }}>
            আমাদের সাথে যেকোনো প্রশ্ন বা সমস্যায় যোগাযোগ করুন।
          </p>

          {loading && (
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 24,
                color: "#6b7280",
                fontSize: 14,
              }}
            >
              Loading contact information...
            </div>
          )}

          {!loading && !hasContact && (
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 24,
                color: "#6b7280",
                fontSize: 14,
              }}
            >
              Contact information is not available right now.
            </div>
          )}

          {hasContact && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {contactItems.map((item) => (
                <ContactCard key={item.key} item={item} />
              ))}
            </div>
          )}

          {mapLink && (
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              }}
            >
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: 12,
                }}
              >
                লোকেশন
              </h2>
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 42,
                  padding: "0 18px",
                  borderRadius: 8,
                  background: "#404040",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Google Map খুলুন
              </a>
            </div>
          )}
        </div>
      </main>
      {footer}
      <FloatingContact settings={settings} />
    </div>
  );
}

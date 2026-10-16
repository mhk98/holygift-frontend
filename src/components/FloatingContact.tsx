"use client";
import { useEffect, useState } from "react";
import { fetchSiteSettings, type SiteSetting } from "@/services/settingService";
import { trackPixelEvent } from "@/lib/pixel";

const CONTACT_DEFS = [
  {
    key: "phone" as const,
    label: "Call",
    href: (value: string) => `tel:${value}`,
    color: "#2db742",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .98h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
      </svg>
    ),
  },
  {
    key: "whatsappUrl" as const,
    label: "WhatsApp",
    href: (value: string) => value,
    color: "#25d366",
    icon: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.136.563 4.14 1.544 5.876L.057 23.6a.5.5 0 00.61.666l5.878-1.54A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.888a9.87 9.87 0 01-5.032-1.378l-.36-.214-3.733.979.998-3.648-.235-.374A9.863 9.863 0 012.112 12C2.112 6.58 6.58 2.112 12 2.112c5.42 0 9.888 4.468 9.888 9.888 0 5.42-4.468 9.888-9.888 9.888z"/>
      </svg>
    ),
  },
  {
    key: "messengerUrl" as const,
    label: "Messenger",
    href: (value: string) => value,
    color: "#0099ff",
    icon: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 5.149 0 11.5c0 3.612 1.852 6.836 4.75 8.934V24l4.333-2.375c1.16.312 2.386.48 3.66.48C20.627 22.105 24 17.044 24 11.5 24 5.15 18.627 0 12 0zm1.208 15.484l-3.093-3.28-6.054 3.28L10.98 8.516l3.168 3.28 5.98-3.28-6.92 6.968z"/>
      </svg>
    ),
  },
  {
    key: "telegramUrl" as const,
    label: "Telegram",
    href: (value: string) => value,
    color: "#229ED9",
    icon: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9.78 15.43l-.37 5.2c.53 0 .76-.23 1.04-.5l2.5-2.39 5.18 3.79c.95.52 1.62.25 1.88-.88L23.41 4.7c.35-1.61-.58-2.24-1.5-1.9L1.94 10.5c-1.36.53-1.34 1.28-.23 1.62l5.1 1.59L18.67 6.3c.56-.37 1.07-.17.65.2l-9.54 8.93z" />
      </svg>
    ),
  },
];

interface Props {
  settings?: Partial<SiteSetting> | null;
}

function trackContact(label: string, value: string) {
  trackPixelEvent("Contact", {
    content_ids: [],
    content_name: label,
    content_type: "contact",
    value: 0,
    currency: "BDT",
    num_items: 1,
  }, { phone: value });
}

export default function FloatingContact({ settings }: Props) {
  const [open, setOpen] = useState(false);
  const [resolvedSettings, setResolvedSettings] = useState<Partial<SiteSetting> | null>(settings || null);
  const source = settings || resolvedSettings || {};
  const contacts = CONTACT_DEFS
    .map((contact) => {
      const value = source[contact.key];
      if (!value) return null;
      return {
        ...contact,
        label: contact.key === "phone" ? value : contact.label,
        href: contact.href(value),
      };
    })
    .filter((contact): contact is NonNullable<typeof contact> => Boolean(contact));

  useEffect(() => {
    if (settings) {
      setResolvedSettings(settings);
      return;
    }
    fetchSiteSettings().then(setResolvedSettings).catch(() => setResolvedSettings({}));
  }, [settings]);

  if (contacts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-4 z-[100] flex flex-col items-end gap-2.5">

      {/* Expanded contact options */}
      {open && (
        <div className="flex flex-col gap-2.5 items-end animate-fadeIn">
          {contacts.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
              onClick={() => trackContact(c.label, c.href)}
              className="flex items-center gap-2.5 bg-white shadow-md hover:shadow-lg transition-shadow"
              style={{ borderRadius: 50, padding: "7px 16px 7px 7px", border: "1px solid #eee" }}
            >
              {/* Colored icon circle */}
              <span
                className="flex items-center justify-center text-white shrink-0"
                style={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: c.color }}
              >
                {c.icon}
              </span>
              {/* Label */}
              <span style={{ fontSize: 13, fontWeight: 600, color: "#333", whiteSpace: "nowrap" }}>
                {c.label}
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Close button — red X (shown when open) */}
      {open && (
        <button
          onClick={() => setOpen(false)}
          className="flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-lg"
          style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#111111" }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      )}

      {/* Main phone toggle button — always visible when closed */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-xl"
          style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: "#111111" }}
          title="Contact Us"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .98h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
          </svg>
        </button>
      )}

    </div>
  );
}

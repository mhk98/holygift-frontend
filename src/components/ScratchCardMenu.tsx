"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const SECONDARY = "#404040";

const TICKET_ICON = (
  <><path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7z" /><path d="M9.5 9.5h.01M14.5 14.5h.01M15 9l-6 6" /></>
);

const MENU_LINKS = [
  {
    href: "/scratch-card",
    label: "স্ক্র্যাচ কার্ড জমা দিন",
    hint: "পুরস্কার দাবি করুন",
    icon: <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12M7 9l5-5 5 5" />,
  },
  {
    href: "/scratch-card/track",
    label: "স্ক্র্যাচ কার্ড ট্র্যাক করুন",
    hint: "ফোন নম্বর দিয়ে অবস্থা দেখুন",
    icon: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></>,
  },
];

/**
 * Header "Scratch Card" entry: opens a dropdown to submit a card or track
 * earlier claims by phone. `compact` shrinks the icon and label for the mobile top bar.
 */
export default function ScratchCardMenu({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#111111] transition-colors"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <svg width={compact ? 22 : 24} height={compact ? 22 : 24} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          {TICKET_ICON}
        </svg>
        <span style={{ fontSize: compact ? 10 : 11, display: "flex", alignItems: "center", gap: 2, whiteSpace: "nowrap" }}>
          Scratch Card
          <svg width={10} height={10} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[9999]" style={{ paddingTop: 10 }}>
          <div
            role="menu"
            className="bg-white shadow-2xl"
            style={{ width: 260, borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden", padding: "6px 0" }}
          >
            {MENU_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center hover:bg-gray-50 transition-colors"
                style={{ gap: 12, padding: "10px 16px", textDecoration: "none" }}
              >
                <svg width={18} height={18} fill="none" stroke={SECONDARY} strokeWidth={1.8} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>{item.icon}</svg>
                <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>{item.label}</span>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{item.hint}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

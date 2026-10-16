"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCustomer } from "@/context/CustomerContext";
import CustomerAvatar from "@/components/CustomerAvatar";

const SECONDARY = "#404040";

const MENU_LINKS = [
  {
    href: "/account?tab=profile",
    label: "আমার প্রোফাইল",
    icon: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  },
  {
    href: "/account?tab=orders",
    label: "আমার অর্ডার",
    icon: <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />,
  },
  {
    href: "/account?tab=password",
    label: "পাসওয়ার্ড পরিবর্তন",
    icon: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>,
  },
];

/**
 * Header account entry: a Login link when signed out, otherwise an avatar
 * button that opens a dropdown with profile, orders, password and logout.
 * `compact` shrinks the icon and label for the mobile top bar.
 */
export default function AccountMenu({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { isLoggedIn, customer, logout } = useCustomer();
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

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        aria-label="Login"
        className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#111111] transition-colors"
      >
        <svg width={compact ? 22 : 24} height={compact ? 22 : 24} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        <span style={{ fontSize: compact ? 10 : 11 }}>Login</span>
      </Link>
    );
  }

  const firstName = customer?.firstName !== undefined
    ? customer.firstName.trim() || "Account"
    : (customer?.name || "").trim().split(/\s+/)[0] || "Account";

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.push("/");
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#111111] transition-colors"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <CustomerAvatar
          customer={customer}
          size={compact ? 22 : 28}
          style={{
            boxShadow: open ? `0 0 0 2px #fff, 0 0 0 4px ${SECONDARY}` : "none",
            transition: "box-shadow 0.15s",
          }}
        />
        <span style={{ fontSize: compact ? 10 : 11, display: "flex", alignItems: "center", gap: 2, maxWidth: compact ? 60 : 80 }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstName}</span>
          <svg width={10} height={10} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[9999]" style={{ paddingTop: 10 }}>
          <div
            role="menu"
            className="bg-white shadow-2xl"
            style={{ width: 240, borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}
          >
            {/* Signed-in user */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#F5F5F5", borderBottom: "1px solid #eee" }}>
              <CustomerAvatar customer={customer} size={40} />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customer?.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>{customer?.phone}</p>
              </div>
            </div>

            <div style={{ padding: "6px 0" }}>
              {MENU_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center hover:bg-gray-50 transition-colors"
                  style={{ gap: 12, padding: "10px 16px", fontSize: 14, color: "#374151", textDecoration: "none" }}
                >
                  <svg width={18} height={18} fill="none" stroke={SECONDARY} strokeWidth={1.8} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>{item.icon}</svg>
                  {item.label}
                </Link>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #eee", padding: "6px 0" }}>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex items-center w-full hover:bg-red-50 transition-colors"
                style={{ gap: 12, padding: "10px 16px", fontSize: 14, color: "#dc2626", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                লগআউট
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

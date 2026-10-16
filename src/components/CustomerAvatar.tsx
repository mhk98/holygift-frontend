"use client";
import { useState } from "react";

const PRIMARY = "#111111";

interface AvatarCustomer {
  name?: string;
  firstName?: string;
  lastName?: string;
  image?: string | null;
}

/** First letter of the first name + first letter of the last name (falls back to the full name). */
export function customerInitials(c?: AvatarCustomer | null) {
  const first = (c?.firstName || "").trim();
  const last = (c?.lastName || "").trim();
  if (first || last) return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  // The server sends firstName/lastName; when both are empty its `name` is only a
  // "Customer" placeholder, so show the person icon. Older saved sessions lack the
  // fields entirely and fall back to splitting `name`.
  if (c?.firstName !== undefined || c?.lastName !== undefined) return "";
  const parts = (c?.name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return (parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : "")).toUpperCase();
}

/** The customer's photo, or an initials avatar when there is no photo (or it fails to load). */
export default function CustomerAvatar({ customer, size = 32, style }: {
  customer?: AvatarCustomer | null;
  size?: number;
  style?: React.CSSProperties;
}) {
  const image = customer?.image || "";
  // Remember which URL failed so a newly uploaded photo gets a fresh try.
  const [failedSrc, setFailedSrc] = useState("");
  const initials = customerInitials(customer);

  const base: React.CSSProperties = {
    width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: PRIMARY, color: "#fff", fontWeight: 700, fontSize: Math.round(size * 0.38),
    lineHeight: 1, userSelect: "none", ...style,
  };

  if (image && failedSrc !== image) {
    return (
      <span style={base}>
        {/* eslint-disable-next-line @next/next/no-img-element -- small avatar from an arbitrary upload host */}
        <img
          src={image}
          alt={customer?.name || "Profile photo"}
          width={size}
          height={size}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setFailedSrc(image)}
        />
      </span>
    );
  }

  return (
    <span style={base} aria-label={customer?.name || "Profile"}>
      {initials || (
        <svg width={size * 0.55} height={size * 0.55} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      )}
    </span>
  );
}

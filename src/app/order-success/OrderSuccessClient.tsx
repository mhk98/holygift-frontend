"use client";

import type { SiteChromeSlots } from "@/components/SiteChrome";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const SECONDARY = "#404040";

function getStoredInvoiceId(): string {
  if (typeof window === "undefined") return "";
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem("kafela_pending_reconfirm_order") || "{}",
    );
    return parsed?.invoiceId || "";
  } catch {
    return "";
  }
}

function OrderSuccessContent({ header, footer }: SiteChromeSlots) {
  const params = useSearchParams();
  const [invoiceId, setInvoiceId] = useState("");

  useEffect(() => {
    setInvoiceId(params.get("invoiceId") || getStoredInvoiceId());
  }, [params]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#F5F5F5",
      }}
    >
      {header}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 16px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "48px 40px",
            textAlign: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            maxWidth: 460,
            width: "100%",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg
              width="36"
              height="36"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#111",
              margin: "0 0 8px",
            }}
          >
            আপনার order সফল হয়েছে 🎉
          </h2>
          <p style={{ fontSize: 14, color: "#666", margin: "0 0 28px" }}>
            আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।
          </p>

          {invoiceId && (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "14px 20px",
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#64748b",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Invoice ID
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#111827" }}>
                {invoiceId}
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Link
              href="/track-order"
              style={{
                display: "block",
                background: SECONDARY,
                color: "#fff",
                padding: "13px 0",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Order Track করুন
            </Link>
            <Link
              href="/"
              style={{
                display: "block",
                background: "#f3f4f6",
                color: "#374151",
                padding: "13px 0",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              হোমে ফিরুন
            </Link>
          </div>
        </div>
      </main>
      {footer}
    </div>
  );
}

export default function OrderSuccessPage(props: SiteChromeSlots) {
  return (
    <Suspense>
      <OrderSuccessContent {...props} />
    </Suspense>
  );
}

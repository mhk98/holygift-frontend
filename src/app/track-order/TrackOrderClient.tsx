"use client";

import type { SiteChromeSlots } from "@/components/SiteChrome";
import { useEffect, useState } from "react";
import Image from "next/image";
import MarqueeBanner from "@/components/MarqueeBanner";
import { apiFetch } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import {
  fetchPublicOrderStatuses,
  normalizeOrderStatuses,
  toOrderStatusKey,
  type OrderStatusOption,
} from "@/services/orderStatusService";

const PRIMARY = "#111111";
const SECONDARY = "#404040";

interface TrackedOrderItem {
  name: string;
  qty: number;
  price: number;
  image?: string;
  variant?: string;
  size?: string;
  color?: string;
}
interface TrackedOrder {
  Id: number;
  invoiceId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: string;
  paymentStatus?: string;
  status: string;
  total: number;
  subtotal: number;
  deliveryCharge: number;
  advance?: number;
  items: TrackedOrderItem[] | string;
  createdAt: string;
  note?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f97316",
  packaging: "#2563eb",
  confirmed: "#7c3aed",
  in_courier: "#0891b2",
  delivered: "#16a34a",
  cancelled: "#dc2626",
  returned: "#d97706",
  on_hold: "#6b7280",
  incomplete: "#e11d48",
};

function getStatusColor(key: string, index = 0) {
  const fallbackColors = [
    "#f97316",
    "#2563eb",
    "#7c3aed",
    "#0891b2",
    "#16a34a",
    "#dc2626",
    "#d97706",
    "#6b7280",
  ];
  return (
    STATUS_COLORS[key] ||
    fallbackColors[Math.max(index, 0) % fallbackColors.length] ||
    "#374151"
  );
}

function getStatusMeta(status: string, statuses: OrderStatusOption[]) {
  const key = toOrderStatusKey(status);
  const index = statuses.findIndex((item) => item.key === key);
  return {
    label: statuses[index]?.label || status || "অজানা",
    tone: getStatusColor(key, index),
    index: Math.max(index, 0),
  };
}
function getOrderItems(items: TrackedOrder["items"]): TrackedOrderItem[] {
  if (Array.isArray(items)) return items;
  try {
    const p = JSON.parse(items as string);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}
function fmt(v: number | string | undefined) {
  return Number(v || 0).toLocaleString("en-US");
}
function fmtDate(v: string) {
  return new Date(v).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StatusBadge({
  status,
  statuses,
}: {
  status: string;
  statuses: OrderStatusOption[];
}) {
  const meta = getStatusMeta(status, statuses);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 20,
        padding: "5px 14px",
        fontSize: 12,
        fontWeight: 700,
        background: `${meta.tone}18`,
        color: meta.tone,
      }}
    >
      {meta.label}
    </span>
  );
}

function StatusTimeline({
  status,
  statuses,
}: {
  status: string;
  statuses: OrderStatusOption[];
}) {
  const meta = getStatusMeta(status, statuses);
  const currentKey = toOrderStatusKey(status);
  const isStopped = ["cancelled", "returned", "incomplete", "on_hold"].includes(
    currentKey,
  );
  const visibleSteps = isStopped
    ? statuses.filter((step) => ["pending", currentKey].includes(step.key))
    : statuses.filter(
        (step) =>
          !["cancelled", "returned", "incomplete", "on_hold"].includes(
            step.key,
          ),
      );
  return (
    <div className="status-timeline-grid">
      {visibleSteps.map((step, index) => {
        const stepIndex = statuses.findIndex((item) => item.key === step.key);
        const active = isStopped ? true : stepIndex <= meta.index;
        const stepTone = getStatusColor(step.key, stepIndex);
        return (
          <div key={step.key} style={{ minWidth: 0 }}>
            <div
              style={{
                height: 6,
                borderRadius: 99,
                marginBottom: 8,
                background: active ? stepTone : "#e5e7eb",
              }}
            />
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: active ? stepTone : "#9ca3af",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function TrackOrderPage({ header, footer }: SiteChromeSlots) {
  const [trackingValue, setTrackingValue] = useState("");
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);
  const [historyOrders, setHistoryOrders] = useState<TrackedOrder[] | null>(
    null,
  );
  const [lastLookup, setLastLookup] = useState<{
    type: "phone" | "invoice";
    value: string;
  } | null>(null);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatusOption[]>(() =>
    normalizeOrderStatuses(),
  );
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPublicOrderStatuses()
      .then(setOrderStatuses)
      .catch(() => {});
  }, []);

  const track = async () => {
    const value = trackingValue.trim();
    if (!value) {
      setError("ফোন নম্বর অথবা ইনভয়েস আইডি দিন");
      return;
    }
    const normalized = value.replace(/^#/, "").toUpperCase();
    const isPhone = /^01\d{9}$/.test(normalized);
    // HD- is current; TJ-/WZ- are older invoice prefixes the backend still resolves.
    const isInvoice = /^(HD|TJ|WZ)-[A-Z0-9-]+$/.test(normalized);
    if (!isPhone && !isInvoice) {
      setError("সঠিক ফোন নম্বর অথবা ইনভয়েস আইডি দিন");
      return;
    }
    setError("");
    setLoading(true);
    setOrders(null);
    setHistoryOrders(null);
    setLastLookup(null);
    try {
      const res = await apiFetch<ApiResponse<TrackedOrder[]>>("/orders/track", {
        params: isInvoice ? { invoiceId: normalized } : { phone: normalized },
      });
      setOrders(res.data || []);
      setLastLookup({
        type: isInvoice ? "invoice" : "phone",
        value: normalized,
      });
    } catch {
      setError("অর্ডারের তথ্য আনতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!lastLookup || lastLookup.type !== "phone") return;
    setHistoryLoading(true);
    setError("");
    try {
      const res = await apiFetch<ApiResponse<TrackedOrder[]>>("/orders/track", {
        params: { phone: lastLookup.value, history: "true" },
      });
      const currentIds = new Set((orders || []).map((order) => order.Id));
      setHistoryOrders(
        (res.data || []).filter((order) => !currentIds.has(order.Id)),
      );
    } catch {
      setError("আগের অর্ডার আনতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setHistoryLoading(false);
    }
  };

  const renderOrderCard = (order: TrackedOrder) => {
    const items = getOrderItems(order.items);
    return (
      <div
        key={order.Id}
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {/* Card header */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              Invoice ID
            </p>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#111827",
                margin: 0,
              }}
            >
              {order.invoiceId || `#${order.Id}`}
            </h2>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
              Order #{order.Id} · {fmtDate(order.createdAt)}
            </p>
          </div>
          <StatusBadge status={order.status} statuses={orderStatuses} />
        </div>

        {/* Card body — 2 columns on wide screens */}
        <div className="track-order-detail-grid">
          {/* Left: timeline + items */}
          <div className="track-order-detail-left">
            <StatusTimeline status={order.status} statuses={orderStatuses} />

            {/* Items box */}
            <div
              style={{
                marginTop: 20,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "#f9fafb",
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#111827",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                অর্ডার আইটেম
              </div>
              {items.length === 0 ? (
                <p style={{ padding: "16px", fontSize: 13, color: "#9ca3af" }}>
                  আইটেম তথ্য পাওয়া যায়নি।
                </p>
              ) : (
                items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      borderBottom:
                        i < items.length - 1 ? "1px solid #f5f5f5" : "none",
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 8,
                        background: "#f3f4f6",
                        flexShrink: 0,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            color: "#9ca3af",
                            fontWeight: 700,
                          }}
                        >
                          IMG
                        </div>
                      )}
                    </div>
                    {/* Name + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#1f2937",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.name}
                      </p>
                      <p
                        style={{
                          margin: "3px 0 0",
                          fontSize: 12,
                          color: "#9ca3af",
                        }}
                      >
                        Qty {item.qty || 1}
                        {item.variant ? ` · ${item.variant}` : ""}
                        {item.size ? ` · Size ${item.size}` : ""}
                        {item.color ? ` · Color ${item.color}` : ""}
                      </p>
                    </div>
                    {/* Price */}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#111827",
                        flexShrink: 0,
                      }}
                    >
                      ৳{fmt((item.price || 0) * (item.qty || 1))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: customer + payment */}
          <div className="track-order-detail-right">
            {/* Customer */}
            <div
              style={{
                background: "#f9fafb",
                borderRadius: 10,
                padding: 16,
                border: "1px solid #e5e7eb",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 10,
                }}
              >
                কাস্টমার তথ্য
              </p>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: 4,
                }}
              >
                {order.customerName}
              </p>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
                {order.customerPhone}
              </p>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
                {order.customerAddress}
              </p>
            </div>
            {/* Payment */}
            <div
              style={{
                borderRadius: 10,
                padding: 16,
                border: "1px solid #e5e7eb",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 10,
                }}
              >
                পেমেন্ট
              </p>
              {[
                { label: "মেথড", value: order.paymentMethod?.toUpperCase() },
                { label: "স্ট্যাটাস", value: order.paymentStatus || "pending" },
                { label: "সাবটোটাল", value: `৳${fmt(order.subtotal)}` },
                {
                  label: "ডেলিভারি চার্জ",
                  value: `৳${fmt(order.deliveryCharge)}`,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    {row.label}
                  </span>
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
              <div
                style={{
                  borderTop: "1px solid #e5e7eb",
                  marginTop: 8,
                  paddingTop: 10,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}
                >
                  মোট
                </span>
                <span
                  style={{ fontSize: 15, fontWeight: 900, color: SECONDARY }}
                >
                  ৳{fmt(order.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="track-order-page">
      <MarqueeBanner />
      {header}

      <main className="track-order-main">
        {/* ── Hero / Search ── */}
        <section className="track-order-hero">
          <div className="track-order-container track-order-hero-grid">
            <div>
              <div
                className="track-order-icon"
                style={{ background: `${PRIMARY}14`, color: PRIMARY }}
              >
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 17h6M9 13h6M9 9h2" />
                  <path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-1.33V3z" />
                </svg>
              </div>
              <h1 className="track-order-title">অর্ডার ট্র্যাক করুন</h1>
              <p className="track-order-subtitle">
                ফোন নম্বর অথবা ইনভয়েস আইডি দিয়ে আপনার অর্ডারের বর্তমান অবস্থা,
                পেমেন্ট এবং ডেলিভারি তথ্য দেখুন।
              </p>
            </div>
            <div className="track-order-search-card">
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1f2937",
                }}
              >
                ফোন নম্বর / ইনভয়েস আইডি
              </label>
              <div className="track-order-search-row">
                <div className="track-order-input-wrap">
                  <input
                    type="text"
                    value={trackingValue}
                    onChange={(e) => setTrackingValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && track()}
                    placeholder="01700000000 অথবা HD-0001"
                    className="track-order-input"
                  />
                </div>
                <button
                  onClick={track}
                  disabled={loading}
                  className="track-order-button"
                  style={{ background: PRIMARY }}
                >
                  {loading ? "খুঁজছি..." : "ট্র্যাক করুন"}
                </button>
              </div>
              {error && (
                <p
                  style={{
                    marginTop: 12,
                    background: "#fef2f2",
                    color: "#dc2626",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {error}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Results ── */}
        <section className="track-order-container track-order-content">
          {/* How-to steps */}
          {orders === null && !loading && (
            <div className="track-order-steps">
              {[
                "ফোন বা ইনভয়েস আইডি লিখুন",
                "স্ট্যাটাস দেখুন",
                "ডেলিভারি তথ্য মিলিয়ে নিন",
              ].map((item, index) => (
                <div key={item} className="track-order-step-card">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: SECONDARY,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 900,
                      marginBottom: 16,
                    }}
                  >
                    {index + 1}
                  </div>
                  <p
                    style={{ fontSize: 14, fontWeight: 700, color: "#1f2937" }}
                  >
                    {item}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {orders !== null && orders.length === 0 && (
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "2px dashed #d1d5db",
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  color: "#9ca3af",
                }}
              >
                <svg
                  width="28"
                  height="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5M8.5 8.5l5 5M13.5 8.5l-5 5" />
                </svg>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
                কোনো অর্ডার পাওয়া যায়নি
              </h2>
              <p style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
                ফোন নম্বর বা ইনভয়েস আইডি মিলিয়ে আবার চেষ্টা করুন।
              </p>
            </div>
          )}

          {/* Order cards */}
          {orders !== null && orders.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {orders.map(renderOrderCard)}

              {lastLookup?.type === "phone" && historyOrders === null && (
                <div style={{ textAlign: "center", paddingTop: 4 }}>
                  <button
                    type="button"
                    onClick={loadHistory}
                    disabled={historyLoading}
                    style={{
                      minHeight: 42,
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      background: "#fff",
                      color: PRIMARY,
                      padding: "0 18px",
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: historyLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {historyLoading ? "লোড হচ্ছে..." : "আগের অর্ডারগুলো দেখুন"}
                  </button>
                </div>
              )}

              {historyOrders !== null && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{ height: 1, flex: 1, background: "#dbe2ea" }}
                    />
                    <h2
                      style={{
                        margin: 0,
                        color: "#475569",
                        fontSize: 15,
                        fontWeight: 900,
                      }}
                    >
                      আগের অর্ডার
                    </h2>
                    <div
                      style={{ height: 1, flex: 1, background: "#dbe2ea" }}
                    />
                  </div>
                  {historyOrders.length > 0 ? (
                    historyOrders.map(renderOrderCard)
                  ) : (
                    <p
                      style={{
                        textAlign: "center",
                        color: "#64748b",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      আর কোনো আগের অর্ডার পাওয়া যায়নি।
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {footer}
    </div>
  );
}

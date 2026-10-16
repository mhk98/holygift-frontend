"use client";
import type { SiteChromeSlots } from "@/components/SiteChrome";
import { useEffect, useRef, useState, Suspense } from "react";
import { useCheckoutSession } from "@/lib/useCheckoutSession";
import SafeImage from "@/components/SafeImage";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { createOrder, saveIncompleteOrder } from "@/services/orderService";
import { fetchSiteSettings, type SiteSetting } from "@/services/settingService";
import {
  fetchDeliveryCharges,
  getDeliveryChargeForDistrict,
  type ShippingCharge,
} from "@/services/shippingChargeService";
import { getPixelClickData, trackPixelEvent } from "@/lib/pixel";
import { validateCoupon, type AppliedCoupon } from "@/services/couponService";

const fmt = (v: number) => v.toLocaleString("en-US");
const DEVICE_ID_KEY = "kafela_device_id";

const normalizePhoneNumber = (value: string) =>
  value
    .replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)))
    .replace(/\D/g, "");

function getCheckoutDeviceId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

function getCouponErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const lower = message.toLowerCase();
  if (lower.includes("expired")) return "এই কুপনের মেয়াদ শেষ।";
  if (lower.includes("minimum order amount"))
    return message.replace(
      "Minimum order amount is",
      "এই কুপনের জন্য ন্যূনতম অর্ডার",
    );
  if (lower.includes("inactive")) return "এই কুপনটি এখন inactive।";
  if (lower.includes("not found")) return "কুপন কোড পাওয়া যায়নি।";
  return message || "কুপন প্রযোজ্য নয়।";
}

function CheckoutContent({ header, footer }: SiteChromeSlots) {
  const checkout = useCheckoutSession();
  const router = useRouter();
  const { items, removeFromCart, updateQty, clearCart, totalPrice } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [payment, setPayment] = useState<"bkash" | "nagad" | "rocket" | "cod">(
    "cod",
  );
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null,
  );
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [settings, setSettings] = useState<SiteSetting | null>(null);
  const [deliveryCharges, setDeliveryCharges] = useState<ShippingCharge[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [incompleteOrderId, setIncompleteOrderId] = useState<number | null>(
    null,
  );
  const [deviceId, setDeviceId] = useState("");
  const beginCheckoutTrackedRef = useRef(false);
  const leadTrackedOrderIdRef = useRef<number | null>(null);

  const allItemsFreeShipping =
    items.length > 0 && items.every((item) => item.freeShipping === true);
  const regularDeliveryCharge = getDeliveryChargeForDistrict(
    deliveryCharges,
    district,
  );
  const deliveryCharge = allItemsFreeShipping ? 0 : regularDeliveryCharge;
  const discount = appliedCoupon?.discount || 0;
  const grandTotal = Math.max(0, totalPrice + deliveryCharge - discount);
  const paymentMethods = [
    {
      id: "cod" as const,
      label: "Cash on Delivery",
      number: null,
      bg: "#404040",
    },
    {
      id: "bkash" as const,
      label: "bKash",
      number: settings?.bkashNumber,
      bg: "#E2136E",
    },
    {
      id: "nagad" as const,
      label: "Nagad",
      number: settings?.nagadNumber,
      bg: "#F7941D",
    },
    {
      id: "rocket" as const,
      label: "Rocket",
      number: settings?.rocketNumber,
      bg: "#7A1FA2",
    },
  ].filter((method) => method.id === "cod" || method.number);

  useEffect(() => {
    Promise.all([
      fetchSiteSettings().catch(() => null),
      fetchDeliveryCharges().catch(() => []),
    ]).then(([siteSettings, charges]) => {
      setSettings(siteSettings);
      setDeliveryCharges(charges);
    });
  }, []);

  useEffect(() => {
    setDeviceId(getCheckoutDeviceId());
  }, []);

  useEffect(() => {
    if (beginCheckoutTrackedRef.current || items.length === 0) return;
    beginCheckoutTrackedRef.current = true;
    trackPixelEvent("InitiateCheckout", {
      content_ids: items.map((i) => i.id),
      content_name: "Checkout",
      content_type: "product",
      value: grandTotal,
      currency: "BDT",
      num_items: items.reduce((sum, item) => sum + item.qty, 0),
    });
  }, [grandTotal, items]);

  useEffect(() => {
    setAppliedCoupon(null);
    setCouponMessage("");
  }, [totalPrice]);

  useEffect(() => {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (checkout.submitting.current || items.length === 0 || !/^01\d{9}$/.test(normalizedPhone)) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      if (checkout.submitting.current) return;
      saveIncompleteOrder(
        {
          checkoutKey: checkout.getKey(normalizedPhone),
          incompleteOrderId: incompleteOrderId || undefined,
          deviceId,
          customerName: name.trim() || "Incomplete Customer",
          customerPhone: normalizedPhone,
          customerAddress: address.trim(),
          customerDistrict: district || undefined,
          paymentMethod: payment,
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            image: i.image,
            price: i.price,
            qty: i.qty,
            variantId: i.variantId,
            variant: i.variant,
            size: i.size,
            color: i.color,
            freeShipping: i.freeShipping,
          })),
          subtotal: totalPrice,
          deliveryCharge,
          discount,
          couponCode: appliedCoupon?.code || null,
          total: grandTotal,
          tracking: getPixelClickData(),
        },
        controller.signal,
      )
        .then((order) => {
          if (order?.Id) {
            setIncompleteOrderId(order.Id);
            if (leadTrackedOrderIdRef.current !== order.Id) {
              leadTrackedOrderIdRef.current = order.Id;
              trackPixelEvent(
                "Lead",
                {
                  content_ids: items.map((i) => i.id),
                  content_name: "Incomplete Checkout",
                  content_type: "product",
                  value: grandTotal,
                  currency: "BDT",
                  num_items: items.reduce((s, i) => s + i.qty, 0),
                },
                { name, phone: normalizedPhone },
              );
            }
          }
        })
        .catch(() => {});
    }, 700);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    address,
    appliedCoupon?.code,
    deliveryCharge,
    discount,
    district,
    grandTotal,
    incompleteOrderId,
    items,
    name,
    payment,
    phone,
    deviceId,
    totalPrice,
  ]);

  const handleApplyCoupon = async () => {
    const code = coupon.trim();
    if (!code) {
      setCouponMessage("কুপন কোড লিখুন।");
      setAppliedCoupon(null);
      return;
    }
    setCouponLoading(true);
    setCouponMessage("");
    try {
      const result = await validateCoupon(code, totalPrice);
      setAppliedCoupon(result);
      setCouponMessage(`কুপন applied: ৳${fmt(result.discount)} discount`);
    } catch (error) {
      setAppliedCoupon(null);
      setCouponMessage(getCouponErrorMessage(error));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (checkout.submitting.current) return;
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!name || !phone || !address || !district) {
      setErrorMsg("নাম, ফোন, ঠিকানা এবং জেলা পূরণ করুন।");
      return;
    }
    if (!/^01\d{9}$/.test(normalizedPhone)) {
      setErrorMsg("সঠিক ১১ সংখ্যার ফোন নাম্বার দিন।");
      return;
    }
    if (items.length === 0) {
      setErrorMsg("কোনো পণ্য নেই।");
      return;
    }
    checkout.submitting.current = true;
    setLoading(true);
    setErrorMsg("");
    try {
      const order = await createOrder({
        checkoutKey: checkout.getKey(normalizedPhone),
          incompleteOrderId: incompleteOrderId || undefined,
        deviceId,
        customerName: name,
        customerPhone: normalizedPhone,
        customerAddress: address,
        customerDistrict: district,
        paymentMethod: payment,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          image: i.image,
          price: i.price,
          qty: i.qty,
          variantId: i.variantId,
          variant: i.variant,
          size: i.size,
          color: i.color,
          freeShipping: i.freeShipping,
        })),
        subtotal: totalPrice,
        deliveryCharge,
        discount,
        couponCode: appliedCoupon?.code || null,
        total: grandTotal,
        tracking: getPixelClickData(),
      });
      const orderPixelData = {
        content_ids: items.map((i) => i.id),
        content_type: "product",
        value: grandTotal,
        currency: "BDT",
        num_items: items.reduce((s, i) => s + i.qty, 0),
      };
      const orderPixelUser = { name, phone: normalizedPhone };
      trackPixelEvent(
        "AddPaymentInfo",
        { ...orderPixelData, content_name: "Checkout Payment Info" },
        orderPixelUser,
      );
      trackPixelEvent(
        "Purchase",
        { ...orderPixelData, content_name: "Order Confirmed", order_id: order.Id },
        orderPixelUser,
      );
      window.localStorage.setItem(
        "kafela_pending_reconfirm_order",
        JSON.stringify({
          orderId: order.Id,
          invoiceId: order.invoiceId || order.orderId || "",
          phone: normalizedPhone,
          name,
          total: grandTotal,
        }),
      );
      checkout.complete();
      clearCart();
      router.push(
        `/order-success?invoiceId=${encodeURIComponent(order.invoiceId || order.orderId || "")}`,
      );
    } catch (error) {
      checkout.submitting.current = false;
      const message = error instanceof Error ? error.message : "";
      const lowerMessage = message.toLowerCase();
      if (
        (lowerMessage.includes("ip") && lowerMessage.includes("blocked")) ||
        lowerMessage.includes("order limit") ||
        lowerMessage.includes("try again after")
      ) {
        setErrorMsg(
          "আপনার IP address থেকে অর্ডার গ্রহণ সাময়িকভাবে বন্ধ আছে। সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন।",
        );
      } else {
        setErrorMsg("অর্ডার দেওয়া যায়নি। আবার চেষ্টা করুন।");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "13px 16px",
    fontSize: 14,
    color: "#333",
    background: "transparent",
  };

  const iconBox: React.CSSProperties = {
    background: "#f5f5f5",
    borderRight: "1px solid #e0e0e0",
    padding: "0 16px",
    display: "flex",
    alignItems: "center",
  };

  const fieldWrap: React.CSSProperties = {
    display: "flex",
    border: "1px solid #ddd",
    borderRadius: 8,
    overflow: "hidden",
    background: "#fff",
  };

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

      <main style={{ flex: 1, padding: "36px 0 48px" }}>
        <div style={{ width: "92%", maxWidth: 1300, margin: "0 auto" }}>
          <div className="checkout-main-grid">
            {/* ── Left: Form ── */}
            <div
              style={{
                background: "#fff",
                borderRadius: 10,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              {/* Brand header */}
              <div style={{ background: "#404040", padding: "18px 28px" }}>
                <p
                  style={{
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  বিস্তারিত তথ্য পূরণ করুন এবং &apos;অর্ডার কনফার্ম করুন&apos;
                  বাটনে ক্লিক করুন।
                </p>
              </div>

              <div
                style={{
                  padding: "30px 28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                }}
              >
                {/* Name */}
                <div>
                  <label
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#333",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    আপনার নাম <span style={{ color: "#D7262E" }}>*</span>
                  </label>
                  <div style={fieldWrap}>
                    <span style={iconBox}>
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="#888"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#333",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    ফোন নাম্বার <span style={{ color: "#D7262E" }}>*</span>
                  </label>
                  <div style={fieldWrap}>
                    <span style={iconBox}>
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="#888"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z" />
                      </svg>
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="০ দিয়ে শুরু করে ১১ সংখ্যার মোবাইল নম্বর দিন"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#333",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    আপনার পুরো ঠিকানা{" "}
                    <span style={{ color: "#D7262E" }}>*</span>
                  </label>
                  <div style={fieldWrap}>
                    <span style={iconBox}>
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="#888"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* District */}
                <div>
                  <label
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#333",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    জেলা নির্বাচন করুন{" "}
                    <span style={{ color: "#D7262E" }}>*</span>
                  </label>
                  <div style={{ ...fieldWrap, position: "relative" }}>
                    <span style={iconBox}>
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="#888"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
                      </svg>
                    </span>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      style={{
                        ...inputStyle,
                        cursor: "pointer",
                        appearance: "none",
                        paddingRight: 36,
                      }}
                    >
                      <option value="">-- জেলা বেছে নিন --</option>
                      {[
                        "Bagerhat",
                        "Bandarban",
                        "Barguna",
                        "Barishal",
                        "Bhola",
                        "Bogura",
                        "Brahmanbaria",
                        "Chandpur",
                        "Chapai Nawabganj",
                        "Chattogram",
                        "Chuadanga",
                        "Cox's Bazar",
                        "Cumilla",
                        "Dhaka",
                        "Dinajpur",
                        "Faridpur",
                        "Feni",
                        "Gaibandha",
                        "Gazipur",
                        "Gopalganj",
                        "Habiganj",
                        "Jamalpur",
                        "Jashore",
                        "Jhalokati",
                        "Jhenaidah",
                        "Joypurhat",
                        "Khagrachhari",
                        "Khulna",
                        "Kishoreganj",
                        "Kurigram",
                        "Kushtia",
                        "Lakshmipur",
                        "Lalmonirhat",
                        "Madaripur",
                        "Magura",
                        "Manikganj",
                        "Meherpur",
                        "Moulvibazar",
                        "Munshiganj",
                        "Mymensingh",
                        "Naogaon",
                        "Narail",
                        "Narayanganj",
                        "Narsingdi",
                        "Natore",
                        "Netrokona",
                        "Nilphamari",
                        "Noakhali",
                        "Pabna",
                        "Panchagarh",
                        "Patuakhali",
                        "Pirojpur",
                        "Rajbari",
                        "Rajshahi",
                        "Rangamati",
                        "Rangpur",
                        "Satkhira",
                        "Shariatpur",
                        "Sherpur",
                        "Sirajganj",
                        "Sunamganj",
                        "Sylhet",
                        "Tangail",
                        "Thakurgaon",
                      ].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <span
                      style={{
                        position: "absolute",
                        right: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        stroke="#888"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </div>
                  {district && (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: 13,
                        color: "#404040",
                        fontWeight: 500,
                      }}
                    >
                      {allItemsFreeShipping
                        ? "এই অর্ডারে ফ্রি ডেলিভারি প্রযোজ্য"
                        : `ডেলিভারি চার্জ: ৳${fmt(deliveryCharge)}`}
                    </p>
                  )}
                </div>

                {/* Payment */}
                <div>
                  <label
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#333",
                      display: "block",
                      marginBottom: 12,
                    }}
                  >
                    পেমেন্ট মেথড <span style={{ color: "#D7262E" }}>*</span>
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {paymentMethods.map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPayment(m.id)}
                        style={{
                          border: `2px solid ${payment === m.id ? m.bg : "#e5e7eb"}`,
                          borderRadius: 10,
                          padding: "13px 14px",
                          background: payment === m.id ? `${m.bg}12` : "#fff",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: 14,
                            fontWeight: 800,
                            color: payment === m.id ? m.bg : "#333",
                          }}
                        >
                          {m.label}
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: 12,
                            color: "#6b7280",
                            marginTop: 4,
                            lineHeight: 1.4,
                          }}
                        >
                          {m.number
                            ? `Send money: ${m.number}`
                            : "পণ্য হাতে পেয়ে টাকা দিন"}
                        </span>
                      </button>
                    ))}
                  </div>
                  {payment !== "cod" && (
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: 13,
                        color: "#6b7280",
                        lineHeight: 1.6,
                      }}
                    >
                      selected number-এ পেমেন্ট করে অর্ডার কনফার্ম করুন।
                      প্রয়োজনে আমাদের প্রতিনিধি ফোনে যাচাই করবে।
                    </p>
                  )}
                </div>

                {/* Advance note */}
                {/* <p style={{
                  fontSize: 14, color: "#555", background: "#fef3c7",
                  borderRadius: 8, padding: "12px 16px", margin: 0,
                  border: "1px solid #fde68a",
                }}>
                  এখন <strong>১০০ ৳</strong> পেমেন্ট করুন, বাকী{" "}
                  <strong>৳{fmt(remaining)}</strong> প্রোডাক্ট হাতে পেয়ে পরিশোধ করবেন।
                </p> */}

                {errorMsg && (
                  <p
                    style={{
                      color: "#D7262E",
                      fontSize: 13,
                      margin: 0,
                      background: "#fff1f1",
                      padding: "10px 14px",
                      borderRadius: 6,
                      border: "1px solid #fca5a5",
                    }}
                  >
                    {errorMsg}
                  </p>
                )}

                {/* Confirm button */}
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  style={{
                    background: loading ? "#aaa" : "#111111",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "16px 0",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    opacity: loading ? 0.8 : 1,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {loading ? "প্রসেস হচ্ছে..." : "অর্ডার কনফার্ম করুন"}
                </button>
              </div>
            </div>

            {/* ── Right: Order Summary ── */}
            <div
              style={{
                background: "#fff",
                borderRadius: 10,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  borderBottom: "2px solid #f0f0f0",
                  padding: "18px 22px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#222",
                  }}
                >
                  অর্ডার বিবরণ
                </h2>
              </div>

              {/* Table header + items — overflow-x-auto for mobile */}
              <div style={{ overflowX: "auto" }}>
                {/* Table header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr 96px 72px",
                    background: "#f8f8f8",
                    padding: "12px 18px",
                    borderBottom: "1px solid #eee",
                    minWidth: 320,
                  }}
                >
                  {["ডিলিট", "প্রোডাক্ট", "পরিমাণ", "মোট"].map((h) => (
                    <span
                      key={h}
                      style={{ fontSize: 13, fontWeight: 700, color: "#555" }}
                    >
                      {h}
                    </span>
                  ))}
                </div>

                {/* Items */}
                <div style={{ borderBottom: "1px solid #eee" }}>
                  {items.length === 0 ? (
                    <p
                      style={{
                        padding: "24px 22px",
                        color: "#999",
                        fontSize: 14,
                        textAlign: "center",
                      }}
                    >
                      কোনো পণ্য নেই
                    </p>
                  ) : (
                    items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "40px 1fr 96px 72px",
                          padding: "14px 18px",
                          borderBottom: "1px solid #f5f5f5",
                          alignItems: "center",
                          minWidth: 320,
                        }}
                      >
                        {/* Delete */}
                        <button
                          onClick={() => removeFromCart(idx)}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "#D7262E",
                            border: "none",
                            color: "#fff",
                            fontSize: 16,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ×
                        </button>

                        {/* Product */}
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "flex-start",
                          }}
                        >
                          <SafeImage
                            sources={[item.image, ...(item.images || [])]}
                            alt={item.name}
                            width={54}
                            height={54}
                            style={{
                              borderRadius: 6,
                              objectFit: "cover",
                              border: "1px solid #eee",
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#333",
                                lineHeight: 1.4,
                              }}
                            >
                              {item.name}
                            </p>
                            {item.variant && (
                              <p
                                style={{
                                  margin: "4px 0 0",
                                  fontSize: 12,
                                  color: "#777",
                                }}
                              >
                                {item.variant}
                              </p>
                            )}
                            {item.size && (
                              <p
                                style={{
                                  margin: "4px 0 0",
                                  fontSize: 12,
                                  color: "#777",
                                }}
                              >
                                Size: {item.size}
                              </p>
                            )}
                            {item.color && (
                              <p
                                style={{
                                  margin: "2px 0 0",
                                  fontSize: 12,
                                  color: "#777",
                                }}
                              >
                                Color: {item.color}
                              </p>
                            )}
                            {item.freeShipping && (
                              <p
                                style={{
                                  margin: "4px 0 0",
                                  fontSize: 11,
                                  color: "#16a34a",
                                  fontWeight: 700,
                                }}
                              >
                                Free Shipping
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Qty */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <button
                            onClick={() => updateQty(idx, item.qty - 1)}
                            style={{
                              width: 24,
                              height: 24,
                              border: "1px solid #ccc",
                              borderRadius: 4,
                              background: "#fff",
                              cursor: "pointer",
                              fontSize: 15,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            −
                          </button>
                          <span
                            style={{
                              width: 26,
                              textAlign: "center",
                              fontSize: 14,
                              fontWeight: 600,
                            }}
                          >
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(idx, item.qty + 1)}
                            style={{
                              width: 24,
                              height: 24,
                              border: "1px solid #ccc",
                              borderRadius: 4,
                              background: "#fff",
                              cursor: "pointer",
                              fontSize: 15,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            +
                          </button>
                        </div>

                        {/* Total */}
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#333",
                          }}
                        >
                          ৳{fmt(item.price * item.qty)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {/* end overflow-x-auto */}

              {/* Price rows */}
              <div
                style={{
                  padding: "16px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {[
                  { label: "মোট", value: `৳${fmt(totalPrice)}` },
                  {
                    label: "ডেলিভারি চার্জ",
                    value: allItemsFreeShipping
                      ? "Free"
                      : `৳${fmt(deliveryCharge)}`,
                  },
                  { label: "ডিসকাউন্ট", value: `৳${fmt(discount)}` },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ fontSize: 14, color: "#666" }}>
                      {row.label}
                    </span>
                    <span
                      style={{ fontSize: 14, fontWeight: 600, color: "#333" }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    borderTop: "2px solid #eee",
                    paddingTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{ fontSize: 16, fontWeight: 700, color: "#222" }}
                  >
                    সর্বমোট
                  </span>
                  <span
                    style={{ fontSize: 16, fontWeight: 700, color: "#222" }}
                  >
                    ৳{fmt(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Coupon */}
              <div style={{ padding: "0 22px 22px" }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => {
                      setCoupon(e.target.value);
                      setAppliedCoupon(null);
                      setCouponMessage("");
                    }}
                    placeholder="Apply Coupon"
                    style={{
                      flex: 1,
                      border: "1px solid #ddd",
                      borderRadius: 8,
                      padding: "12px 16px",
                      fontSize: 14,
                      outline: "none",
                      color: "#333",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    style={{
                      background: couponLoading ? "#9ca3af" : "#404040",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "0 22px",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: couponLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {couponLoading ? "..." : "APPLY"}
                  </button>
                </div>
                {couponMessage && (
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: 13,
                      color: appliedCoupon ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {couponMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {footer}
    </div>
  );
}

export default function CheckoutPage(props: SiteChromeSlots) {
  return (
    <Suspense>
      <CheckoutContent {...props} />
    </Suspense>
  );
}

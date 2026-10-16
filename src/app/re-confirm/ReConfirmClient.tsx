"use client";

import type { SiteChromeSlots } from "@/components/SiteChrome";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { sendReconfirmOtp, verifyReconfirmOtp } from "@/services/orderService";
import { trackPixelEvent } from "@/lib/pixel";

type PendingOrder = {
  orderId: string;
  invoiceId: string;
  phone: string;
  name: string;
  total: number;
};

const normalizePhoneNumber = (value: string) =>
  value
    .replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)))
    .replace(/\D/g, "");

const PRIMARY = "#111111";
const GOLD = "#404040";
const SOFT_GOLD = "#FBF3DE";
const TEXT = "#111827";
const MUTED = "#4b5563";

function getStoredPendingOrder(): Partial<PendingOrder> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem("kafela_pending_reconfirm_order") || "{}",
    );
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function ReConfirmContent({ header, footer }: SiteChromeSlots) {
  const params = useSearchParams();
  const { clearCart } = useCart();
  const [storedOrder, setStoredOrder] = useState<Partial<PendingOrder>>({});
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setStoredOrder(getStoredPendingOrder());
  }, []);

  const order = useMemo(() => {
    const orderId = params.get("orderId") || storedOrder.orderId || "";
    const invoiceId = params.get("invoiceId") || storedOrder.invoiceId || "";
    const phone = params.get("phone") || storedOrder.phone || "";
    return {
      orderId: String(orderId),
      invoiceId: String(invoiceId),
      phone: normalizePhoneNumber(String(phone)),
      name: storedOrder.name || "",
      total: Number(storedOrder.total || 0),
    };
  }, [params, storedOrder]);

  async function handleSendOtp() {
    if (!order.orderId || !/^01\d{9}$/.test(order.phone)) {
      setError("Order অথবা ফোন নাম্বার পাওয়া যায়নি। আবার checkout করুন।");
      return;
    }
    const isResend = otpSent;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const result = await sendReconfirmOtp(order.orderId, order.phone);
      if (result.alreadyConfirmed) {
        handleConfirmed();
        return;
      }
      setMaskedPhone(result.maskedPhone || order.phone);
      setOtp("");
      setOtpSent(true);
      setNotice(isResend ? "নতুন OTP আবার পাঠানো হয়েছে।" : "OTP পাঠানো হয়েছে।");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP পাঠানো যায়নি।");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("৬ সংখ্যার OTP লিখুন।");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const confirmedOrder = await verifyReconfirmOtp(
        order.orderId,
        order.phone,
        otp.trim(),
      );
      trackPixelEvent(
        "Purchase",
        {
          content_ids: confirmedOrder.items?.map((item) => item.id) || [],
          content_name: "Order Re-Confirmed",
          content_type: "product",
          value: confirmedOrder.total || order.total,
          currency: "BDT",
          num_items:
            confirmedOrder.items?.reduce((sum, item) => sum + item.qty, 0) || 0,
          order_id: order.orderId,
        },
        { name: confirmedOrder.customerName || order.name, phone: order.phone },
      );
      handleConfirmed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verify করা যায়নি।");
    } finally {
      setVerifying(false);
    }
  }

  function handleConfirmed() {
    clearCart();
    window.localStorage.removeItem("kafela_pending_reconfirm_order");
    setConfirmed(true);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
      }}
    >
      {header}
      <main style={{ flex: 1, padding: "48px 16px 72px", background: "#fff" }}>
        <section
          style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}
        >
          {confirmed ? (
            <>
              <h1
                style={{
                  margin: "0 auto 14px",
                  maxWidth: 680,
                  fontSize: "clamp(28px, 4.5vw, 42px)",
                  lineHeight: 1.22,
                  fontWeight: 900,
                  color: TEXT,
                }}
              >
                আলহামদুলিল্লাহ, আপনার অর্ডারটি সফলভাবে রি-কনফার্ম হয়েছে!
              </h1>
              <p
                style={{
                  margin: "0 auto 28px",
                  maxWidth: 580,
                  fontSize: "clamp(18px, 2.8vw, 24px)",
                  lineHeight: 1.45,
                  color: MUTED,
                  fontWeight: 600,
                }}
              >
                Holy Gift এর সাথে থাকার জন্য জাযাকাল্লাহ খাইরান
              </p>
              <div
                style={{
                  maxWidth: 690,
                  margin: "0 auto",
                  background: SOFT_GOLD,
                  border: `1px solid ${GOLD}33`,
                  borderRadius: 10,
                  padding: "42px 34px",
                  boxShadow: "0 18px 42px rgba(17, 17, 17, 0.10)",
                }}
              >
                <div
                  style={{
                    width: 82,
                    height: 82,
                    border: `5px solid ${PRIMARY}`,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                    color: PRIMARY,
                  }}
                >
                  <svg
                    width="38"
                    height="38"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <p
                  style={{
                    margin: "0 auto 28px",
                    maxWidth: 540,
                    fontSize: "clamp(21px, 3.3vw, 28px)",
                    lineHeight: 1.45,
                    fontWeight: 800,
                    color: TEXT,
                  }}
                >
                  আমরা আপনার অর্ডারটি প্রসেসিং শুরু করেছি। খুব শীঘ্রই কুরিয়ারে
                  হ্যান্ডওভার করা হবে।
                </p>
                <Link
                  href="/track-order"
                  style={{
                    display: "inline-flex",
                    minHeight: 52,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    background: PRIMARY,
                    color: "#fff",
                    padding: "0 38px",
                    fontSize: 18,
                    fontWeight: 800,
                    textDecoration: "none",
                    boxShadow: "0 10px 22px rgba(17, 17, 17, 0.20)",
                  }}
                >
                  অর্ডার ট্র্যাক করুন
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1
                style={{
                  margin: "0 auto 14px",
                  maxWidth: 680,
                  fontSize: "clamp(28px, 4.5vw, 42px)",
                  lineHeight: 1.22,
                  fontWeight: 900,
                  color: TEXT,
                }}
              >
                আলহামদুলিল্লাহ, আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে
              </h1>
              <p
                style={{
                  margin: "0 auto 32px",
                  maxWidth: 560,
                  fontSize: "clamp(18px, 2.8vw, 24px)",
                  lineHeight: 1.45,
                  color: MUTED,
                  fontWeight: 600,
                }}
              >
                Holy Gift এর সাথে থাকার জন্য জাযাকাল্লাহ খাইরান
              </p>

              <div
                style={{
                  maxWidth: 690,
                  margin: "0 auto",
                  background: SOFT_GOLD,
                  border: `1px solid ${GOLD}33`,
                  borderRadius: 10,
                  padding: "34px 34px 36px",
                  boxShadow: "0 18px 42px rgba(17, 17, 17, 0.10)",
                  textAlign: "center",
                }}
              >
                {order.invoiceId && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 32,
                      marginBottom: 22,
                      borderRadius: 999,
                      background: "#fff",
                      border: `1px solid ${GOLD}66`,
                      color: PRIMARY,
                      padding: "0 16px",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    Invoice: {order.invoiceId}
                  </div>
                )}
                <p
                  style={{
                    margin: "0 0 14px",
                    fontSize: "clamp(22px, 3.4vw, 30px)",
                    lineHeight: 1.4,
                    fontWeight: 900,
                    color: TEXT,
                  }}
                >
                  কলের অপেক্ষা নয়, এখনই রি-কনফার্ম করুন আপনি নিজেই!
                </p>
                <p
                  style={{
                    margin: "0 0 26px",
                    fontSize: "clamp(18px, 2.8vw, 23px)",
                    lineHeight: 1.5,
                    color: TEXT,
                  }}
                >
                  দ্রুত ডেলিভারি পেতে নিচের বাটনে ক্লিক করুন।
                </p>

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    style={{
                      minHeight: 54,
                      width: "min(430px, 100%)",
                      border: 0,
                      borderRadius: 8,
                      background: loading ? "#9ca3af" : PRIMARY,
                      color: "#fff",
                      fontSize: "clamp(18px, 2.6vw, 24px)",
                      fontWeight: 900,
                      cursor: loading ? "not-allowed" : "pointer",
                      boxShadow: "0 10px 22px rgba(17, 17, 17, 0.20)",
                    }}
                  >
                    {loading ? "OTP পাঠানো হচ্ছে..." : "Re-Confirm Order"}
                  </button>
                ) : (
                  <div style={{ maxWidth: 520, margin: "0 auto" }}>
                    <p
                      style={{
                        margin: "0 0 12px",
                        fontSize: 15,
                        color: PRIMARY,
                        fontWeight: 800,
                      }}
                    >
                      {maskedPhone || order.phone} নাম্বারে OTP পাঠানো হয়েছে।
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(event) =>
                        setOtp(
                          event.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      placeholder="৬ সংখ্যার OTP লিখুন"
                      style={{
                        width: "100%",
                        height: 54,
                        border: `1px solid ${GOLD}88`,
                        borderRadius: 8,
                        textAlign: "center",
                        fontSize: 20,
                        fontWeight: 800,
                        letterSpacing: 3,
                        outline: "none",
                        marginBottom: 12,
                        background: "#fff",
                        color: TEXT,
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={verifying}
                      style={{
                        minHeight: 54,
                        width: "100%",
                        border: 0,
                        borderRadius: 8,
                        background: verifying ? "#9ca3af" : GOLD,
                        color: "#fff",
                        fontSize: 18,
                        fontWeight: 900,
                        cursor: verifying ? "not-allowed" : "pointer",
                      }}
                    >
                      {verifying ? "Verify হচ্ছে..." : "OTP Submit"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      style={{
                        marginTop: 10,
                        border: 0,
                        background: "transparent",
                        color: PRIMARY,
                        fontSize: 15,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      আবার OTP পাঠান
                    </button>
                  </div>
                )}

                {error && (
                  <p
                    style={{
                      margin: "18px auto 0",
                      maxWidth: 520,
                      border: "1px solid #fecaca",
                      borderRadius: 8,
                      background: "#fff1f2",
                      color: "#b91c1c",
                      padding: "10px 14px",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {error}
                  </p>
                )}
                {notice && !error && (
                  <p
                    style={{
                      margin: "18px auto 0",
                      maxWidth: 520,
                      border: `1px solid ${GOLD}66`,
                      borderRadius: 8,
                      background: "#fff",
                      color: PRIMARY,
                      padding: "10px 14px",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    {notice}
                  </p>
                )}

                <div
                  style={{
                    margin: "30px auto 0",
                    maxWidth: 590,
                    textAlign: "left",
                    color: TEXT,
                    fontSize: "clamp(16px, 2.5vw, 21px)",
                    lineHeight: 1.6,
                    fontWeight: 700,
                  }}
                >
                  <p style={{ margin: "0 0 10px", display: "flex", gap: 10 }}>
                    <span style={{ color: GOLD, fontWeight: 900 }}>✓</span>
                    <span>কনফার্ম করলেই অর্ডার দ্রুত কুরিয়ারে যাবে।</span>
                  </p>
                  <p style={{ margin: 0, display: "flex", gap: 10 }}>
                    <span style={{ color: GOLD, fontWeight: 900 }}>✓</span>
                    <span>
                      অথবা রিকনফার্ম করতে আমাদের কাস্টমার সার্ভিস সেন্টার থেকে
                      কলের অপেক্ষা করতে হবে।
                    </span>
                  </p>
                </div>
              </div>

              {/* <section style={{ marginTop: 54 }}>
                <h2 style={{ margin: 0, fontSize: "clamp(28px, 4.4vw, 42px)", lineHeight: 1.22, fontWeight: 900, color: "#222" }}>
                  পণ্য বিনিময় এবং ফেরত নীতিমালা (Exchange & Refund Policy)
                </h2>
              </section> */}
            </>
          )}
        </section>
      </main>
      {footer}
    </div>
  );
}

export default function ReConfirmPage(props: SiteChromeSlots) {
  return (
    <Suspense fallback={null}>
      <ReConfirmContent {...props} />
    </Suspense>
  );
}

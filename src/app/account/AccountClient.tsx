"use client";

import type { SiteChromeSlots } from "@/components/SiteChrome";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import MarqueeBanner from "@/components/MarqueeBanner";
import { apiFetch, BASE } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { useCustomer } from "@/context/CustomerContext";
import CustomerAvatar from "@/components/CustomerAvatar";

const PRIMARY = "#111111";
const SECONDARY = "#404040";

interface OrderItem { name: string; image?: string; qty: number; price: number; variant?: string; size?: string; color?: string; }
interface Order {
  Id: number; invoiceId?: string; status: string; total: number; subtotal: number;
  deliveryCharge: number; paymentMethod: string; paymentStatus?: string;
  items: OrderItem[] | string; createdAt: string;
}

interface Profile {
  Id: number; name: string; phone: string; email: string; address: string; city: string;
  firstName?: string; lastName?: string; image?: string | null;
}

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const ORDERS_PER_PAGE = 5;

const TABS = ["orders", "profile", "password"] as const;
type Tab = (typeof TABS)[number];

const STATUS_COLORS: Record<string, string> = {
  pending: "#c2410c", processing: "#2563eb", shipped: "#7c3aed",
  confirmed: "#2563eb", packaging: "#0891b2", in_courier: "#7c3aed", on_hold: "#ca8a04",
  delivered: "#16a34a", cancelled: "#dc2626", returned: "#dc2626",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "অপেক্ষমাণ", processing: "প্রক্রিয়াধীন", shipped: "শিপমেন্ট",
  confirmed: "কনফার্মড", packaging: "প্যাকেজিং", in_courier: "কুরিয়ারে আছে", on_hold: "হোল্ডে আছে",
  delivered: "ডেলিভারি হয়েছে", cancelled: "বাতিল", returned: "রিটার্ন",
};

// The backend answers these when the stored session token is missing, invalid or expired.
const isAuthError = (err: unknown) =>
  err instanceof Error && /invalid token|not authorized|account was not found|deactivated/i.test(err.message);

function parseItems(items: OrderItem[] | string): OrderItem[] {
  if (Array.isArray(items)) return items;
  try { const p = JSON.parse(items); return Array.isArray(p) ? p : []; } catch { return []; }
}

function fmt(v: number | string) { return Number(v || 0).toLocaleString("en-US"); }
function fmtDate(v: string) {
  return new Date(v).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" });
}

export default function AccountPage({ header, footer }: SiteChromeSlots) {
  const router = useRouter();
  const { customer, token, logout, updateCustomer, isLoggedIn, ready } = useCustomer();

  const [orders,     setOrders]     = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError,   setOrdersError]   = useState("");
  const [page,       setPage]       = useState(1);
  const [totalOrders,setTotalOrders]= useState(0);
  // The active tab lives in the URL (?tab=...) so the header account menu can deep-link to it.
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "orders";
  const setTab = (t: Tab) => {
    // Don't carry a previous tab's success/error banner over to the next visit.
    setPfSuccess(""); setPfError(""); setPhotoError(""); setPwSuccess(""); setPwError("");
    router.replace(`/account?tab=${t}`, { scroll: false });
  };

  // Profile edit form
  const [profile,     setProfile]     = useState<Profile | null>(null);
  const [pfName,      setPfName]      = useState("");
  const [pfEmail,     setPfEmail]     = useState("");
  const [pfAddress,   setPfAddress]   = useState("");
  const [pfCity,      setPfCity]      = useState("");
  const [pfLoading,   setPfLoading]   = useState(false);
  const [pfError,     setPfError]     = useState("");
  const [pfSuccess,   setPfSuccess]   = useState("");
  const [photoLoading,setPhotoLoading]= useState(false);
  const [photoError,  setPhotoError]  = useState("");

  // Password change form
  const [oldPw,    setOldPw]    = useState("");
  const [newPw,    setNewPw]    = useState("");
  const [confirmPw,setConfirmPw]= useState("");
  const [pwLoading,setPwLoading]= useState(false);
  const [pwError,  setPwError]  = useState("");
  const [pwSuccess,setPwSuccess]= useState("");

  const totalPages = Math.max(1, Math.ceil(totalOrders / ORDERS_PER_PAGE));

  const handleSessionExpired = useCallback(() => {
    logout();
    router.replace("/login");
  }, [logout, router]);

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) router.replace("/login");
  }, [ready, isLoggedIn, router]);

  useEffect(() => {
    if (!ready || !token) return;
    const controller = new AbortController();
    apiFetch<ApiResponse<Order[]>>("/customer/orders", {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit: ORDERS_PER_PAGE },
      signal: controller.signal,
    })
      .then((r) => {
        setOrdersError("");
        setOrders(r.data || []);
        setTotalOrders(r.meta?.total ?? (r.data || []).length);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (isAuthError(err)) { handleSessionExpired(); return; }
        setOrders([]);
        setOrdersError("অর্ডার লোড করা যায়নি, আবার চেষ্টা করুন।");
      })
      .finally(() => { if (!controller.signal.aborted) setOrdersLoading(false); });
    return () => controller.abort();
  }, [ready, token, page, handleSessionExpired]);

  useEffect(() => {
    if (!ready || !token || profile) return;
    apiFetch<ApiResponse<Profile>>("/customer/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        setProfile(r.data);
        setPfName(r.data.name || "");
        setPfEmail(r.data.email || "");
        setPfAddress(r.data.address || "");
        setPfCity(r.data.city || "");
      })
      .catch((err) => {
        if (isAuthError(err)) handleSessionExpired();
        else setPfError("প্রোফাইল লোড করা যায়নি");
      });
  }, [ready, token, profile, handleSessionExpired]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setOrdersLoading(true);
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => { logout(); router.push("/"); };

  const applyProfile = (p: Profile) => {
    setProfile(p);
    updateCustomer(p);
  };

  const handlePhotoSelected = async (file: File | undefined) => {
    setPhotoError(""); setPfSuccess("");
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) { setPhotoError("শুধু JPG, PNG, WEBP বা GIF ছবি দিন"); return; }
    if (file.size > MAX_PHOTO_BYTES) { setPhotoError("ছবির সাইজ সর্বোচ্চ ২ MB হতে পারে"); return; }
    setPhotoLoading(true);
    try {
      const body = new FormData();
      body.append("image", file);
      // Plain fetch: apiFetch always sends a JSON Content-Type, but this must be multipart.
      const res = await fetch(`${BASE}/customer/profile/photo`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "ছবি আপলোড হয়নি");
      applyProfile(json.data);
      setPfSuccess("প্রোফাইল ছবি আপডেট হয়েছে!");
    } catch (err) {
      if (isAuthError(err)) { handleSessionExpired(); return; }
      setPhotoError(err instanceof Error ? err.message : "ছবি আপলোড হয়নি");
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoError(""); setPfSuccess("");
    setPhotoLoading(true);
    try {
      const r = await apiFetch<ApiResponse<Profile>>("/customer/profile/photo", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      applyProfile(r.data);
      setPfSuccess("প্রোফাইল ছবি সরানো হয়েছে");
    } catch (err) {
      if (isAuthError(err)) { handleSessionExpired(); return; }
      setPhotoError(err instanceof Error ? err.message : "ছবি সরানো যায়নি");
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setPfError(""); setPfSuccess("");
    if (!pfName.trim()) { setPfError("নাম দিন"); return; }
    if (pfEmail.trim() && !/^\S+@\S+\.\S+$/.test(pfEmail.trim())) { setPfError("সঠিক ইমেইল দিন"); return; }
    if (pfAddress.trim().length > 64) { setPfError("ঠিকানা সর্বোচ্চ ৬৪ অক্ষর হতে পারে"); return; }
    setPfLoading(true);
    try {
      const r = await apiFetch<ApiResponse<Profile>>("/customer/profile", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: pfName.trim(), email: pfEmail.trim(), address: pfAddress.trim(), city: pfCity.trim() }),
      });
      setProfile(r.data);
      updateCustomer(r.data);
      setPfSuccess("প্রোফাইল সফলভাবে আপডেট হয়েছে!");
    } catch (err) {
      if (isAuthError(err)) { handleSessionExpired(); return; }
      setPfError(err instanceof Error ? err.message : "প্রোফাইল আপডেট হয়নি");
    } finally {
      setPfLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError(""); setPwSuccess("");
    if (!oldPw) { setPwError("পুরনো পাসওয়ার্ড দিন"); return; }
    if (newPw.length < 6) { setPwError("নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে"); return; }
    if (newPw !== confirmPw) { setPwError("নতুন পাসওয়ার্ড মিলছে না"); return; }
    setPwLoading(true);
    try {
      await apiFetch<ApiResponse<null>>("/customer/change-password", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      setPwSuccess("পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!");
      setOldPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      if (isAuthError(err)) { handleSessionExpired(); return; }
      setPwError(err instanceof Error ? err.message : "পাসওয়ার্ড পরিবর্তন হয়নি");
    } finally {
      setPwLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "10px 24px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 14,
    cursor: "pointer", background: active ? SECONDARY : "#f3f4f6",
    color: active ? "#fff" : "#555", transition: "all 0.15s",
  });

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 44, border: "1px solid #ddd", borderRadius: 8,
    padding: "0 14px", fontSize: 14, outline: "none", background: "#fafafa", color: "#111",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 7,
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#F5F5F5" }}>
      <MarqueeBanner />
      {header}

      <main style={{ flex: 1, padding: "32px 16px 48px" }}>
        <div style={{ width: "100%", maxWidth: 900, margin: "0 auto" }}>

          {/* Profile header */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "24px 28px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <CustomerAvatar customer={customer} size={56} />
              <div>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111" }}>{customer?.name}</h1>
                <p style={{ margin: "3px 0 0", fontSize: 13, color: "#666" }}>{customer?.phone}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              Logout
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <button style={tabStyle(tab === "orders")} onClick={() => setTab("orders")}>
              আমার অর্ডার{totalOrders > 0 ? ` (${totalOrders})` : ""}
            </button>
            <button style={tabStyle(tab === "profile")} onClick={() => setTab("profile")}>প্রোফাইল এডিট</button>
            <button style={tabStyle(tab === "password")} onClick={() => setTab("password")}>পাসওয়ার্ড পরিবর্তন</button>
          </div>

          {/* Orders tab */}
          {tab === "orders" && (
            <>
              {ordersLoading ? (
                <div style={{ background: "#fff", borderRadius: 12, padding: 40, textAlign: "center", color: "#999" }}>লোড হচ্ছে...</div>
              ) : ordersError ? (
                <div style={{ background: "#fff", borderRadius: 12, padding: 40, textAlign: "center", color: "#dc2626", fontSize: 14 }}>{ordersError}</div>
              ) : orders.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: 12, padding: 40, textAlign: "center" }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>কোনো অর্ডার নেই</p>
                  <Link href="/" style={{ color: SECONDARY, fontWeight: 700, fontSize: 14 }}>এখনই কিনুন →</Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {orders.map((order) => {
                    const items = parseItems(order.items);
                    const statusColor = STATUS_COLORS[order.status?.toLowerCase()] ?? "#374151";
                    const statusLabel = STATUS_LABELS[order.status?.toLowerCase()] ?? order.status;
                    return (
                      <article key={order.Id} style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", border: "1px solid #e5e7eb" }}>
                        {/* Order header */}
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>Invoice</div>
                            <div style={{ fontSize: 17, fontWeight: 900, color: "#111" }}>{order.invoiceId || `#${order.Id}`}</div>
                            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{fmtDate(order.createdAt)}</div>
                          </div>
                          <span style={{ background: `${statusColor}14`, color: statusColor, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700 }}>
                            {statusLabel}
                          </span>
                        </div>

                        {/* Items */}
                        <div style={{ padding: "0 20px" }}>
                          {items.map((item, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < items.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                              <div style={{ width: 48, height: 48, borderRadius: 8, background: "#f3f4f6", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                                {item.image
                                  ? <Image src={item.image} alt={item.name} fill style={{ objectFit: "cover" }} />
                                  : <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#9ca3af" }}>IMG</div>
                                }
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#888" }}>Qty {item.qty}{item.variant ? ` · ${item.variant}` : ""}{item.size ? ` · ${item.size}` : ""}{item.color ? ` · ${item.color}` : ""}</p>
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>৳{fmt(item.price * item.qty)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: "12px 20px", background: "#f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, color: "#666" }}>Payment: {order.paymentMethod?.toUpperCase()}</span>
                          <span style={{ fontSize: 15, fontWeight: 900, color: SECONDARY }}>মোট: ৳{fmt(order.total)}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {totalOrders > ORDERS_PER_PAGE && (
                <Pagination page={page} totalPages={totalPages} disabled={ordersLoading} onChange={goToPage} />
              )}
            </>
          )}

          {/* Profile edit tab */}
          {tab === "profile" && (
            <div style={{ background: "#fff", borderRadius: 12, padding: "28px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", maxWidth: 520 }}>
              <h2 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 800, color: "#111" }}>প্রোফাইল এডিট করুন</h2>

              {/* Profile photo */}
              <div style={{ display: "flex", alignItems: "center", gap: 18, paddingBottom: 20, marginBottom: 20, borderBottom: "1px solid #f0f0f0", flexWrap: "wrap" }}>
                <div style={{ position: "relative" }}>
                  <CustomerAvatar customer={profile ?? customer} size={80} style={{ fontSize: 28 }} />
                  {photoLoading && (
                    <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#374151", fontWeight: 700 }}>
                      ...
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <label
                      style={{ background: SECONDARY, color: "#fff", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: photoLoading || !profile ? "not-allowed" : "pointer", opacity: photoLoading || !profile ? 0.7 : 1 }}
                    >
                      {profile?.image ? "ছবি পরিবর্তন" : "ছবি আপলোড"}
                      <input
                        type="file"
                        accept={PHOTO_TYPES.join(",")}
                        disabled={photoLoading || !profile}
                        style={{ display: "none" }}
                        onChange={(e) => { handlePhotoSelected(e.target.files?.[0]); e.target.value = ""; }}
                      />
                    </label>
                    {profile?.image && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={photoLoading}
                        style={{ background: "#fff", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: photoLoading ? "not-allowed" : "pointer" }}
                      >
                        ছবি সরান
                      </button>
                    )}
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "#9ca3af" }}>JPG, PNG, WEBP বা GIF · সর্বোচ্চ ২ MB</p>
                  {photoError && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#dc2626" }}>{photoError}</p>}
                </div>
              </div>

              {!profile && !pfError ? (
                <div style={{ padding: 20, textAlign: "center", color: "#999" }}>লোড হচ্ছে...</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>পূর্ণ নাম *</label>
                    <input value={pfName} onChange={(e) => setPfName(e.target.value)} style={inputStyle} placeholder="আপনার নাম" maxLength={128} />
                  </div>
                  <div>
                    <label style={labelStyle}>মোবাইল নম্বর</label>
                    <input value={profile?.phone ?? customer?.phone ?? ""} readOnly disabled style={{ ...inputStyle, background: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" }} />
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "#9ca3af" }}>মোবাইল নম্বর দিয়ে লগইন ও অর্ডার খোঁজা হয়, তাই এটি পরিবর্তন করা যাবে না।</p>
                  </div>
                  <div>
                    <label style={labelStyle}>ইমেইল</label>
                    <input type="email" value={pfEmail} onChange={(e) => setPfEmail(e.target.value)} style={inputStyle} placeholder="example@email.com" />
                  </div>
                  <div>
                    <label style={labelStyle}>ঠিকানা</label>
                    <input value={pfAddress} onChange={(e) => setPfAddress(e.target.value)} style={inputStyle} placeholder="বাসা, রোড, এলাকা" maxLength={64} />
                  </div>
                  <div>
                    <label style={labelStyle}>শহর / জেলা</label>
                    <input value={pfCity} onChange={(e) => setPfCity(e.target.value)} style={inputStyle} placeholder="যেমন: ঢাকা" />
                  </div>

                  {pfError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{pfError}</div>}
                  {pfSuccess && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#166534" }}>{pfSuccess}</div>}

                  <button
                    onClick={handleSaveProfile} disabled={pfLoading || !profile}
                    style={{ background: PRIMARY, color: "#fff", border: "none", borderRadius: 8, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: pfLoading || !profile ? "not-allowed" : "pointer", opacity: pfLoading || !profile ? 0.7 : 1 }}
                  >
                    {pfLoading ? "সেভ হচ্ছে..." : "সেভ করুন"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Password change tab */}
          {tab === "password" && (
            <div style={{ background: "#fff", borderRadius: 12, padding: "28px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", maxWidth: 440 }}>
              <h2 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 800, color: "#111" }}>পাসওয়ার্ড পরিবর্তন করুন</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 7 }}>পুরনো পাসওয়ার্ড</label>
                  <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} style={inputStyle} placeholder="বর্তমান পাসওয়ার্ড দিন" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 7 }}>নতুন পাসওয়ার্ড</label>
                  <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={inputStyle} placeholder="নতুন পাসওয়ার্ড দিন (কমপক্ষে ৬ অক্ষর)" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 7 }}>পাসওয়ার্ড নিশ্চিত করুন</label>
                  <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} style={inputStyle} placeholder="আবার নতুন পাসওয়ার্ড দিন" />
                </div>

                {pwError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{pwError}</div>}
                {pwSuccess && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#166534" }}>{pwSuccess}</div>}

                <button
                  onClick={handleChangePassword} disabled={pwLoading}
                  style={{ background: PRIMARY, color: "#fff", border: "none", borderRadius: 8, padding: "13px 0", fontSize: 14, fontWeight: 700, cursor: pwLoading ? "not-allowed" : "pointer", opacity: pwLoading ? 0.7 : 1 }}
                >
                  {pwLoading ? "পরিবর্তন হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন করুন"}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {footer}
    </div>
  );
}

function pageList(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push("…");
  pages.push(totalPages);
  return pages;
}

function Pagination({ page, totalPages, disabled, onChange }: {
  page: number; totalPages: number; disabled?: boolean; onChange: (p: number) => void;
}) {
  const btn = (active: boolean, off: boolean): React.CSSProperties => ({
    minWidth: 38, height: 38, padding: "0 12px", borderRadius: 8, fontSize: 14, fontWeight: 700,
    border: active ? "none" : "1px solid #e5e7eb",
    background: active ? SECONDARY : "#fff", color: active ? "#fff" : "#374151",
    cursor: off ? "not-allowed" : "pointer", opacity: off && !active ? 0.5 : 1,
  });

  return (
    <nav aria-label="Order pages" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 24, flexWrap: "wrap" }}>
      <button style={btn(false, disabled || page <= 1)} disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>
        ← আগের
      </button>
      {pageList(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} style={{ padding: "0 4px", color: "#9ca3af" }}>…</span>
        ) : (
          <button
            key={p}
            style={btn(p === page, !!disabled)}
            disabled={disabled}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ),
      )}
      <button style={btn(false, disabled || page >= totalPages)} disabled={disabled || page >= totalPages} onClick={() => onChange(page + 1)}>
        পরের →
      </button>
    </nav>
  );
}

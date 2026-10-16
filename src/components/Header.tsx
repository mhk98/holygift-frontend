"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NavItem, Product } from "@/data/products";
import { fetchNavItems } from "@/services/menuService";
import { fetchStorefrontProducts } from "@/services/productService";
import { fetchSiteSettings } from "@/services/settingService";
import { useCart } from "@/context/CartContext";
import { useCustomer } from "@/context/CustomerContext";
import AccountMenu from "@/components/AccountMenu";
import ScratchCardMenu from "@/components/ScratchCardMenu";
import { trackPixelEvent } from "@/lib/pixel";

const PRIMARY   = "#111111";   // logo black
const SECONDARY = "#404040";   // charcoal accent

interface HeaderProps {
  logoUrl?: string | null;
  // When the parent is a Server Component it can fetch this once (cached,
  // deduped against any other /menu/public call in the same render) and
  // pass it down, skipping the extra client round-trip below.
  navItems?: NavItem[];
}

function applyFavicon(url: string | null) {
  if (!url) return;
  const existing = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  const link = existing || document.createElement("link");
  link.rel = "icon";
  link.href = url;
  if (!existing) document.head.appendChild(link);
}

function HeaderInner({ logoUrl, navItems: navItemsProp }: HeaderProps) {
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [openDrop,      setOpenDrop]      = useState<string | null>(null);
  const [mobileExpand,  setMobileExpand]  = useState<string | null>(null);
  const [search,        setSearch]        = useState("");
  const [navItems,      setNavItems]      = useState<NavItem[]>(navItemsProp ?? []);
  const [resolvedLogo,  setResolvedLogo]  = useState<string | null>(logoUrl || null);
  // Search dropdown
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const searchRef       = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const lastSearchTrackedRef = useRef("");
  const searchSeqRef = useRef(0);
  const navRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  // The scratch card claim and track pages are focused flows, so they hide product search.
  const pathname = usePathname();
  const showSearch = !pathname?.startsWith("/scratch-card");
  const activeMenu = searchParams.get("menu") || "";
  const activeSub  = searchParams.get("sub")  || "";
  const activeChild = searchParams.get("child") || "";

  // If the parent (a Server Component) already fetched the menu, skip this
  // fetch entirely — otherwise fall back to fetching it here on mount.
  useEffect(() => {
    if (navItemsProp !== undefined) return;
    fetchNavItems().then((items) => {
      if (items.length > 0) setNavItems(items);
    });
  }, [navItemsProp]);

  // Sync logo from prop (server-side) or fetch from API on client
  useEffect(() => {
    if (logoUrl) { setResolvedLogo(logoUrl); return; }
    fetchSiteSettings().then((s) => {
      setResolvedLogo(s.logoUrl || null);
      applyFavicon(s.faviconUrl);
    });
  }, [logoUrl]);

  // Debounced server-side search — queries the backend directly instead of
  // bulk-loading the whole catalog into the browser and filtering locally.
  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setSearchResults([]);
      setSearchOpen(false);
      setSearchLoading(false);
      return;
    }
    setSearchOpen(true);
    setSearchLoading(true);
    const seq = ++searchSeqRef.current;
    const timer = window.setTimeout(() => {
      fetchStorefrontProducts({ searchTerm: q, limit: 10 })
        .then(({ products }) => {
          if (searchSeqRef.current === seq) setSearchResults(products);
        })
        .catch((e) => {
          console.error("Search: failed to fetch products", e);
          if (searchSeqRef.current === seq) setSearchResults([]);
        })
        .finally(() => {
          if (searchSeqRef.current === seq) setSearchLoading(false);
        });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Close search dropdown when clicking outside (both mobile & desktop search)
  useEffect(() => {
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      const outsideDesktop = !searchRef.current?.contains(t);
      const outsideMobile  = !mobileSearchRef.current?.contains(t);
      if (outsideDesktop && outsideMobile) setSearchOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const { items, removeFromCart, totalItems, totalPrice } = useCart();
  const { customer } = useCustomer();
  const [cartOpen, setCartOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2 || lastSearchTrackedRef.current === q) return;
    const timer = window.setTimeout(() => {
      lastSearchTrackedRef.current = q;
      trackPixelEvent(
        "Search",
        {
          content_ids: searchResults.map((item) => item.id),
          content_name: q,
          content_type: "product",
          value: 0,
          currency: "BDT",
          num_items: searchResults.length,
        },
        customer ? { customerId: customer.Id, name: customer.name, phone: customer.phone } : undefined,
      );
    }, 800);
    return () => window.clearTimeout(timer);
  }, [customer, search, searchResults]);

  const handleCartCheckout = () => {
    setCartOpen(false);
    router.push("/checkout");
  };

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(e.target as Node))
        setCartOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node))
        setOpenDrop(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <header className="w-full sticky top-0 z-50 shadow-md">

      {/* ── Logo / Search / Cart bar ── */}
      <div className="bg-white border-b border-gray-100">

        {/* ══ MOBILE layout (< md): 2 rows ══ */}
        <div className="md:hidden">
          {/* Row 1: hamburger | logo | track order · account · cart */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 12px" }}>

            {/* Hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)} style={{ color: "#374151", background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}>
              <svg width={26} height={26} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>

            {/* Logo — centered */}
            <Link href="/" style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative", width: "100%", maxWidth: 110, height: 44 }}>
                {resolvedLogo && (
                  <img src={resolvedLogo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                )}
              </div>
            </Link>

            {/* Right icons: same three as desktop, with labels */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <ScratchCardMenu compact />

            <Link href="/track-order" className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#111111] transition-colors">
              <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <span style={{ fontSize: 10, whiteSpace: "nowrap" }}>Track Order</span>
            </Link>

            <AccountMenu compact />

            {/* Cart icon */}
            <div ref={cartRef} className="relative" style={{ flexShrink: 0 }}>
              <button
                onClick={() => setCartOpen((o) => !o)}
                className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#111111] transition-colors"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative" }}
              >
                <div className="relative">
                  <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
                  </svg>
                  <span
                    className="absolute -top-2 -right-2 text-white flex items-center justify-center rounded-full font-bold"
                    style={{ background: SECONDARY, width: 16, height: 16, fontSize: 10, lineHeight: "16px" }}
                  >{totalItems}</span>
                </div>
                <span style={{ fontSize: 10, whiteSpace: "nowrap" }}>৳{totalPrice.toLocaleString("en-US")}</span>
              </button>

              {/* Cart dropdown */}
              {cartOpen && (
                <div className="absolute right-0 top-full z-[9999]" style={{ paddingTop: 8 }}>
                  <div className="bg-white shadow-2xl" style={{ width: "min(380px, calc(100vw - 24px))", borderRadius: 8, border: "1px solid #eee" }}>
                    {items.length === 0 ? (
                      <p style={{ padding: "20px 16px", textAlign: "center", color: "#999", fontSize: 13 }}>Cart is empty</p>
                    ) : (
                      <>
                        <div style={{ maxHeight: 340, overflowY: "auto" }}>
                          {items.map((item, idx) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid #f5f5f5" }}>
                              <SafeImage sources={[item.image, ...(item.images || [])]} alt={item.name} width={52} height={52} style={{ borderRadius: 6, objectFit: "cover", border: "1px solid #eee", flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#777" }}>Qty: {item.qty}{item.variant ? ` · ${item.variant}` : ""}</p>
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#333", flexShrink: 0 }}>৳{(item.price * item.qty).toLocaleString("en-US")}</span>
                              <button onClick={() => removeFromCart(idx)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#aaa", flexShrink: 0 }} title="Remove">
                                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div style={{ padding: "10px 14px", borderTop: "2px solid #f0f0f0" }}>
                          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>TOTAL : ৳{totalPrice.toLocaleString("en-US")}</span>
                          </div>
                          <button onClick={handleCartCheckout} style={{ width: "100%", background: SECONDARY, color: "#fff", border: "none", borderRadius: 6, padding: "10px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                            Order Now
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Row 2: Search bar — full width */}
          <div hidden={!showSearch} style={{ padding: "0 14px 10px", position: "relative" }} ref={mobileSearchRef}>
            <div style={{ display: "flex", alignItems: "center", height: 40, border: `2px solid ${PRIMARY}`, borderRadius: 50, overflow: "hidden" }}>
              <button
                style={{ width: 44, height: "100%", background: "#f7f7f7", display: "flex", alignItems: "center", justifyContent: "center", border: "none", flexShrink: 0, cursor: "pointer" }}
                onClick={() => search.trim() && setSearchOpen((o) => !o)}
              >
                <svg width={18} height={18} fill="none" stroke={PRIMARY} strokeWidth={2.5} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </button>
              <input
                type="text"
                placeholder="Search Product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                style={{ flex: 1, height: "100%", background: "#f7f7f7", border: "none", outline: "none", padding: "0 10px", fontSize: 13, color: "#555" }}
              />
              {search && (
                <button onClick={() => { setSearch(""); setSearchOpen(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 10px", color: "#999", flexShrink: 0, fontSize: 18, lineHeight: 1 }}>×</button>
              )}
            </div>

            {/* Search results */}
            {searchOpen && searchResults.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 14, right: 14, background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", borderRadius: 8, border: "1px solid #e5e7eb", zIndex: 9999, maxHeight: 400, overflowY: "auto" }}>
                {searchResults.map((p, idx) => (
                  <Link key={p.id} href={`/product/${p.id}`} onClick={() => { setSearchOpen(false); setSearch(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderBottom: idx < searchResults.length - 1 ? "1px solid #f3f4f6" : "none", textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", flexShrink: 0, position: "relative", background: "#f9fafb" }}>
                      <SafeImage sources={[p.image, ...(p.gallery || [])]} alt={p.name} fill className="object-contain" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, color: "#1f2937", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        {p.discount > 0 && <span style={{ fontSize: 11, color: "#9ca3af", textDecoration: "line-through" }}>৳{p.originalPrice.toLocaleString("en-US")}</span>}
                        <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>৳{p.discountedPrice.toLocaleString("en-US")}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {searchOpen && search.trim() && searchResults.length === 0 && !searchLoading && (
              <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 14, right: 14, background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", borderRadius: 8, border: "1px solid #e5e7eb", zIndex: 9999, padding: "14px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                কোনো পণ্য পাওয়া যায়নি
              </div>
            )}
          </div>
        </div>

        {/* ══ DESKTOP layout (md+): logo | search | icons ══ */}
        <div className="hidden md:grid header-logo-bar" style={{ gap: 0 }}>
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div style={{ position: "relative", width: "100%", maxWidth: 260, height: 70 }}>
              {resolvedLogo && (
                <img src={resolvedLogo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "left center" }} />
              )}
            </div>
          </Link>

          {/* Search (kept in the grid but invisible when hidden, so the icons stay on the right) */}
          <div
            aria-hidden={!showSearch}
            style={{ padding: "0 11px", position: "relative", visibility: showSearch ? undefined : "hidden" }}
            ref={searchRef}
          >
            <div style={{ display: "flex", alignItems: "center", height: 44, border: `2px solid ${PRIMARY}`, borderRadius: 50, overflow: "hidden" }}>
              <button
                style={{ width: "12%", height: "100%", background: "#f7f7f7", display: "flex", alignItems: "center", justifyContent: "center", border: "none", flexShrink: 0, cursor: "pointer" }}
                onClick={() => search.trim() && setSearchOpen((o) => !o)}
              >
                <svg width={20} height={20} fill="none" stroke={PRIMARY} strokeWidth={2.5} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </button>
              <input
                type="text"
                placeholder="Search Product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                style={{ width: "90%", height: "100%", background: "#f7f7f7", border: "none", outline: "none", padding: "0 12px", fontSize: 12, color: "#555" }}
              />
              {search && (
                <button onClick={() => { setSearch(""); setSearchOpen(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 10px", color: "#999", flexShrink: 0, fontSize: 18, lineHeight: 1 }}>×</button>
              )}
            </div>

            {searchOpen && searchResults.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", borderRadius: 8, border: "1px solid #e5e7eb", zIndex: 9999, maxHeight: 480, overflowY: "auto" }}>
                {searchResults.map((p, idx) => (
                  <Link key={p.id} href={`/product/${p.id}`} onClick={() => { setSearchOpen(false); setSearch(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: idx < searchResults.length - 1 ? "1px solid #f3f4f6" : "none", textDecoration: "none", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <div style={{ width: 50, height: 50, borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", flexShrink: 0, position: "relative", background: "#f9fafb" }}>
                      <SafeImage sources={[p.image, ...(p.gallery || [])]} alt={p.name} fill className="object-contain" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, color: "#1f2937", fontWeight: 500 }}>{p.name}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                        {p.discount > 0 && <span style={{ fontSize: 12, color: "#9ca3af", textDecoration: "line-through" }}>৳{p.originalPrice.toLocaleString("en-US")}</span>}
                        <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>৳{p.discountedPrice.toLocaleString("en-US")}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {searchOpen && search.trim() && searchResults.length === 0 && !searchLoading && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", borderRadius: 8, border: "1px solid #e5e7eb", zIndex: 9999, padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                কোনো পণ্য পাওয়া যায়নি
              </div>
            )}
          </div>

          {/* Right icons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 20 }}>
            <div className="hidden md:block">
              <ScratchCardMenu />
            </div>

            <Link href="/track-order" className="hidden md:flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#111111] transition-colors">
              <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <span style={{ fontSize: 11 }}>Track Order</span>
            </Link>

            <AccountMenu />

            {/* Cart with hover dropdown */}
            <div ref={cartRef} className="relative" onMouseEnter={() => setCartOpen(true)} onMouseLeave={() => setCartOpen(false)}>
              <button className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#111111] transition-colors">
                <div className="relative">
                  <svg width={26} height={26} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
                  </svg>
                  <span className="absolute -top-2 -right-2 text-white flex items-center justify-center rounded-full font-bold" style={{ background: SECONDARY, width: 18, height: 18, fontSize: 11, lineHeight: "18px" }}>{totalItems}</span>
                </div>
                <span style={{ fontSize: 11 }}>৳{totalPrice.toLocaleString("en-US")}</span>
              </button>

              {cartOpen && (
                <div className="absolute right-0 top-full z-[9999]" style={{ paddingTop: 8 }}>
                  <div className="bg-white shadow-2xl" style={{ width: "min(420px, calc(100vw - 24px))", borderRadius: 8, border: "1px solid #eee" }}>
                    {items.length === 0 ? (
                      <p style={{ padding: "20px 16px", textAlign: "center", color: "#999", fontSize: 13 }}>Cart is empty</p>
                    ) : (
                      <>
                        <div style={{ maxHeight: 380, overflowY: "auto" }}>
                          {items.map((item, idx) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid #f5f5f5" }}>
                              <SafeImage sources={[item.image, ...(item.images || [])]} alt={item.name} width={64} height={64} style={{ borderRadius: 8, objectFit: "cover", border: "1px solid #eee", flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                                <p style={{ margin: "5px 0 0", fontSize: 13, color: "#777" }}>Qty: {item.qty}{item.variant ? ` · ${item.variant}` : ""}</p>
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#333", flexShrink: 0 }}>৳{(item.price * item.qty).toLocaleString("en-US")}</span>
                              <button onClick={() => removeFromCart(idx)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#aaa", flexShrink: 0 }} title="Remove">
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div style={{ padding: "12px 14px", borderTop: "2px solid #f0f0f0" }}>
                          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#333" }}>TOTAL : ৳{totalPrice.toLocaleString("en-US")}</span>
                          </div>
                          <button onClick={handleCartCheckout} style={{ width: "100%", background: SECONDARY, color: "#fff", border: "none", borderRadius: 6, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                            Order Now
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── Navigation bar ── */}
      <nav style={{ backgroundColor: PRIMARY }} ref={navRef}>
        <div style={{ width: "90%", margin: "0 auto" }}>

          {/* Desktop nav — justify-evenly so equal gap between AND at edges */}
          <ul className="hidden md:flex items-center justify-evenly">
            {navItems.map((item) => {
              const subItems = Array.isArray(item.sub) ? item.sub : [];
              const isActive = activeMenu.toLowerCase() === item.label.toLowerCase();

              return (
                <li
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => subItems.length > 0 && setOpenDrop(item.label)}
                  onMouseLeave={() => setOpenDrop(null)}
                >
                  <Link
                    href={`/?menu=${encodeURIComponent(item.label)}`}
                    className="flex items-center gap-1 text-white uppercase font-semibold whitespace-nowrap transition-colors hover:opacity-80"
                    style={{
                      fontSize: 13,
                      padding: "18px 6px",
                      display: "flex",
                      borderBottom: isActive ? `3px solid ${SECONDARY}` : "3px solid transparent",
                    }}
                  >
                    {item.label}
                    {subItems.length > 0 && (
                      <svg width={10} height={10} viewBox="0 0 10 10" fill="none" style={{ marginLeft: 3, flexShrink: 0 }}>
                        <path d="M1 3l4 4 4-4" stroke="white" strokeWidth={1.8} />
                      </svg>
                    )}
                  </Link>

                  {/* Dropdown */}
                  {subItems.length > 0 && openDrop === item.label && (
                    <div
                      className="absolute top-full left-0 bg-white shadow-xl z-50 animate-fadeIn"
                      style={{ minWidth: 200, border: "1px solid #eee", borderTop: `3px solid ${SECONDARY}` }}
                    >
                      {subItems.map((sub) => {
                        const isSubActive =
                          isActive && activeSub.toLowerCase() === sub.label.toLowerCase();
                        const childItems = Array.isArray(sub.childItems) ? sub.childItems : [];
                        return (
                          <div key={sub.label} className="border-b border-gray-100 last:border-0">
                            <Link
                              href={`/?menu=${encodeURIComponent(item.label)}&sub=${encodeURIComponent(sub.label)}`}
                              className="flex items-center gap-2 transition-colors"
                              style={{
                                fontSize: 14,
                                padding: "10px 18px",
                                backgroundColor: isSubActive && !activeChild ? SECONDARY : "",
                                color: isSubActive && !activeChild ? "#fff" : "#374151",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = SECONDARY;
                                e.currentTarget.style.color = "#fff";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = isSubActive && !activeChild ? SECONDARY : "";
                                e.currentTarget.style.color = isSubActive && !activeChild ? "#fff" : "";
                              }}
                            >
                              <span style={{ color: isSubActive && !activeChild ? "#fff" : PRIMARY, fontSize: 16, lineHeight: 1 }}>›</span>
                              <span style={{ flex: 1 }}>{sub.label}</span>
                            </Link>

                            {childItems.map((child) => {
                              const isChildActive =
                                isSubActive && activeChild.toLowerCase() === child.label.toLowerCase();
                              return (
                                <Link
                                  key={`${sub.label}-${child.label}`}
                                  href={`/?menu=${encodeURIComponent(item.label)}&sub=${encodeURIComponent(sub.label)}&child=${encodeURIComponent(child.label)}`}
                                  className="flex items-center gap-2 transition-colors"
                                  style={{
                                    fontSize: 13,
                                    padding: "8px 18px 8px 34px",
                                    backgroundColor: isChildActive ? SECONDARY : "#fafafa",
                                    color: isChildActive ? "#fff" : "#4b5563",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = SECONDARY;
                                    e.currentTarget.style.color = "#fff";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = isChildActive ? SECONDARY : "#fafafa";
                                    e.currentTarget.style.color = isChildActive ? "#fff" : "#4b5563";
                                  }}
                                >
                                  <span style={{ color: isChildActive ? "#fff" : PRIMARY, fontSize: 14, lineHeight: 1 }}>›</span>
                                  {child.label}
                                </Link>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Mobile nav */}
          {mobileOpen && (
            <div className="md:hidden">
              {navItems.map((item) => {
                const subItems = Array.isArray(item.sub) ? item.sub : [];
                const isExpanded = mobileExpand === item.label;

                return (
                  <div key={item.label}>
                    <div
                      className="flex items-center justify-between text-white border-b cursor-pointer"
                      style={{ fontSize: 14, padding: "12px 16px", borderColor: "rgba(255,255,255,0.2)" }}
                      onClick={() => {
                        if (subItems.length > 0) {
                          setMobileExpand(isExpanded ? null : item.label);
                        } else {
                          router.push(`/?menu=${encodeURIComponent(item.label)}`);
                          setMobileOpen(false);
                        }
                      }}
                    >
                      <Link
                        href={`/?menu=${encodeURIComponent(item.label)}`}
                        className="flex-1 text-white"
                        onClick={(e) => subItems.length > 0 && e.preventDefault()}
                      >
                        {item.label}
                      </Link>
                      {subItems.length > 0 && (
                        <span className="text-white/60 ml-2">{isExpanded ? "▾" : "›"}</span>
                      )}
                    </div>

                    {isExpanded && subItems.length > 0 && (
                      <div style={{ backgroundColor: "rgba(0,0,0,0.25)" }}>
                        {subItems.map((sub) => (
                          <div key={sub.label}>
                            <Link
                              href={`/?menu=${encodeURIComponent(item.label)}&sub=${encodeURIComponent(sub.label)}`}
                              className="flex items-center gap-2 text-white/90 border-b"
                              style={{ fontSize: 13, padding: "10px 28px", borderColor: "rgba(255,255,255,0.1)" }}
                              onClick={() => setMobileOpen(false)}
                            >
                              <span style={{ color: PRIMARY }}>›</span>
                              {sub.label}
                            </Link>
                            {(sub.childItems || []).map((child) => (
                              <Link
                                key={`${sub.label}-${child.label}`}
                                href={`/?menu=${encodeURIComponent(item.label)}&sub=${encodeURIComponent(sub.label)}&child=${encodeURIComponent(child.label)}`}
                                className="flex items-center gap-2 text-white/80 border-b"
                                style={{ fontSize: 12, padding: "9px 28px 9px 46px", borderColor: "rgba(255,255,255,0.08)" }}
                                onClick={() => setMobileOpen(false)}
                              >
                                <span style={{ color: PRIMARY }}>›</span>
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

export default function Header({ logoUrl, navItems }: HeaderProps) {
  return (
    <Suspense>
      <HeaderInner logoUrl={logoUrl} navItems={navItems} />
    </Suspense>
  );
}

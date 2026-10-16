"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { BASE } from "@/lib/api";
import { markPixelsReady, trackPageView } from "@/lib/pixel";

interface TrackingConfig {
  metaPixels?: { pixelsId: string }[];
  tiktokPixels?: { pixelCode: string }[];
  googleAds?: { conversionId: string; conversionLabel?: string | null }[];
}

function appendScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function initMeta(pixelIds: string[]) {
  if (!pixelIds.length) return;
  if (typeof window.fbq !== "function") {
    // Same as Meta's official stub: once fbevents.js loads it sets callMethod, and
    // every later call (AddToCart, Purchase, ...) must go through it, not the queue.
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue?.push(args);
    } as Window["fbq"] & { disablePushState?: boolean };
    // PageView is tracked manually on route change (with an eventID for dedup);
    // stop the pixel from sending its own extra PageView on history changes.
    fbq.disablePushState = true;
    window.fbq = fbq;
    window.fbq.queue = [];
    window.fbq.loaded = true;
    window.fbq.version = "2.0";
    window._fbq = window.fbq;
    appendScript("meta-pixel-sdk", "https://connect.facebook.net/en_US/fbevents.js");
  }
  pixelIds.forEach((id) => window.fbq("init", id));
}

function initTiktok(pixelCodes: string[]) {
  if (!pixelCodes.length) return;
  const existing = window.ttq as unknown as Record<string, unknown> | undefined;
  if (!existing || !Array.isArray(window.ttq)) {
    const ttq = [] as unknown[] & {
      methods?: string[];
      setAndDefer?: (target: Record<string, unknown>, method: string) => void;
      instance?: (pixelCode: string) => Record<string, unknown>;
      load?: (pixelCode: string) => void;
      page?: () => void;
      _i?: Record<string, Record<string, unknown>>;
      _t?: Record<string, number>;
      _o?: Record<string, unknown>;
    };
    window.ttq = ttq as typeof window.ttq;
    ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
    ttq.setAndDefer = (target, method) => {
      target[method] = (...args: unknown[]) => ttq.push([method, ...args]);
    };
    ttq.methods.forEach((method) => ttq.setAndDefer?.(ttq as unknown as Record<string, unknown>, method));
    ttq.instance = (pixelCode) => {
      ttq._i = ttq._i || {};
      ttq._i[pixelCode] = ttq._i[pixelCode] || {};
      ttq.methods?.forEach((method) => ttq.setAndDefer?.(ttq._i![pixelCode], method));
      return ttq._i[pixelCode];
    };
    ttq.load = (pixelCode) => {
      ttq._i = ttq._i || {};
      ttq._i[pixelCode] = ttq._i[pixelCode] || {};
      ttq._i[pixelCode]._u = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._t = ttq._t || {};
      ttq._t[pixelCode] = Date.now();
      ttq._o = ttq._o || {};
      ttq._o[pixelCode] = {};
      appendScript(
        `tiktok-pixel-sdk-${pixelCode}`,
        `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(pixelCode)}&lib=ttq`,
      );
    };
  }
  pixelCodes.forEach((code) => {
    const loader = (window.ttq as unknown as { load?: (pixelCode: string) => void })?.load;
    if (loader) loader(code);
  });
}

function initGoogleAds(configs: NonNullable<TrackingConfig["googleAds"]>) {
  const first = configs.find((item) => item.conversionId);
  if (!first) return;
  window.__googleAdsConfigs = configs;
  appendScript("google-gtag-sdk", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(first.conversionId)}`);
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function (...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  configs.forEach((item) => window.gtag?.("config", item.conversionId, { send_page_view: false }));
}

export default function MetaPixel() {
  const pathname = usePathname();

  useEffect(() => {
    fetch(`${BASE}/tracking/config`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const config = (json?.data || {}) as TrackingConfig;
        initMeta((config.metaPixels || []).map((item) => item.pixelsId).filter(Boolean));
        initTiktok((config.tiktokPixels || []).map((item) => item.pixelCode).filter(Boolean));
        initGoogleAds(config.googleAds || []);
      })
      .catch(() => {})
      .finally(markPixelsReady);
  }, []);

  // Fires on first load and on every client-side route change; browser side waits for init
  useEffect(() => {
    trackPageView();
  }, [pathname]);

  return null;
}

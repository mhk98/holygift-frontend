"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { BASE } from "@/lib/api";
import { captureFbclid, markPixelsReady, trackPageView } from "@/lib/pixel";

interface TrackingConfig {
  metaPixels?: { pixelsId: string }[];
}

// Loads fbevents.js once and initialises each enabled pixel. Pixel IDs are the
// only thing the browser gets; access tokens stay on the server.
function initMeta(pixelIds: string[]) {
  if (!pixelIds.length) return;
  if (typeof window.fbq !== "function") {
    // Same as Meta's official stub: once fbevents.js loads it sets callMethod, and
    // every later call must go through it, not the queue.
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
    if (!document.getElementById("meta-pixel-sdk")) {
      const script = document.createElement("script");
      script.id = "meta-pixel-sdk";
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);
    }
  }
  pixelIds.forEach((id) => window.fbq("init", id));
}

let initStarted = false;

export default function MetaPixel() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Guard against React re-running the effect (dev strict mode, remounts).
    if (initStarted) return;
    initStarted = true;
    captureFbclid();
    let ids: string[] = [];
    fetch(`${BASE}/tracking/config`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const config = (json?.data || {}) as TrackingConfig;
        ids = [...new Set((config.metaPixels || []).map((item) => item.pixelsId).filter(Boolean))];
        initMeta(ids);
      })
      .catch(() => {})
      .finally(() => markPixelsReady(ids));
  }, []);

  // One PageView per route: first load and every client-side navigation.
  useEffect(() => {
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;
    trackPageView();
  }, [pathname]);

  return null;
}

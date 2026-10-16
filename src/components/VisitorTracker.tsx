"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function VisitorTracker() {
  useEffect(() => {
    const key = "kafela_visitor_tracked";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    apiFetch("/visitor-stats/track", { method: "POST" }).catch(() => {
      sessionStorage.removeItem(key);
    });
  }, []);

  return null;
}

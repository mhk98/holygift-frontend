"use client";

import type { SiteChromeSlots } from "@/components/SiteChrome";
import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import { scratchCardFontClass } from "../fonts";
import styles from "../ScratchCard.module.css";

interface TrackedClaim {
  Id: number;
  referenceCode: string | null;
  prize: string;
  status: string;
  claimType: "first" | "repeat";
  createdAt: string;
  updatedAt: string;
}

const PRIZE_LABELS: Record<string, string> = {
  TV: "টিভি",
  Fridge: "ফ্রিজ",
  Freeze: "ফ্রিজ",
  "Rice Cooker": "রাইস কুকার",
  "Induction Chula": "ইন্ডাকশন চুলা",
  "Big Size Wall Watch": "লাক্সারি দেয়াল ঘড়ি",
  "Luxury Wall Watch": "লাক্সারি দেয়াল ঘড়ি",
};

const STATUS_META: Record<string, { label: string; text: string; tone: string }> = {
  Pending: { label: "যাচাই চলছে", text: "আপনার কার্ডটি যাচাই করা হচ্ছে।", tone: "#d97706" },
  Approved: { label: "অনুমোদিত", text: "কার্ডটি যাচাই হয়েছে, শীঘ্রই পুরস্কার পাঠানো হবে।", tone: "#2563eb" },
  "In Transit": { label: "পথে আছে", text: "পুরস্কার পাঠানো হয়েছে, শীঘ্রই আপনার কাছে পৌঁছাবে।", tone: "#7c3aed" },
  Rejected: { label: "বাতিল", text: "কার্ডটি যাচাইয়ে বাতিল হয়েছে। বিস্তারিত জানতে আমাদের সাথে যোগাযোগ করুন।", tone: "#dc2626" },
  Delivered: { label: "ডেলিভারি হয়েছে", text: "পুরস্কার আপনার কাছে পাঠানো হয়েছে।", tone: "#16a34a" },
};

function fmtDate(value: string) {
  return new Date(value).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" });
}

export default function ScratchCardTrackClient({
  header,
  banner,
}: Pick<SiteChromeSlots, "header"> & { banner?: ReactNode }) {
  const [phone, setPhone] = useState("");
  const [claims, setClaims] = useState<TrackedClaim[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const track = async (e: FormEvent) => {
    e.preventDefault();
    const value = phone.trim();
    if (!/^01\d{9}$/.test(value)) {
      setError("সঠিক ১১ ডিজিটের ফোন নম্বর দিন");
      return;
    }
    setError("");
    setLoading(true);
    setClaims(null);
    try {
      const res = await apiFetch<ApiResponse<TrackedClaim[]>>("/scratch-cards/track", {
        params: { phone: value },
      });
      setClaims(res.data || []);
    } catch {
      setError("তথ্য আনতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <MarqueeBanner />
      {header}

      <main className={`${styles.main} ${scratchCardFontClass}`}>
        <div className={styles.container}>
        {banner}
        <div className={styles.trackWrap}>
          <div className={styles.trackHead}>
            <div className={styles.badge}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <h1 className={styles.title}>স্ক্র্যাচ কার্ড ট্র্যাক করুন</h1>
            <p className={styles.subtitle}>
              যে ফোন নম্বর দিয়ে স্ক্র্যাচ কার্ড জমা দিয়েছেন সেটি দিন। আপনার সব কার্ডের
              পুরস্কার ও বর্তমান অবস্থা দেখতে পাবেন।
            </p>
          </div>

          <form onSubmit={track} className={`${styles.card} ${styles.trackForm}`} noValidate>
            <label htmlFor="sc-track-phone" className={styles.label}>ফোন নম্বর</label>
            <div className={styles.trackRow}>
              <input
                id="sc-track-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="01XXXXXXXXX"
                className={styles.input}
              />
              <button type="submit" disabled={loading} className={`${styles.submit} ${styles.trackBtn}`}>
                {loading ? "খুঁজছি..." : "ট্র্যাক করুন"}
              </button>
            </div>
            {error && <p className={styles.error} role="alert">{error}</p>}
          </form>

          {claims && claims.length === 0 && (
            <div className={`${styles.card} ${styles.trackEmpty}`}>
              <p className={styles.successTitle}>কোনো স্ক্র্যাচ কার্ড পাওয়া যায়নি</p>
              <p className={styles.successText}>এই নম্বর দিয়ে এখনো কোনো কার্ড জমা দেওয়া হয়নি।</p>
              <Link href="/scratch-card" className={`${styles.submit} ${styles.successBtn} ${styles.trackLinkBtn}`}>
                স্ক্র্যাচ কার্ড জমা দিন
              </Link>
            </div>
          )}

          {claims && claims.length > 0 && (
            <div className={styles.trackList}>
              <p className={styles.trackCount}>মোট {claims.length.toLocaleString("bn-BD")}টি কার্ড পাওয়া গেছে</p>
              {claims.map((claim) => {
                const meta = STATUS_META[claim.status] || { label: claim.status, text: "", tone: "#6b7280" };
                return (
                  <div key={claim.Id} className={`${styles.card} ${styles.trackItem}`}>
                    <div className={styles.trackItemHead}>
                      <div>
                        <p className={styles.trackPrize}>{PRIZE_LABELS[claim.prize] || claim.prize}</p>
                        <p className={styles.trackMeta}>
                          {claim.referenceCode ?? "—"} · {claim.claimType === "repeat" ? "অতিরিক্ত কার্ড" : "প্রথম কার্ড"} · জমা: {fmtDate(claim.createdAt)}
                        </p>
                      </div>
                      <span
                        className={styles.trackStatus}
                        style={{ color: meta.tone, background: `${meta.tone}14`, borderColor: `${meta.tone}40` }}
                      >
                        {meta.label}
                      </span>
                    </div>
                    {meta.text && <p className={styles.trackNote}>{meta.text}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}

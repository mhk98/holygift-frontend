import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteChrome";
import ScratchCardBanner from "../ScratchCardBanner";
import ScratchCardClient from "../ScratchCardClient";

export const metadata: Metadata = {
  title: "আরেকটি Scratch Card",
};

export default async function AnotherScratchCardPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string | string[] }>;
}) {
  const { phone } = await searchParams;
  const initialPhone = (Array.isArray(phone) ? phone[0] : phone || "")
    .replace(/\D/g, "")
    .slice(0, 11);

  return (
    <ScratchCardClient
      mode="additional"
      initialPhone={initialPhone}
      header={<SiteHeader />}
      banner={<ScratchCardBanner />}
    />
  );
}

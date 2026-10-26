import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteChrome";
import ScratchCardBanner from "./ScratchCardBanner";
import ScratchCardClient from "./ScratchCardClient";
import { fetchScratchCardPrizes } from "@/services/scratchCardPrizeService";

export const metadata: Metadata = {
  title: "Scratch Card",
};

export default async function ScratchCardPage() {
  const prizes = await fetchScratchCardPrizes();
  return (
    <ScratchCardClient
      header={<SiteHeader />}
      banner={<ScratchCardBanner />}
      prizes={prizes}
    />
  );
}

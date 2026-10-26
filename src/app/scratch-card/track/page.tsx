import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteChrome";
import ScratchCardBanner from "../ScratchCardBanner";
import ScratchCardTrackClient from "./ScratchCardTrackClient";
import { fetchScratchCardPrizes } from "@/services/scratchCardPrizeService";

export const metadata: Metadata = {
  title: "Scratch Card Track",
};

export default async function ScratchCardTrackPage() {
  const prizes = await fetchScratchCardPrizes();
  return (
    <ScratchCardTrackClient
      header={<SiteHeader />}
      banner={<ScratchCardBanner />}
      prizes={prizes}
    />
  );
}

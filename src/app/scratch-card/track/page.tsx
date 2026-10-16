import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteChrome";
import ScratchCardBanner from "../ScratchCardBanner";
import ScratchCardTrackClient from "./ScratchCardTrackClient";

export const metadata: Metadata = {
  title: "Scratch Card Track",
};

export default function ScratchCardTrackPage() {
  return (
    <ScratchCardTrackClient
      header={<SiteHeader />}
      banner={<ScratchCardBanner />}
    />
  );
}

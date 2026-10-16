import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteChrome";
import ScratchCardBanner from "./ScratchCardBanner";
import ScratchCardClient from "./ScratchCardClient";

export const metadata: Metadata = {
  title: "Scratch Card",
};

export default function ScratchCardPage() {
  return (
    <ScratchCardClient header={<SiteHeader />} banner={<ScratchCardBanner />} />
  );
}

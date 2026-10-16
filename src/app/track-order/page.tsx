import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import TrackOrderClient from "./TrackOrderClient";

export default function TrackOrderPage() {
  return <TrackOrderClient header={<SiteHeader />} footer={<SiteFooter />} />;
}

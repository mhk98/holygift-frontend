import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import ReConfirmClient from "./ReConfirmClient";

export default function ReConfirmPage() {
  return <ReConfirmClient header={<SiteHeader />} footer={<SiteFooter />} />;
}

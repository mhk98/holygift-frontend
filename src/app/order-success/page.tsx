import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import OrderSuccessClient from "./OrderSuccessClient";

export default function OrderSuccessPage() {
  return <OrderSuccessClient header={<SiteHeader />} footer={<SiteFooter />} />;
}

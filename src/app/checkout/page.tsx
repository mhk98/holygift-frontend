import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import CheckoutClient from "./CheckoutClient";

export default function CheckoutPage() {
  return <CheckoutClient header={<SiteHeader />} footer={<SiteFooter />} />;
}

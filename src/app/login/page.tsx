import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import LoginClient from "./LoginClient";

export default function CustomerLoginPage() {
  return <LoginClient header={<SiteHeader />} footer={<SiteFooter />} />;
}

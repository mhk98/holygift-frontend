import { SiteFooter, SiteHeader, getSiteSettings } from "@/components/SiteChrome";
import ContactClient from "./ContactClient";

export default async function ContactPage() {
  const settings = await getSiteSettings();
  return (
    <ContactClient
      header={<SiteHeader />}
      footer={<SiteFooter />}
      initialSettings={settings}
    />
  );
}

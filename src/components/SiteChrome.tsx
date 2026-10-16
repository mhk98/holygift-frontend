import { cache, type ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { fetchSiteSettings } from "@/services/settingService";
import { fetchNavItems } from "@/services/menuService";
import { fetchPublicPages } from "@/services/pageService";

// Server-rendered header/footer for pages whose body is a Client Component.
// The page passes these in as props so the data is fetched (and cached) on
// the server instead of by the browser after hydration.

export interface SiteChromeSlots {
  header: ReactNode;
  footer: ReactNode;
}

const getSiteChrome = cache(async () => {
  const [settings, navItems, pages] = await Promise.all([
    fetchSiteSettings(),
    fetchNavItems().catch(() => []),
    fetchPublicPages().catch(() => []),
  ]);
  return { settings, navItems, pages };
});

export const getSiteSettings = async () => (await getSiteChrome()).settings;

export async function SiteHeader() {
  const { settings, navItems } = await getSiteChrome();
  return <Header logoUrl={settings.logoUrl} navItems={navItems} />;
}

export async function SiteFooter() {
  const { settings, pages } = await getSiteChrome();
  return <Footer settings={settings} pages={pages} />;
}

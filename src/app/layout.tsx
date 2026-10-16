import type { Metadata } from "next";
import { Lato } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { CustomerProvider } from "@/context/CustomerContext";
import MetaPixel from "@/components/MetaPixel";
import VisitorTracker from "@/components/VisitorTracker";
import { fetchSiteSettings } from "@/services/settingService";

const lato = Lato({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

const baseMetadata: Metadata = {
  title: "Holy Gift - Holy Gift is the best level ecommerce in Bangladesh",
  description: "Best level ecommerce in Bangladesh",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: { url: "/apple-icon.png", sizes: "256x256", type: "image/png" },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSiteSettings();
  const iconUrl = settings.faviconUrl || "/icon.png";

  return {
    ...baseMetadata,
    title: settings.metaTitle || baseMetadata.title,
    description: settings.metaDescription || baseMetadata.description,
    keywords: settings.metaKeyword || undefined,
    icons: {
      icon: [{ url: iconUrl }],
      apple: { url: iconUrl, sizes: "256x256" },
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={lato.className} suppressHydrationWarning>
      <head>
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PJTGHNFR');`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PJTGHNFR"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <MetaPixel />
        <VisitorTracker />
        <CustomerProvider>
          <CartProvider>{children}</CartProvider>
        </CustomerProvider>
      </body>
    </html>
  );
}

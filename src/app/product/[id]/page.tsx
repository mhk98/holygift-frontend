import { notFound } from "next/navigation";
import MarqueeBanner from "@/components/MarqueeBanner";
import Header from "@/components/Header";
import { SiteFooter } from "@/components/SiteChrome";
import FloatingContact from "@/components/FloatingContact";
import ScrollToTop from "@/components/ScrollToTop";
import ProductDetailClient from "@/components/ProductDetailClient";
import Container from "@/components/Container";
import { fetchProductById } from "@/services/productService";
import { fetchSiteSettings, type SiteSetting } from "@/services/settingService";
import { fetchNavItems } from "@/services/menuService";
import {
  fetchDeliveryCharges,
  getDeliveryChargeLines,
} from "@/services/shippingChargeService";

// Render each product on its first visit, then serve it from the cache and
// re-render in the background at most once a minute.
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  if (isNaN(productId)) notFound();

  const [product, settings, deliveryCharges, navItems] = await Promise.all([
    fetchProductById(productId),
    fetchSiteSettings().catch(() => ({}) as Partial<SiteSetting>),
    fetchDeliveryCharges().catch(() => []),
    fetchNavItems().catch(() => []),
  ]);

  if (!product) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <MarqueeBanner text={(settings as SiteSetting).marqueeText ?? null} />
      <Header
        logoUrl={(settings as SiteSetting).logoUrl ?? null}
        navItems={navItems}
      />

      <main className="flex-1 py-3">
        <Container>
          <div className="product-page-surface">
            {/* Left+Center: product detail */}
            <div className="flex-1">
              <ProductDetailClient
                product={product}
                whatsappUrl={(settings as SiteSetting).whatsappUrl ?? null}
                phone={(settings as SiteSetting).phone ?? null}
              />
            </div>

            {/* Right: Delivery Info */}
            <div className="delivery-panel">
              <div className="delivery-card">
                <div className="delivery-card-head">
                  <p>Delivery Information</p>
                </div>
                <div>
                  {/* Home delivery */}
                  <div className="delivery-row">
                    <span className="delivery-icon">
                      <svg
                        width="18"
                        height="18"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
                      </svg>
                    </span>
                    <p className="delivery-title">
                      Home delivery available all over Bangladesh
                    </p>
                  </div>
                  {/* Standard delivery */}
                  <div className="delivery-row">
                    <span className="delivery-icon">
                      <svg
                        width="20"
                        height="20"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M3 4h12v10h2.05a3.5 3.5 0 0 1 6.9 0H24v2h-1.05a3.5 3.5 0 0 1-6.9 0h-5.1a3.5 3.5 0 0 1-6.9 0H2v-2h1V4Zm14 3v5h4.17L19.4 8.8A3 3 0 0 0 16.77 7H17ZM7.5 17.5A1.5 1.5 0 1 0 7.5 14a1.5 1.5 0 0 0 0 3.5Zm12 0A1.5 1.5 0 1 0 19.5 14a1.5 1.5 0 0 0 0 3.5Z" />
                      </svg>
                    </span>
                    <div>
                      <p className="delivery-title">Standard Delivery</p>
                      <p className="delivery-copy">
                        • Inside Dhaka 24 Hours guaranteed delivery.
                      </p>
                      <p className="delivery-copy">
                        • Outside Dhaka 48 hours guaranteed delivery after order
                        confirmation
                      </p>
                    </div>
                  </div>
                  {/* Delivery charge */}
                  <div className="delivery-row">
                    <span className="delivery-icon">
                      <svg
                        width="19"
                        height="19"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Zm2 2h14V6H5v2Zm2 5a3 3 0 1 0 6 0 3 3 0 0 0-6 0Zm9-1.5h2v2h-2v-2Zm-1 4h4v1.5h-4v-1.5Z" />
                      </svg>
                    </span>
                    <div>
                      <p className="delivery-title">Regular Delivery Charge</p>
                      {getDeliveryChargeLines(deliveryCharges).map((text) => (
                        <p key={text} className="delivery-copy">
                          • {text}
                        </p>
                      ))}
                    </div>
                  </div>
                  {/* COD */}
                  <div className="delivery-row">
                    <span className="delivery-icon">
                      <svg
                        width="19"
                        height="19"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm2 2v6h14V9H5Zm7 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                      </svg>
                    </span>
                    <p className="delivery-title">Cash on Delivery Available</p>
                  </div>

                  {/* Sold by */}
                  <div className="seller-row">
                    <p className="seller-label">Sold by</p>
                    <div className="seller-meta">
                      <p className="seller-name">Holy Gift</p>
                      {(settings as SiteSetting).whatsappUrl && (
                        <a
                          href={(settings as SiteSetting).whatsappUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="seller-chat"
                        >
                          <svg
                            width="17"
                            height="17"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
                          </svg>
                          Chat Now
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <SiteFooter />
      <FloatingContact settings={settings as Partial<SiteSetting>} />
      <ScrollToTop />
    </div>
  );
}

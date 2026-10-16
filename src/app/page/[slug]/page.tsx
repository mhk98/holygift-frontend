import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { SiteFooter } from "@/components/SiteChrome";
import FloatingContact from "@/components/FloatingContact";
import MarqueeBanner from "@/components/MarqueeBanner";
import { fetchPublicPageBySlug, fetchPublicPages } from "@/services/pageService";
import { fetchSiteSettings, type SiteSetting } from "@/services/settingService";
import { fetchNavItems } from "@/services/menuService";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const pages = await fetchPublicPages();
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await fetchPublicPageBySlug(slug);
  if (!page) return {};
  return {
    title: page.title || page.name,
    description: page.description?.replace(/<[^>]+>/g, "").slice(0, 160),
  };
}

export default async function DynamicWebsitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [page, settings, navItems] = await Promise.all([
    fetchPublicPageBySlug(slug),
    fetchSiteSettings().catch(() => ({}) as Partial<SiteSetting>),
    fetchNavItems().catch(() => []),
  ]);

  if (!page) notFound();

  const pageTitle = page.title || page.name;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <MarqueeBanner text={(settings as SiteSetting).marqueeText ?? null} />
      <Header logoUrl={(settings as SiteSetting).logoUrl ?? null} navItems={navItems} />

      <main className="flex-1 py-10">
        <article
          style={{
            width: "90%",
            maxWidth: 980,
            margin: "0 auto",
            background: "#fff",
            borderRadius: 12,
            padding: "34px 32px",
          }}
        >
          <h1
            style={{
              margin: "0 0 22px",
              fontSize: 30,
              lineHeight: 1.25,
              fontWeight: 900,
              color: "#111827",
            }}
          >
            {pageTitle}
          </h1>
          {page.description ? (
            <div
              className="dynamic-page-content"
              dangerouslySetInnerHTML={{ __html: page.description }}
            />
          ) : (
            <p style={{ color: "#6b7280", margin: 0 }}>Content coming soon.</p>
          )}
        </article>
      </main>

      <SiteFooter />
      <FloatingContact settings={settings as Partial<SiteSetting>} />
    </div>
  );
}

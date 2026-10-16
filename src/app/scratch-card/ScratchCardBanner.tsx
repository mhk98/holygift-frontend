import Image from "next/image";
import Link from "next/link";
import { fetchScratchCardBanners, type BannerItem } from "@/services/bannerService";
import styles from "./ScratchCard.module.css";

function BannerImage({ banner, priority, variant }: { banner: BannerItem; priority: boolean; variant: "desktop" | "mobile" }) {
  const isMobile = variant === "mobile";
  const image = (
    <Image
      src={banner.file}
      alt={banner.alt}
      // Intrinsic size hints only: CSS keeps width 100% and height auto, so any
      // uploaded size shows at its own aspect ratio without cropping.
      width={isMobile ? 1080 : 1920}
      height={isMobile ? 540 : 480}
      priority={priority}
      sizes={isMobile ? "100vw" : "(max-width: 1555px) 90vw, 1400px"}
      className={styles.bannerImg}
    />
  );
  const className = `${styles.banner} ${isMobile ? styles.bannerMobile : styles.bannerDesktop}`;
  return banner.linkUrl ? (
    <Link href={banner.linkUrl} className={className}>{image}</Link>
  ) : (
    <div className={className}>{image}</div>
  );
}

/**
 * Banners uploaded in admin under the "Scratch Card" banner category, stacked
 * above the scratch card pages. A "Scratch Card Mobile" banner, when present,
 * replaces them on phones. Renders nothing when there are none.
 */
export default async function ScratchCardBanner() {
  const banners = await fetchScratchCardBanners();
  const desktop = banners.filter((b) => b.type === "scratch_card");
  const mobile = banners.filter((b) => b.type === "scratch_card_mobile");
  if (!desktop.length && !mobile.length) return null;

  return (
    <div className={`${styles.bannerWrap} ${mobile.length && desktop.length ? styles.hasMobileBanner : ""}`}>
      {desktop.map((banner, index) => (
        <BannerImage key={banner.Id} banner={banner} priority={index === 0} variant="desktop" />
      ))}
      {mobile.map((banner) => (
        <BannerImage key={banner.Id} banner={banner} priority={false} variant={desktop.length ? "mobile" : "desktop"} />
      ))}
    </div>
  );
}

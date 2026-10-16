import type { CategoryMenuItem } from "@/services/menuService";
import Image from "next/image";
import Link from "next/link";
import HorizontalCarousel from "./HorizontalCarousel";
import styles from "./TopCategories.module.css";

interface Props {
  items?: CategoryMenuItem[];
}

export default function TopCategories({ items }: Props) {
  const categories = items ?? [];
  if (categories.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="top-categories-title">
      <div className={styles.header}>
        <h2 id="top-categories-title" className={styles.heading}>TOP CATEGORIES</h2>
      </div>
      <HorizontalCarousel itemWidthClass={styles.item} gap={10} autoplay interval={5000} showArrows>
        {categories.map((cat) => (
          <Link key={cat.Id} href={"/?menu=" + encodeURIComponent(cat.label)} className={styles.card}>
            <div className={styles.imageBox}>
              <Image src={cat.imageUrl!} alt={cat.label} fill sizes="(max-width: 639px) 36vw, (max-width: 1023px) 18vw, 13vw" className={styles.image} draggable={false} />
            </div>
            <span className={styles.label}>{cat.label}</span>
          </Link>
        ))}
      </HorizontalCarousel>
    </section>
  );
}

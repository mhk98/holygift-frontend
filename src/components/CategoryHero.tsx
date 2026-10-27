import Link from "next/link";
import styles from "./CategoryHero.module.css";

interface Props {
  name: string;
  sub?: string;
  child?: string;
  bannerImage?: string | null;
  bannerTitle?: string | null;
}

export default function CategoryHero({ name, sub, child, bannerImage, bannerTitle }: Props) {
  const crumbs = [name, sub, child].filter((c): c is string => Boolean(c));

  return (
    <section className={styles.wrap}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/" className={styles.crumbLink}>Home</Link>
        {crumbs.map((c, i) => (
          <span key={c + i} className={styles.crumbItem}>
            <span className={styles.sep} aria-hidden>›</span>
            {i < crumbs.length - 1 ? (
              <Link
                href={i === 0 ? `/?menu=${encodeURIComponent(name)}` : `/?menu=${encodeURIComponent(name)}&sub=${encodeURIComponent(c)}`}
                className={styles.crumbLink}
              >
                {c}
              </Link>
            ) : (
              <span className={styles.crumbCurrent}>{c}</span>
            )}
          </span>
        ))}
      </nav>

      {bannerImage && (
        <div className={styles.hero}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bannerImage} alt={bannerTitle || name} className={styles.image} />
        </div>
      )}

      <div className={styles.details}>
        <span className={styles.eyebrow}>{bannerTitle ? crumbs[crumbs.length - 1] : "Category"}</span>
        <h1 className={styles.title}>{bannerTitle || crumbs[crumbs.length - 1]}</h1>
      </div>
    </section>
  );
}

import Link from "next/link";
import { Product } from "@/data/products";
import ProductCard from "./ProductCard";
import Container from "./Container";
import HorizontalCarousel from "./HorizontalCarousel";

interface ProductSectionProps {
  title: string;
  products: Product[];
  menuParam?: string;
}

export default function ProductSection({
  title,
  products,
  menuParam,
}: ProductSectionProps) {
  if (products.length === 0) return null;

  return (
    <section style={{ paddingTop: 6, paddingBottom: 6 }}>
      <Container>
        <div
          className="flex items-center justify-between"
          style={{ marginTop: 22, marginBottom: 12 }}
        >
          <h2
            className="uppercase text-gray-800"
            style={{ fontSize: 14, fontWeight: 700 }}
          >
            {title}
          </h2>
          <Link
            href={`/?menu=${encodeURIComponent(menuParam ?? title)}`}
            className="border text-[#111111] border-[#111111] hover:bg-[#111111] hover:text-white transition-colors font-semibold whitespace-nowrap"
            style={{ borderRadius: 2, padding: "3px 10px", fontSize: 11 }}
          >
            View All
          </Link>
        </div>

        <HorizontalCarousel
          itemWidthClass="w-[calc(50%-5px)] sm:w-[calc(33.333%-7px)] lg:w-[calc(16.666%-9px)]"
          gap={10}
          autoplay
          interval={6000}
          showArrows={false}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </HorizontalCarousel>
      </Container>
    </section>
  );
}

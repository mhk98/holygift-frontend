"use client";
import Image from "next/image";
import Container from "./Container";
import type { BrandItem } from "@/services/brandService";

interface Props {
  brands?: BrandItem[];
}

export default function BrandsSection({ brands: brandsProp }: Props) {
  const source = brandsProp || [];
  if (source.length === 0) return null;

  // Duplicate list so the marquee scrolls continuously
  const slidingBrands = [...source, ...source];

  return (
    <section className="bg-[#f3f3f3]" style={{ paddingTop: 50, paddingBottom: 56 }}>
      <Container>
        <h2 className="mb-4 text-[15px] font-black uppercase leading-none text-[#252525]">BRANDS</h2>

        <div className="overflow-hidden pb-1" style={{ height: 151, marginTop: 15 }}>
          <div className="flex w-max gap-3 animate-marquee hover:[animation-play-state:paused]">
            {slidingBrands.map((brand, index) => (
              <a
                key={`${brand.Id}-${index}`}
                href={brand.linkUrl || "#"}
                target={brand.linkUrl ? "_blank" : "_self"}
                rel="noreferrer"
                onClick={brand.linkUrl ? undefined : (e) => e.preventDefault()}
                className="flex h-[118px] w-[160px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm sm:w-[190px] md:h-[150px] xl:w-[198px]"
                aria-label={brand.name}
              >
                <div className="relative h-full w-full">
                  <Image
                    src={brand.file}
                    alt={brand.name}
                    fill
                    className="object-contain opacity-80 transition-opacity hover:opacity-100"
                    style={{ padding: 26 }}
                  />
                </div>
              </a>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

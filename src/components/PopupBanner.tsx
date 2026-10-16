"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { BannerItem } from "@/services/bannerService";

interface Props {
  banners?: BannerItem[];
}

export default function PopupBanner({ banners = [] }: Props) {
  const [open, setOpen] = useState(false);
  const banner = banners[0];

  useEffect(() => {
    if (!banner) return;
    const seenKey = `kafela_popup_banner_${banner.Id}`;
    if (sessionStorage.getItem(seenKey)) return;
    const timer = window.setTimeout(() => setOpen(true), 800);
    return () => window.clearTimeout(timer);
  }, [banner]);

  if (!banner || !open) return null;

  const close = () => {
    sessionStorage.setItem(`kafela_popup_banner_${banner.Id}`, "1");
    setOpen(false);
  };

  const image = (
    <Image
      src={banner.file}
      alt={banner.alt}
      width={720}
      height={420}
      className="block h-auto w-full rounded"

      priority
    />
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4">
      <div className="relative w-full max-w-[720px]">
        <button
          type="button"
          aria-label="Close popup"
          onClick={close}
          className="absolute -right-2 -top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl font-semibold text-gray-800 shadow"
        >
          ×
        </button>
        {banner.linkUrl ? (
          <a
            href={banner.linkUrl}
            target="_blank"
            rel="noreferrer"
            onClick={close}
          >
            {image}
          </a>
        ) : (
          image
        )}
      </div>
    </div>
  );
}

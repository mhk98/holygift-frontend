"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type SafeImageProps = Omit<ImageProps, "src" | "alt" | "onError"> & {
  /** Tried in order; a source that fails to load falls through to the next one. */
  sources: (string | null | undefined)[];
  alt?: string;
};

/**
 * Image that never shows a broken icon or alt text: e.g. variant image -> product main
 * image -> other gallery images, and finally a neutral empty box.
 */
export default function SafeImage({ sources, alt = "", ...rest }: SafeImageProps) {
  const list = [...new Set(sources.filter((src): src is string => Boolean(src) && src !== "/placeholder.jpg"))];
  const key = list.join("|");
  const [failed, setFailed] = useState<{ key: string; count: number }>({ key, count: 0 });
  const index = failed.key === key ? failed.count : 0;
  const src = list[index];

  if (!src) {
    const { fill, width, height, style, className } = rest;
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{
          display: "block",
          background: "#f3f4f6",
          ...(fill ? { position: "absolute", inset: 0 } : { width, height }),
          ...(style?.borderRadius !== undefined ? { borderRadius: style.borderRadius } : {}),
        }}
      />
    );
  }

  return (
    <Image
      {...rest}
      key={src}
      src={src}
      alt={alt}
      onError={() => setFailed({ key, count: index + 1 })}
    />
  );
}

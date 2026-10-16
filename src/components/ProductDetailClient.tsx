// "use client";
// import { useState } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { Product } from "@/data/products";
// import { useCart } from "@/context/CartContext";

// const PRIMARY   = "#111111";
// const SECONDARY = "#404040";
// const fmt = (v: number) => v.toLocaleString("en-US");

// interface Props {
//   product: Product;
//   whatsappUrl: string | null;
//   phone: string | null;
// }

// export default function ProductDetailClient({ product, whatsappUrl, phone }: Props) {
//   const router = useRouter();
//   const { addToCart } = useCart();

//   const allImages = [product.image, ...(product.gallery || [])].filter(Boolean);
//   const [activeIdx, setActiveIdx] = useState(0);
//   const [thumbStart, setThumbStart] = useState(0);

//   const [selectedColor, setSelectedColor] = useState(product.colors?.[0] ?? "");
//   const [selectedSize, setSelectedSize]   = useState(product.sizes?.[0] ?? "");
//   const [qty, setQty] = useState(1);
//   const [addedMsg, setAddedMsg] = useState(false);

//   const THUMB_VISIBLE = 4;
//   const canPrev = thumbStart > 0;
//   const canNext = thumbStart + THUMB_VISIBLE < allImages.length;
//   const prevThumb = () => setThumbStart((s) => Math.max(0, s - 1));
//   const nextThumb = () => setThumbStart((s) => Math.min(allImages.length - THUMB_VISIBLE, s + 1));

//   const handleAddToCart = () => {
//     addToCart(product, qty, selectedSize || undefined, selectedColor || undefined);
//     setAddedMsg(true);
//     setTimeout(() => setAddedMsg(false), 1500);
//   };

//   const handleOrderNow = () => {
//     addToCart(product, qty, selectedSize || undefined, selectedColor || undefined);
//     router.push("/checkout");
//   };

//   const waPhone = phone ? phone.replace(/\D/g, "").replace(/^0/, "880") : null;
//   const waHref  = whatsappUrl || (waPhone ? `https://wa.me/${waPhone}` : null);
//   const displayPhone = phone || "";

//   return (
//     <div className="product-detail-grid">

//       {/* Left: Image Gallery */}
//       <div className="product-gallery">

//         {/* Main image */}
//         <div className="product-main-image">
//           {product.discount > 0 && (
//             <span
//               className="absolute top-2 left-2 z-10 text-white text-sm font-bold px-3 py-1 rounded-full"
//               style={{ background: SECONDARY }}
//             >
//               {product.discount}% Discount
//             </span>
//           )}
//           <Image
//             src={allImages[activeIdx] || "/placeholder.jpg"}
//             alt={product.name}
//             fill
//             className="object-contain"
//
//           />
//         </div>

//         {/* Thumbnails */}
//         {allImages.length > 1 && (
//           <div className="flex items-center gap-2 mt-3">
//             {canPrev && (
//               <button
//                 onClick={prevThumb}
//                 className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100 flex-shrink-0"
//               >
//                 ‹
//               </button>
//             )}
//             <div className="flex gap-2 flex-1 overflow-hidden">
//               {allImages.slice(thumbStart, thumbStart + THUMB_VISIBLE).map((img, i) => {
//                 const realIdx = thumbStart + i;
//                 return (
//                   <button
//                     key={realIdx}
//                     onClick={() => setActiveIdx(realIdx)}
//                     className="product-thumb"
//                     style={{
//                       borderColor: activeIdx === realIdx ? PRIMARY : "#e5e7eb",
//                     }}
//                   >
//                     <Image src={img} alt="" fill className="object-contain" />
//                   </button>
//                 );
//               })}
//             </div>
//             {canNext && (
//               <button
//                 onClick={nextThumb}
//                 className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100 flex-shrink-0"
//               >
//                 ›
//               </button>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Right: Product Info */}
//       <div className="product-info">

//         <nav className="text-base text-gray-500 mb-5 flex items-center flex-wrap gap-1">
//           <Link href="/" className="hover:text-[#404040] transition">Home</Link>
//           {product.category && (
//             <>
//               <span>/</span>
//               <Link
//                 href={`/?menu=${encodeURIComponent(product.category)}`}
//                 className="hover:text-[#404040] transition capitalize"
//               >
//                 {product.category}
//               </Link>
//             </>
//           )}
//           {product.subCategory && (
//             <>
//               <span>/</span>
//               <Link
//                 href={`/?menu=${encodeURIComponent(product.category ?? "")}&sub=${encodeURIComponent(product.subCategory)}`}
//                 className="hover:text-[#404040] transition capitalize"
//               >
//                 {product.subCategory}
//               </Link>
//             </>
//           )}
//         </nav>

//         {/* Name */}
//         <h1 className="text-xl lg:text-[23px] font-bold text-black mb-4 leading-snug">
//           {product.name}
//         </h1>

//         {/* Price */}
//         <div className="flex items-baseline gap-1 mb-3">
//           {product.discount > 0 && (
//             <span className="text-gray-400 line-through text-xl font-bold">৳ {fmt(product.originalPrice)}</span>
//           )}
//           <span className="font-extrabold text-[26px] text-black">
//             ৳ {fmt(product.discountedPrice)}
//           </span>
//         </div>

//         {/* SKU */}
//         {product.sku && (
//           <div className="mb-5">
//             <span
//               className="inline-flex items-center text-white text-sm font-bold px-3 py-[7px]"
//               style={{
//                 background: "#fb7d3a",
//                 clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)",
//                 paddingRight: 24,
//               }}
//             >
//               SKU : {product.sku}
//             </span>
//           </div>
//         )}

//         {/* Features */}
//         {product.features && product.features.length > 0 && (
//           <ul className="mb-4 space-y-1">
//             {product.features.map((f, i) => (
//               <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
//                 <span className="font-bold flex-shrink-0" style={{ color: PRIMARY }}>✓</span>
//                 {f}
//               </li>
//             ))}
//           </ul>
//         )}

//         {/* Color selector */}
//         {product.colors && product.colors.length > 0 && (
//           <div className="mb-5">
//             <p className="text-sm font-bold text-black mb-2">Select Color</p>
//             <div className="flex flex-wrap gap-2">
//               {product.colors.map((c) => (
//                 <button
//                   key={c}
//                   onClick={() => setSelectedColor(c)}
//                   className="h-[47px] px-3 border text-sm font-bold transition bg-white"
//                   style={{
//                     borderColor: selectedColor === c ? PRIMARY : "#d1d5db",
//                     color: selectedColor === c ? PRIMARY : "#111",
//                   }}
//                 >
//                   {c}
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Size selector */}
//         {product.sizes && product.sizes.length > 0 && (
//           <div className="mb-5">
//             <p className="text-sm font-bold text-black mb-2">Select Size</p>
//             <div className="flex flex-wrap gap-2">
//               {product.sizes.map((s) => (
//                 <button
//                   key={s}
//                   onClick={() => setSelectedSize(s)}
//                   className="min-w-12 h-[47px] px-2 border text-sm font-bold transition bg-white"
//                   style={{
//                     borderColor: selectedSize === s ? PRIMARY : "#d1d5db",
//                     color: selectedSize === s ? PRIMARY : "#111",
//                   }}
//                 >
//                   {s}
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Quantity */}
//         <div className="inline-flex items-center mb-2 border border-gray-300 rounded overflow-hidden">
//           <button
//             onClick={() => setQty((q) => Math.max(1, q - 1))}
//             className="w-10 h-10 text-gray-700 hover:bg-gray-50 text-xl font-bold transition flex items-center justify-center"
//           >
//             -
//           </button>
//           <span className="w-12 h-10 border-x border-gray-300 flex items-center justify-center text-base font-medium text-black">{qty}</span>
//           <button
//             onClick={() => setQty((q) => q + 1)}
//             className="w-10 h-10 text-gray-700 hover:bg-gray-50 text-2xl font-medium transition flex items-center justify-center"
//           >
//             +
//           </button>
//         </div>

//         {/* Add to Cart + Order Now */}
//         <div className="product-action-row">
//           <button
//             onClick={handleAddToCart}
//             disabled={product.inStock === false}
//             className="flex-1 h-[45px] font-bold text-white rounded-[5px] transition disabled:opacity-50 text-lg"
//             style={{ background: addedMsg ? "#16a34a" : PRIMARY }}
//           >
//             {addedMsg ? "Added to Cart!" : "Add To Cart"}
//           </button>
//           <button
//             onClick={handleOrderNow}
//             disabled={product.inStock === false}
//             className="flex-1 h-[45px] font-bold text-white rounded-[5px] transition disabled:opacity-50 text-lg"
//             style={{ background: SECONDARY }}
//           >
//             Order Now
//           </button>
//         </div>

//         {/* WhatsApp */}
//         {waHref && (
//           <a
//             href={waHref}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="product-whatsapp-link"
//             style={{ background: "#12c64b" }}
//           >
//             <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
//               <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
//             </svg>
//             {displayPhone || "Chat on WhatsApp"}
//           </a>
//         )}

//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useCustomer } from "@/context/CustomerContext";
import { useVariantSelection } from "@/lib/useVariantSelection";
import VariantSelector from "@/components/VariantSelector";
import { trackPixelEvent } from "@/lib/pixel";
import {
  fetchProductReviews,
  type ProductReview,
} from "@/services/productService";

const PRIMARY = "#111111";
const SECONDARY = "#404040";
const ACCENT = "#D7262E";

const fmt = (v: number) => v.toLocaleString("en-US");

interface Props {
  product: Product;
  whatsappUrl: string | null;
  phone: string | null;
}

export default function ProductDetailClient({
  product,
  whatsappUrl,
  phone,
}: Props) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { customer } = useCustomer();

  const allImages = [...new Set([product.image, ...(product.gallery || [])].filter(Boolean))];

  const [activeIdx, setActiveIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedMsg, setAddedMsg] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);

  const selection = useVariantSelection(product);
  // Show the selected variant's image whenever the variant changes.
  const variantImage = selection.selectedVariant?.image || null;
  const [shownVariantImage, setShownVariantImage] = useState<string | null>(null);
  if (variantImage !== shownVariantImage) {
    setShownVariantImage(variantImage);
    const idx = variantImage ? allImages.indexOf(variantImage) : -1;
    if (idx >= 0) setActiveIdx(idx);
  }
  const selectedOldPrice = selection.oldPrice;
  const selectedNewPrice = selection.newPrice;
  const canBuy = selection.inStock && !selection.needsSelection;
  const selectedDiscount =
    selectedOldPrice > selectedNewPrice && selectedNewPrice > 0
      ? Math.round(((selectedOldPrice - selectedNewPrice) / selectedOldPrice) * 100)
      : 0;

  useEffect(() => {
    let active = true;
    fetchProductReviews(product).then((items) => {
      if (active) setReviews(items);
    });
    return () => {
      active = false;
    };
  }, [product.id, product.name]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
    return total / reviews.length;
  }, [reviews]);

  const pixelUserData = useMemo(
    () => customer
      ? { customerId: customer.Id, name: customer.name, phone: customer.phone }
      : undefined,
    [customer?.Id, customer?.name, customer?.phone],
  );

  useEffect(() => {
    trackPixelEvent(
      "ViewContent",
      {
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        value: selectedNewPrice,
        currency: "BDT",
        num_items: 1,
      },
      pixelUserData,
    );
  }, [pixelUserData, product.id, product.name, selectedNewPrice]);

  const handleAddToCart = () => {
    if (!canBuy) return;
    addToCart(product, qty, selection.selectedVariant);
    trackPixelEvent(
      "AddToCart",
      {
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        value: selectedNewPrice * qty,
        currency: "BDT",
        num_items: qty,
      },
      pixelUserData,
    );
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 1500);
  };

  const handleOrderNow = () => {
    if (!canBuy) return;
    addToCart(product, qty, selection.selectedVariant);
    router.push("/checkout");
  };

  const waPhone = phone ? phone.replace(/\D/g, "").replace(/^0/, "880") : null;
  const waHref = whatsappUrl || (waPhone ? `https://wa.me/${waPhone}` : null);
  const displayPhone = phone || "";

  return (
    <div>
      <div className="product-detail-grid">
      {/* Left Image Gallery */}
      <div className="product-gallery">
        <div className="product-main-image">
          {selectedDiscount > 0 && (
            <span
              className="absolute left-2 top-2 z-10 rounded-full text-sm font-bold text-white"
              style={{ background: ACCENT, padding: "5px 13px" }}
            >
              {selectedDiscount}% Discount
            </span>
          )}

          <SafeImage
            sources={[allImages[activeIdx], ...allImages]}
            alt={product.name}
            fill
            className="object-contain p-4"
          />
        </div>

        {allImages.length > 1 && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className="product-thumb bg-white"
                style={{
                  borderColor: activeIdx === idx ? PRIMARY : "#e5e7eb",
                }}
              >
                <SafeImage
                  sources={[img]}
                  alt=""
                  fill
                  className="object-contain p-2"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="product-info">
        <nav
          style={{ marginBottom: "1rem" }}
          className="mb-4 flex flex-wrap items-center gap-1 text-base text-gray-500"
        >
          <Link href="/" className="transition hover:text-[#404040]">
            Home
          </Link>

          {product.category && (
            <>
              <span>/</span>
              <Link
                href={`/?menu=${encodeURIComponent(product.category)}`}
                className="capitalize transition hover:text-[#404040]"
              >
                {product.category}
              </Link>
            </>
          )}

          {product.subCategory && (
            <>
              <span>/</span>
              <Link
                href={`/?menu=${encodeURIComponent(
                  product.category ?? "",
                )}&sub=${encodeURIComponent(product.subCategory)}`}
                className="capitalize transition hover:text-[#404040]"
              >
                {product.subCategory}
              </Link>
            </>
          )}
        </nav>

        <h1
          style={{ marginBottom: "1rem" }}
          className="mb-4 text-xl font-bold leading-snug text-black lg:text-[23px]"
        >
          {product.name}
        </h1>

        <div
          style={{ marginBottom: "1rem" }}
          className="mb-3 flex items-baseline gap-1.5"
        >
          {selectedOldPrice > selectedNewPrice && (
            <span className="text-xl font-bold text-gray-400 line-through">
              ৳ {fmt(selectedOldPrice)}
            </span>
          )}

          <span className="text-[26px] font-extrabold text-black">
            ৳ {fmt(selectedNewPrice)}
          </span>
        </div>

        {product.sku && (
          <div style={{ marginBottom: "1rem" }} className="mb-4">
            <span
              className="inline-flex items-center px-3 py-[7px] text-sm font-bold text-white"
              style={{
                background: "#fb7d3a",
                clipPath:
                  "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)",
                padding: "6px 24px 6px 10px",
              }}
            >
              SKU : {product.sku}
            </span>
          </div>
        )}

        {selection.optionGroups.length > 0 && (
          <div style={{ marginBottom: "1rem" }} className="mb-4">
            <VariantSelector selection={selection} />
            {!selection.needsSelection && !selection.inStock && (
              <p className="mt-2 text-sm font-semibold text-red-600">এই variant-টি এখন stock-এ নেই</p>
            )}
            {selection.needsSelection && (
              <p className="mt-2 text-sm font-semibold text-red-600">এই combination পাওয়া যাচ্ছে না</p>
            )}
          </div>
        )}

        <div className="mb-3 inline-flex items-center overflow-hidden rounded border border-gray-300">
          <button
            style={{ cursor: "pointer" }}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center text-xl font-bold text-gray-700 transition hover:bg-gray-50"
          >
            -
          </button>

          <span className="flex h-10 w-12 items-center justify-center border-x border-gray-300 text-base font-medium text-black">
            {qty}
          </span>

          <button
            style={{ cursor: "pointer" }}
            onClick={() => setQty((q) => q + 1)}
            className="flex h-10 w-10 items-center justify-center text-2xl font-medium text-gray-700 transition hover:bg-gray-50"
          >
            +
          </button>
        </div>

        <div className="product-action-row">
          <button
            onClick={handleAddToCart}
            disabled={!canBuy}
            className="h-[45px] flex-1 rounded-[5px] text-lg font-bold text-white transition disabled:opacity-50"
            style={{
              cursor: "pointer",
              background: addedMsg ? "#16a34a" : PRIMARY,
            }}
          >
            {addedMsg ? "Added to Cart!" : "Add To Cart"}
          </button>

          <button
            onClick={handleOrderNow}
            disabled={!canBuy}
            className="h-[45px] flex-1 rounded-[5px] text-lg font-bold text-white transition disabled:opacity-50"
            style={{ cursor: "pointer", background: SECONDARY }}
          >
            Order Now
          </button>
        </div>

        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="product-whatsapp-link"
            style={{ cursor: "pointer", background: "#12c64b" }}
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>

            {displayPhone || "Chat on WhatsApp"}
          </a>
        )}
      </div>
    </div>
      {product.description && (
        <section
          style={{
            marginTop: 24,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "24px 26px",
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#111827",
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: `2px solid ${SECONDARY}`,
            }}
          >
            Product Description
          </h2>
          <div
            className="product-description-content"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
          <style jsx>{`
            .product-description-content {
              color: #374151;
              font-size: 15px;
              line-height: 1.85;
              word-break: break-word;
            }
            .product-description-content :global(p) {
              margin: 0 0 14px;
            }
            .product-description-content :global(p:last-child) {
              margin-bottom: 0;
            }
            .product-description-content :global(h1),
            .product-description-content :global(h2),
            .product-description-content :global(h3),
            .product-description-content :global(h4) {
              color: #0f172a;
              font-weight: 800;
              line-height: 1.4;
              margin: 22px 0 10px;
            }
            .product-description-content :global(h1) {
              font-size: 20px;
            }
            .product-description-content :global(h2) {
              font-size: 18px;
            }
            .product-description-content :global(h3) {
              font-size: 16px;
            }
            .product-description-content :global(strong),
            .product-description-content :global(b) {
              color: #111827;
              font-weight: 700;
            }
            .product-description-content :global(ul),
            .product-description-content :global(ol) {
              margin: 0 0 16px;
              padding-left: 22px;
              display: flex;
              flex-direction: column;
              gap: 6px;
            }
            .product-description-content :global(li) {
              padding-left: 2px;
            }
            .product-description-content :global(ul li) {
              list-style: disc;
            }
            .product-description-content :global(hr) {
              border: none;
              border-top: 1px solid #e5e7eb;
              margin: 20px 0;
            }
            .product-description-content :global(a) {
              color: ${SECONDARY};
              text-decoration: underline;
            }
            .product-description-content :global(img) {
              max-width: 100%;
              border-radius: 6px;
              margin: 10px 0;
            }
            .product-description-content :global(blockquote) {
              margin: 14px 0;
              padding: 10px 16px;
              border-left: 3px solid ${SECONDARY};
              background: #faf7f0;
              color: #4b5563;
            }
          `}</style>
        </section>
      )}
      {reviews.length > 0 && (
        <ProductReviews reviews={reviews} averageRating={averageRating} />
      )}
    </div>
  );
}

function ProductReviews({
  reviews,
  averageRating,
}: {
  reviews: ProductReview[];
  averageRating: number;
}) {
  return (
    <section
      style={{
        marginTop: 24,
        background: "#fff",
        border: "1px solid #e5e7eb",
        padding: 22,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>
            Customer Reviews
          </h2>
          <p style={{ marginTop: 4, fontSize: 13, color: "#6b7280" }}>
            {reviews.length} approved review{reviews.length > 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>
            {averageRating.toFixed(1)}
          </div>
          <StarRating rating={Math.round(averageRating)} />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        {reviews.map((review) => (
          <article
            key={review.Id}
            style={{
              border: "1px solid #eef2f7",
              background: "#f9fafb",
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>
                  {review.customerName || "Customer"}
                </h3>
                {review.productName && (
                  <p style={{ marginTop: 2, fontSize: 12, color: "#6b7280" }}>
                    {review.productName}
                  </p>
                )}
              </div>
              <StarRating rating={Number(review.rating) || 0} />
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#374151" }}>
              {review.comment || "ভালো প্রোডাক্ট, সার্ভিসও ভালো লেগেছে।"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StarRating({ rating }: { rating: number }) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div style={{ display: "inline-flex", gap: 2, color: "#facc15" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={star <= safeRating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="m12 17.27 5.18 3.13-1.64-5.89 4.57-3.95-6.01-.24L12 4.7 9.9 10.32l-6.01.24 4.57 3.95-1.64 5.89L12 17.27Z" />
        </svg>
      ))}
    </div>
  );
}

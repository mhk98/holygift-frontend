"use client";
import { useState } from "react";
import SafeImage from "@/components/SafeImage";
import { useRouter } from "next/navigation";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useVariantSelection } from "@/lib/useVariantSelection";
import VariantSelector from "@/components/VariantSelector";

interface OrderModalProps {
  product: Product;
  onClose: () => void;
}

const formatPrice = (v: number) => v.toLocaleString("en-US");

export default function OrderModal({ product, onClose }: OrderModalProps) {
  const selection = useVariantSelection(product);
  const canBuy = selection.inStock && !selection.needsSelection;
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  const router = useRouter();

  const handleOrder = () => {
    if (!canBuy) return;
    addToCart(product, qty, selection.selectedVariant);
    onClose();
    router.push("/checkout");
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[680px] mx-3 sm:mx-0">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-20 flex items-center justify-center text-white font-bold"
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "#D7262E", fontSize: 20, lineHeight: 1,
            boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
          }}
        >
          ×
        </button>

        {/* Header */}
        <div
          className="flex items-center"
          style={{
            background: "#111111", borderRadius: "8px 8px 0 0",
            height: 58, paddingLeft: 28, paddingRight: 28,
          }}
        >
          <span className="text-white font-semibold text-lg tracking-wide">
            Select Variation
          </span>
        </div>

        {/* Body */}
        <div className="bg-white" style={{ borderRadius: "0 0 8px 8px", padding: "clamp(16px, 4vw, 28px)" }}>
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-7">

            {/* Product image */}
            <div className="relative shrink-0 self-start border border-gray-200 overflow-hidden rounded"
              style={{ width: "clamp(110px, 35vw, 200px)", height: "clamp(110px, 35vw, 200px)" }}
            >
              <SafeImage
                sources={[selection.selectedVariant?.image, product.image, ...(product.gallery || [])]}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Right side */}
            <div className="flex flex-col gap-4 sm:gap-5 flex-1">

              {/* Price */}
              <div className="flex items-baseline gap-3">
                {selection.oldPrice > selection.newPrice && (
                  <span className="text-gray-400 line-through text-base">
                    ৳{formatPrice(selection.oldPrice)}
                  </span>
                )}
                <span className="font-extrabold text-3xl text-gray-900">
                  ৳{formatPrice(selection.newPrice)}
                </span>
              </div>

              <VariantSelector selection={selection} />
              {!canBuy && (
                <p className="text-sm font-semibold text-red-600">
                  {selection.needsSelection ? "এই combination পাওয়া যাচ্ছে না" : "এই variant-টি এখন stock-এ নেই"}
                </p>
              )}

              {/* Quantity + Order Now */}
              <div className="flex items-center gap-4 mt-1">
                {/* Qty control */}
                <div
                  className="flex items-center"
                  style={{ border: "1.5px solid #ccc", borderRadius: 4, overflow: "hidden" }}
                >
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold text-xl"
                    style={{ width: 42, height: 42 }}
                  >−</button>
                  <span
                    className="text-center font-bold text-base select-none"
                    style={{ width: 42, borderLeft: "1px solid #ccc", borderRight: "1px solid #ccc", lineHeight: "42px" }}
                  >
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold text-xl"
                    style={{ width: 42, height: 42 }}
                  >+</button>
                </div>

                {/* Order Now button */}
                <button
                  onClick={handleOrder}
                  disabled={!canBuy}
                  className="flex-1 text-white font-bold tracking-wide transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: "#111111", borderRadius: 4, height: 42, fontSize: 15 }}
                >
                  + ORDER NOW
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useMemo, useState } from "react";
import type { Product, ProductVariant } from "@/data/products";

export type OptionValueState = "available" | "soldout" | "unavailable";

export function variantLabel(options: Record<string, string> | undefined) {
  return Object.entries(options || {})
    .map(([name, value]) => `${name}: ${value}`)
    .join(", ");
}

const matches = (variant: ProductVariant, selected: Record<string, string>) =>
  Object.entries(selected).every(([name, value]) => variant.options[name] === value);

/**
 * Tracks the customer's option choices (e.g. Volume + Color) and resolves them to exactly
 * one variant. Starts on the first in-stock variant so price/stock are always meaningful.
 */
export function useVariantSelection(product: Product) {
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const optionGroups = useMemo(() => product.options ?? [], [product.options]);

  const defaultSelection = () => {
    const first = variants.find((v) => v.inStock && v.newPrice > 0) ?? variants[0];
    return first ? { ...first.options } : {};
  };
  // Keyed by product so client-side navigation to another product starts fresh.
  const [state, setState] = useState(() => ({ productId: product.id, selected: defaultSelection() }));
  const selected = state.productId === product.id ? state.selected : defaultSelection();
  const setSelected = (next: Record<string, string>) => setState({ productId: product.id, selected: next });

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!variants.length) return null;
    if (!optionGroups.length) return variants[0];
    if (optionGroups.some((group) => !selected[group.name])) return null;
    return variants.find((variant) => matches(variant, selected)) ?? null;
  }, [variants, optionGroups, selected]);

  const select = (name: string, value: string) => {
    const next = { ...selected, [name]: value };
    if (variants.some((variant) => matches(variant, next))) {
      setSelected(next);
      return;
    }
    // That combination doesn't exist: jump to the closest variant that has this value.
    const withValue = variants.filter((variant) => variant.options[name] === value);
    const fallback = withValue.find((variant) => variant.inStock) ?? withValue[0];
    setSelected(fallback ? { ...fallback.options } : next);
  };

  const valueState = (name: string, value: string): OptionValueState => {
    const others = Object.fromEntries(Object.entries(selected).filter(([key]) => key !== name));
    const candidates = variants.filter(
      (variant) => variant.options[name] === value && matches(variant, others),
    );
    if (!candidates.length) return "unavailable";
    return candidates.some((variant) => variant.inStock) ? "available" : "soldout";
  };

  const oldPrice = selectedVariant ? selectedVariant.oldPrice : product.originalPrice;
  const newPrice = selectedVariant ? selectedVariant.newPrice : product.discountedPrice;
  const inStock = variants.length
    ? Boolean(selectedVariant?.inStock)
    : product.inStock !== false;

  return {
    optionGroups,
    selected,
    select,
    valueState,
    selectedVariant,
    needsSelection: optionGroups.length > 0 && !selectedVariant,
    oldPrice,
    newPrice,
    inStock,
  };
}

export type VariantSelection = ReturnType<typeof useVariantSelection>;

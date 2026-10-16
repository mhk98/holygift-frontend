import { BASE } from "@/lib/api";

export interface ShippingCharge {
  Id: number;
  note: string | null;
  amount: string | number | null;
  date?: string | null;
}

// Also the minimum, matching the order API: lower configured charges are raised to these.
export const DEFAULT_DHAKA_CHARGE = 80;
export const DEFAULT_OUTSIDE_DHAKA_CHARGE = 130;

const toAmount = (value: ShippingCharge["amount"]): number | null => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

const hasInsideDhakaText = (note: string) =>
  /ঢাকার\s*ভিতরে|ঢাকা\s*ভিতরে|inside\s*dhaka|in\s*dhaka/i.test(note);

const hasOutsideDhakaText = (note: string) =>
  /ঢাকার\s*বাইরে|ঢাকা\s*বাইরে|outside\s*dhaka|out\s*of\s*dhaka/i.test(note);

export async function fetchDeliveryCharges(): Promise<ShippingCharge[]> {
  try {
    const res = await fetch(`${BASE}/charge-settings/public?chargeType=delivery`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

export function getDeliveryChargeForDistrict(
  charges: ShippingCharge[],
  district: string,
): number {
  if (!district) return 0;

  const isDhaka = district.toLowerCase() === "dhaka";
  const minimum = isDhaka ? DEFAULT_DHAKA_CHARGE : DEFAULT_OUTSIDE_DHAKA_CHARGE;
  const matcher = isDhaka ? hasInsideDhakaText : hasOutsideDhakaText;
  const matched = charges.find((charge) => matcher(String(charge.note || "")));
  const matchedAmount = matched ? toAmount(matched.amount) : null;
  if (matchedAmount !== null) return Math.max(matchedAmount, minimum);

  const fallback = charges[isDhaka ? 0 : 1];
  const fallbackAmount = fallback ? toAmount(fallback.amount) : null;
  if (fallbackAmount !== null) return Math.max(fallbackAmount, minimum);

  return minimum;
}

// Built from the charged amounts so the text never shows a rate below the minimum.
export function getDeliveryChargeLines(charges: ShippingCharge[]): string[] {
  const taka = (amount: number) => amount.toLocaleString("bn-BD");
  return [
    `ঢাকার ভিতরে ${taka(getDeliveryChargeForDistrict(charges, "dhaka"))} টাকা`,
    `ঢাকার বাইরে ${taka(getDeliveryChargeForDistrict(charges, "outside"))} টাকা`,
  ];
}

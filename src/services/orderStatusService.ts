import { BASE } from "@/lib/api";

export interface OrderStatusOption {
  Id?: number;
  key: string;
  label: string;
  name?: string;
  status?: string;
}

const DEFAULT_ORDER_STATUSES: OrderStatusOption[] = [
  { key: "pending", label: "Pending" },
  { key: "packaging", label: "Packaging" },
  { key: "confirmed", label: "Confirmed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "returned", label: "Returned" },
  { key: "on_hold", label: "On Hold" },
  { key: "in_courier", label: "In Courier" },
  { key: "delivered", label: "Delivered" },
  { key: "incomplete", label: "Incomplete" },
];

export function toOrderStatusKey(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeOrderStatuses(rows?: Partial<OrderStatusOption>[]): OrderStatusOption[] {
  const source = Array.isArray(rows) && rows.length ? rows : DEFAULT_ORDER_STATUSES;
  const seen = new Set<string>();
  return source
    .map((row) => {
      const label = row.label || row.name || row.key || "";
      const key = row.key || toOrderStatusKey(label);
      return { ...row, key, label } as OrderStatusOption;
    })
    .filter((row) => row.key && row.label && !seen.has(row.key) && seen.add(row.key));
}

export async function fetchPublicOrderStatuses(): Promise<OrderStatusOption[]> {
  try {
    const res = await fetch(`${BASE}/order-status/public`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return normalizeOrderStatuses();
    const json = await res.json();
    return normalizeOrderStatuses(json.data || []);
  } catch {
    return normalizeOrderStatuses();
  }
}

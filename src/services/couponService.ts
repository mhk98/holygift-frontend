import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface AppliedCoupon {
  Id: number;
  code: string;
  type: string;
  amount: number;
  buyAmount: number;
  discount: number;
  subtotal: number;
  totalAfterDiscount: number;
}

export async function validateCoupon(code: string, subtotal: number): Promise<AppliedCoupon> {
  const res = await apiFetch<ApiResponse<AppliedCoupon>>("/coupon-codes/validate", {
    method: "POST",
    body: JSON.stringify({ code, subtotal }),
  });
  return res.data;
}

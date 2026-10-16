import { apiFetch } from "@/lib/api";
import { ApiResponse, ApiOrder, CreateOrderPayload } from "@/types/api";

export async function saveIncompleteOrder(
  payload: CreateOrderPayload,
  signal?: AbortSignal,
): Promise<ApiOrder> {
  const res = await apiFetch<ApiResponse<ApiOrder>>("/orders/incomplete", {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
  return res.data;
}

export async function createOrder(payload: CreateOrderPayload): Promise<ApiOrder> {
  // Safe to retry: the backend returns the already-created order for a repeated checkoutKey.
  const res = await apiFetch<ApiResponse<ApiOrder>>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
    retries: payload.checkoutKey ? 2 : 0,
  });
  return res.data;
}

export async function sendReconfirmOtp(
  orderId: number | string,
  phone: string,
): Promise<{ alreadyConfirmed?: boolean; maskedPhone?: string; expiresAt?: string }> {
  const res = await apiFetch<ApiResponse<{ alreadyConfirmed?: boolean; maskedPhone?: string; expiresAt?: string }>>(
    `/orders/${encodeURIComponent(String(orderId))}/reconfirm/send-otp`,
    {
      method: "POST",
      body: JSON.stringify({ phone }),
    },
  );
  return res.data;
}

export async function verifyReconfirmOtp(
  orderId: number | string,
  phone: string,
  otp: string,
): Promise<ApiOrder> {
  const res = await apiFetch<ApiResponse<ApiOrder>>(
    `/orders/${encodeURIComponent(String(orderId))}/reconfirm/verify`,
    {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    },
  );
  return res.data;
}

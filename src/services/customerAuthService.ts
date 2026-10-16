import { apiFetch } from "@/lib/api";
import { ApiResponse } from "@/types/api";

export interface CustomerAuthUser {
  Id: number;
  FirstName?: string;
  LastName?: string;
  Email: string;
  Phone?: string;
  role?: string;
}

export interface CustomerAuthResult {
  accessToken: string;
  refreshToken: string;
  user: CustomerAuthUser;
}

const phoneToEmail = (phone: string) => `${phone}@customer.kafela.local`;

export async function loginCustomer(
  phone: string,
  password: string,
): Promise<CustomerAuthResult> {
  const res = await apiFetch<ApiResponse<CustomerAuthResult>>("/user/login", {
    method: "POST",
    body: JSON.stringify({
      Email: phoneToEmail(phone),
      Password: password,
    }),
  });

  return res.data;
}

export async function registerCustomer(
  fullName: string,
  phone: string,
  password: string,
): Promise<CustomerAuthUser> {
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts.shift() || fullName.trim();
  const lastName = nameParts.join(" ");

  const res = await apiFetch<ApiResponse<CustomerAuthUser>>("/user/register", {
    method: "POST",
    body: JSON.stringify({
      FirstName: firstName,
      LastName: lastName,
      Email: phoneToEmail(phone),
      Phone: phone,
      Password: password,
      role: "user",
    }),
  });

  return res.data;
}

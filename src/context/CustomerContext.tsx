"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

export interface CustomerInfo {
  Id: number;
  name: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  image?: string | null;
}

interface CustomerContextValue {
  customer: CustomerInfo | null;
  token: string | null;
  login: (token: string, customer: CustomerInfo) => void;
  logout: () => void;
  updateCustomer: (customer: CustomerInfo) => void;
  isLoggedIn: boolean;
  /** True once the saved session has been read from localStorage. */
  ready: boolean;
}

const CustomerContext = createContext<CustomerContextValue>({
  customer: null, token: null, login: () => {}, logout: () => {}, updateCustomer: () => {},
  isLoggedIn: false, ready: false,
});

const toInfo = (c: CustomerInfo): CustomerInfo => ({
  Id: c.Id, name: c.name, phone: c.phone,
  firstName: c.firstName, lastName: c.lastName, image: c.image ?? null,
});

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [token,    setToken]    = useState<string | null>(null);
  const [ready,    setReady]    = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem("customer_token");
      const c = localStorage.getItem("customer_info");
      if (t && c) { setToken(t); setCustomer(JSON.parse(c)); }
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  const login = useCallback((newToken: string, info: CustomerInfo) => {
    localStorage.setItem("customer_token", newToken);
    localStorage.setItem("customer_info", JSON.stringify(toInfo(info)));
    setToken(newToken);
    setCustomer(toInfo(info));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_info");
    setToken(null);
    setCustomer(null);
  }, []);

  const updateCustomer = useCallback((info: CustomerInfo) => {
    localStorage.setItem("customer_info", JSON.stringify(toInfo(info)));
    setCustomer(toInfo(info));
  }, []);

  // Refresh the stored name/photo from the server once per session, so sessions saved
  // before a profile change (or before photos existed) show the current details.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    apiFetch<{ data: CustomerInfo }>("/customer/profile", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((r) => { if (r.data) updateCustomer(r.data); })
      .catch(() => { /* the account page handles expired sessions */ });
    return () => controller.abort();
  }, [token, updateCustomer]);

  return (
    <CustomerContext.Provider value={{ customer, token, login, logout, updateCustomer, isLoggedIn: !!customer, ready }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() { return useContext(CustomerContext); }

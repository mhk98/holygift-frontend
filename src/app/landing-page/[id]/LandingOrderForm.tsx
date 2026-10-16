"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCheckoutSession } from "@/lib/useCheckoutSession";
import { createOrder, saveIncompleteOrder } from "@/services/orderService";
import { getPixelClickData, trackPixelEvent, type PixelUserData } from "@/lib/pixel";
import type { CreateOrderPayload } from "@/types/api";

export interface LandingOrderOption {
  id: string;
  productId: string | number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  freeShipping?: boolean;
}

interface SelectedProduct extends LandingOrderOption {
  qty: number;
}

interface LandingOrderFormProps {
  landingId: number;
  title: string;
  options: LandingOrderOption[];
  phone: string;
  deliveryInside: number;
  deliveryOutside: number;
  orderTitle: string;
  ctaText: string;
  orderForm?: Record<string, unknown>;
}

const formatMoney = (value: number) => value.toLocaleString("en-US");
const textValue = (
  source: Record<string, unknown> | undefined,
  key: string,
  fallback: string,
) => String(source?.[key] || fallback);

function imageSrc(value?: string) {
  const src = String(value || "").trim();
  if (!src) return "/placeholder.jpg";
  if (/^(https?:|data:|blob:)/i.test(src) || src.startsWith("/")) return src;
  return `/images/${src.replace(/^images\//, "")}`;
}

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("8801") && digits.length === 13)
    return `0${digits.slice(3)}`;
  if (digits.startsWith("01") && digits.length === 11) return digits;
  return "";
};

const LANDING_DEVICE_ID_KEY = "tokjhal_landing_device_id";

function getLandingDeviceId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(LANDING_DEVICE_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(LANDING_DEVICE_ID_KEY, generated);
  return generated;
}

export default function LandingOrderForm({
  landingId,
  title,
  options,
  phone,
  deliveryInside,
  deliveryOutside,
  orderTitle,
  ctaText,
  orderForm,
}: LandingOrderFormProps) {
  const [selected, setSelected] = useState<SelectedProduct[]>(() =>
    options[0] ? [{ ...options[0], qty: 1 }] : [],
  );
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
  });
  const [shipping, setShipping] = useState<"inside" | "outside">("inside");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [draftId, setDraftId] = useState<number | undefined>();
  const [deviceId, setDeviceId] = useState("");
  const checkout = useCheckoutSession();
  const router = useRouter();
  const addToCartTrackedRef = useRef(false);
  const beginCheckoutTrackedRef = useRef(false);
  const leadTrackedOrderIdRef = useRef<number | undefined>(undefined);

  // Matches the server: delivery is free only when every selected product ships free.
  const allFreeShipping =
    selected.length > 0 && selected.every((item) => item.freeShipping);
  const deliveryCharge = allFreeShipping
    ? 0
    : shipping === "inside"
      ? deliveryInside
      : deliveryOutside;
  const subtotal = useMemo(
    () => selected.reduce((sum, item) => sum + item.price * item.qty, 0),
    [selected],
  );
  const total = subtotal + deliveryCharge;
  const pixelData = useMemo(() => {
    const items = selected.length
      ? selected
      : options.slice(0, 1).map((item) => ({ ...item, qty: 1 }));
    return {
      content_ids: items.map((item) => item.productId || item.id),
      content_name: items.map((item) => item.name).join(", ") || title,
      content_type: "product",
      value:
        items.reduce((sum, item) => sum + item.price * item.qty, 0) ||
        subtotal ||
        0,
      currency: "BDT",
      num_items:
        items.reduce((sum, item) => sum + item.qty, 0) || items.length || 1,
    };
  }, [options, selected, subtotal, title]);

  const trackLandingEvent = (
    eventName: string,
    value = pixelData.value,
    orderId?: string | number,
    userData?: PixelUserData,
  ) => {
    trackPixelEvent(eventName, { ...pixelData, value, order_id: orderId }, userData);
  };

  const trackAddToCartOnce = () => {
    if (addToCartTrackedRef.current) return;
    addToCartTrackedRef.current = true;
    trackLandingEvent("AddToCart");
  };

  const trackBeginCheckoutOnce = () => {
    trackAddToCartOnce();
    if (beginCheckoutTrackedRef.current) return;
    beginCheckoutTrackedRef.current = true;
    trackLandingEvent("InitiateCheckout", total);
  };

  useEffect(() => {
    setDeviceId(getLandingDeviceId());
    trackLandingEvent("ViewContent");
  }, []);
  const labels = {
    productSelectTitle: textValue(
      orderForm,
      "productSelectTitle",
      "আপনার প্রোডাক্টটি সিলেক্ট করুন",
    ),
    billingTitle: textValue(orderForm, "billingTitle", "Billing details"),
    nameLabel: textValue(orderForm, "nameLabel", "আপনার নাম *"),
    phoneLabel: textValue(orderForm, "phoneLabel", "আপনার ফোন নাম্বার *"),
    addressLabel: textValue(orderForm, "addressLabel", "আপনার ঠিকানা *"),
    noteLabel: textValue(orderForm, "noteLabel", "Order Notes (optional)"),
    notePlaceholder: textValue(
      orderForm,
      "notePlaceholder",
      "অর্ডার এবং কলার সম্পর্কে কিছু বলার থাকলে এখানে লিখুন",
    ),
    summaryTitle: textValue(orderForm, "summaryTitle", "Your order"),
    insideDhakaLabel: textValue(orderForm, "insideDhakaLabel", "ঢাকার ভিতরে"),
    outsideDhakaLabel: textValue(orderForm, "outsideDhakaLabel", "ঢাকার বাইরে"),
    subtotalLabel: textValue(orderForm, "subtotalLabel", "Subtotal"),
    totalLabel: textValue(orderForm, "totalLabel", "Total"),
    codTitle: textValue(
      orderForm,
      "codTitle",
      "🎁 পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন ✅",
    ),
    codDescription: textValue(
      orderForm,
      "codDescription",
      "ডেলিভারি ম্যানের কাছে টাকা দিয়ে পার্সেল রিসিভ করে নিবেন। সাধারণত ১-২ দিন সময় লাগতে পারে।",
    ),
    requiredError: textValue(
      orderForm,
      "requiredError",
      "আপনার নাম, সঠিক ফোন নম্বর এবং ঠিকানা দিন।",
    ),
    productRequiredError: textValue(
      orderForm,
      "productRequiredError",
      "অর্ডারের জন্য অন্তত একটি প্রোডাক্ট সিলেক্ট করুন।",
    ),
    successMessage: textValue(
      orderForm,
      "successMessage",
      "আপনার অর্ডারটি নেওয়া হয়েছে।",
    ),
  };

  function toggleOption(option: LandingOrderOption) {
    trackAddToCartOnce();
    setSelected((current) => {
      if (current.some((item) => item.id === option.id)) {
        const next = current.filter((item) => item.id !== option.id);
        return next.length ? next : current;
      }
      return [...current, { ...option, qty: 1 }];
    });
  }

  function changeQty(id: string, delta: number) {
    trackAddToCartOnce();
    setSelected((current) =>
      current.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item,
      ),
    );
  }

  async function saveDraft(nextCustomer = customer) {
    const normalizedPhone = normalizePhone(nextCustomer.phone);
    if (!normalizedPhone || checkout.submitting.current) return;
    try {
      const draft = await saveIncompleteOrder(
        buildPayload("incomplete", normalizedPhone, nextCustomer),
      );
      setDraftId(draft.Id);
      if (draft.Id && leadTrackedOrderIdRef.current !== draft.Id) {
        leadTrackedOrderIdRef.current = draft.Id;
        trackLandingEvent("Lead", total, undefined, {
          name: nextCustomer.name.trim(),
          phone: normalizedPhone,
        });
      }
    } catch {
      // Draft capture is best-effort; final order still shows the user-facing error.
    }
  }

  useEffect(() => {
    const normalizedPhone = normalizePhone(customer.phone);
    if (!normalizedPhone || success) return undefined;

    const timer = window.setTimeout(() => {
      void saveDraft(customer);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [
    customer.name,
    customer.phone,
    customer.address,
    customer.note,
    shipping,
    selected,
    success,
  ]);

  function buildPayload(
    status: "pending" | "incomplete",
    normalizedPhone: string,
    customerData = customer,
  ): CreateOrderPayload {
    return {
      checkoutKey: checkout.getKey(normalizedPhone),
      ...(draftId ? { incompleteOrderId: draftId } : {}),
      deviceId,
      source: "Landing Page",
      orderSource: "Landing Page",
      customerName: customerData.name.trim() || "Landing Customer",
      customerPhone: normalizedPhone,
      customerAddress: customerData.address.trim(),
      customerDistrict: shipping,
      paymentMethod: "cod",
      items: selected.map((item) => ({
        id: Number(item.productId || landingId) || landingId,
        name: item.name,
        image: item.image,
        price: item.price,
        qty: item.qty,
      })),
      subtotal,
      deliveryCharge,
      discount: 0,
      couponCode: null,
      advance: 0,
      total,
      tracking: {
        ...getPixelClickData(),
        source: "Landing Page",
        landingPageId: landingId,
        landingPage: title,
        status,
        shipping,
        note: customerData.note.trim(),
      },
    };
  }

  async function placeOrder() {
    if (checkout.submitting.current) return;
    setError("");
    setSuccess("");
    const normalizedPhone = normalizePhone(customer.phone);
    if (!customer.name.trim() || !customer.address.trim() || !normalizedPhone) {
      setError(labels.requiredError);
      return;
    }
    if (!selected.length) {
      setError(labels.productRequiredError);
      return;
    }

    checkout.submitting.current = true;
    setSaving(true);
    trackBeginCheckoutOnce();
    const pixelUser = { name: customer.name.trim(), phone: normalizedPhone };
    trackLandingEvent("AddPaymentInfo", total, undefined, pixelUser);
    try {
      const order = await createOrder(buildPayload("pending", normalizedPhone));
      trackLandingEvent("Purchase", total, order.Id, pixelUser);
      // invoiceId is the display number (HD-xxxx); orderId is the raw stored value.
      const invoiceId = order.invoiceId || order.orderId || String(order.Id);
      // Same hand-off as the cart checkout, so /order-success and re-confirm work alike.
      window.localStorage.setItem(
        "kafela_pending_reconfirm_order",
        JSON.stringify({
          orderId: order.Id,
          invoiceId,
          phone: normalizedPhone,
          name: customer.name.trim(),
          total,
        }),
      );
      setSuccess(`${labels.successMessage} Order ID: ${invoiceId}`);
      setCustomer({ name: "", phone: "", address: "", note: "" });
      setDraftId(undefined);
      checkout.complete();
      router.push(`/order-success?invoiceId=${encodeURIComponent(invoiceId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order create failed.");
    } finally {
      checkout.submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <section
      id="order-now"
      className="bg-slate-100 px-4 py-20"
      onFocusCapture={trackBeginCheckoutOnce}
    >
      <div className="mx-auto max-w-5xl rounded-md border-2 border-[#05a925] bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-center text-3xl font-black leading-tight text-slate-800 md:text-4xl">
          {orderTitle}
        </h2>

        <div className="mt-8">
          <h3 className="mb-3 text-sm font-black text-[#38651f]">
            {labels.productSelectTitle}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {options.map((option) => {
              const item = selected.find((entry) => entry.id === option.id);
              return (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleOption(option)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleOption(option);
                    }
                  }}
                  key={option.id}
                  className={`grid grid-cols-[22px_64px_1fr] gap-3 rounded-md border p-3 text-left transition ${
                    item
                      ? "border-emerald-400 bg-emerald-50/30"
                      : "border-slate-200 bg-white hover:border-emerald-300"
                  }`}
                >
                  <span
                    className={`mt-5 h-4 w-4 rounded-full border ${
                      item
                        ? "border-emerald-600 bg-emerald-600"
                        : "border-slate-300"
                    }`}
                  />
                  <img
                    src={imageSrc(option.image)}
                    alt={option.name}
                    className="h-16 w-16 rounded object-cover"
                  />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-black text-slate-800">
                      {option.name}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {item ? (
                        <span className="inline-flex overflow-hidden rounded border border-gray-300 bg-white">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              changeQty(option.id, -1);
                            }}
                            className="px-3 py-1"
                          >
                            -
                          </button>
                          <span className="border-x border-gray-300 px-4 py-1">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              changeQty(option.id, 1);
                            }}
                            className="px-3 py-1"
                          >
                            +
                          </button>
                        </span>
                      ) : null}
                      {option.originalPrice > option.price ? (
                        <span className="text-sm text-gray-400 line-through">
                          {formatMoney(option.originalPrice)}৳
                        </span>
                      ) : null}
                      <span className="text-sm font-bold text-neutral-800">
                        {formatMoney(option.price)}৳
                      </span>
                      {option.freeShipping ? (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          ফ্রি ডেলিভারি
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h3 className="mb-4 text-base font-black text-red-600">
              আপনার নাম,মোবাইল নাম্বার এবং ঠিকানা লিখে সাবমিট করুন
            </h3>
            <LandingInput
              label={labels.nameLabel}
              value={customer.name}
              onChange={(name) => setCustomer((prev) => ({ ...prev, name }))}
            />
            <LandingInput
              label={labels.phoneLabel}
              value={customer.phone}
              onChange={(nextPhone) =>
                setCustomer((prev) => ({ ...prev, phone: nextPhone }))
              }
              inputMode="tel"
            />
            <LandingInput
              label={labels.addressLabel}
              value={customer.address}
              onChange={(address) =>
                setCustomer((prev) => ({ ...prev, address }))
              }
            />
            <label className="mt-4 block text-sm font-bold text-neutral-700">
              {labels.noteLabel}
              <textarea
                value={customer.note}
                onChange={(event) =>
                  setCustomer((prev) => ({ ...prev, note: event.target.value }))
                }
                placeholder={labels.notePlaceholder}
                className="mt-2 min-h-24 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
              />
            </label>

            <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded border border-slate-200">
              <button
                type="button"
                onClick={() => setShipping("inside")}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold"
              >
                <span>
                  <span
                    className={
                      shipping === "inside"
                        ? "text-emerald-600"
                        : "text-slate-300"
                    }
                  >
                    ●
                  </span>{" "}
                  {labels.insideDhakaLabel}{" "}
                  {allFreeShipping
                    ? "ফ্রি ডেলিভারি"
                    : `${formatMoney(deliveryInside)} টাকা`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShipping("outside")}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold"
              >
                <span>
                  <span
                    className={
                      shipping === "outside"
                        ? "text-emerald-600"
                        : "text-slate-300"
                    }
                  >
                    ●
                  </span>{" "}
                  {labels.outsideDhakaLabel}{" "}
                  {allFreeShipping
                    ? "ফ্রি ডেলিভারি"
                    : `${formatMoney(deliveryOutside)} টাকা`}
                </span>
              </button>
            </div>

            {error ? (
              <p className="mt-4 rounded bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="mt-4 rounded bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                {success}
              </p>
            ) : null}

            <button
              type="button"
              onClick={placeOrder}
              disabled={saving}
              className="mt-6 w-full rounded bg-[#14883b] px-5 py-4 text-lg font-black text-white transition hover:bg-[#0f7432] disabled:opacity-60"
            >
              🔒 {saving ? "Place Order..." : ctaText}
            </button>
          </div>

          <aside>
            <div className="overflow-hidden rounded border border-slate-200 bg-white">
              <div className="grid grid-cols-[1fr_92px_88px] bg-slate-100 px-3 py-4 text-base font-black text-slate-900">
                <span>Product</span>
                <span className="text-center">Amount</span>
                <span className="text-right">Price</span>
              </div>
              {selected.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_92px_88px] items-center gap-2 bg-slate-200/80 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={imageSrc(item.image)}
                      alt={item.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-bold">
                        {item.name}
                      </p>
                    </div>
                  </div>
                  <span className="mx-auto rounded border border-slate-600 px-3 py-1 text-sm font-black">
                    {item.qty} x
                  </span>
                  <strong className="text-right">
                    {formatMoney(item.price * item.qty)}৳
                  </strong>
                </div>
              ))}
              <SummaryRow label={labels.subtotalLabel} value={subtotal} />
              <SummaryRow
                label="Delivery Charge"
                value={deliveryCharge}
                text={allFreeShipping ? "ফ্রি" : undefined}
              />
              <SummaryRow label={labels.totalLabel} value={total} strong />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function LandingInput({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "tel";
}) {
  return (
    <label className="mb-4 block text-sm font-bold text-neutral-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={inputMode}
        className="mt-2 h-11 w-full rounded border border-gray-300 px-3 outline-none focus:border-orange-500"
      />
    </label>
  );
}

function SummaryRow({
  label,
  value,
  text,
  strong,
}: {
  label: string;
  value: number;
  text?: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 ${strong ? "text-lg font-black" : "text-sm font-bold"}`}
    >
      <span>{label}</span>
      <span>{text ?? `${formatMoney(value)}৳`}</span>
    </div>
  );
}

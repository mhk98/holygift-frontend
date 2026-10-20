"use client";

import type { SiteChromeSlots } from "@/components/SiteChrome";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MarqueeBanner from "@/components/MarqueeBanner";
import { BASE } from "@/lib/api";
import { scratchCardFontClass } from "./fonts";
import styles from "./ScratchCard.module.css";

const STEPS = [
  {
    title: "কার্ড ঘষুন",
    text: "স্ক্র্যাচ কার্ডের আবরণ আলতো করে ঘষে আপনার পুরস্কার দেখুন।",
    icon: (
      <>
        <path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7z" />
        <path d="M9.5 9.5h.01M14.5 14.5h.01M15 9l-6 6" />
      </>
    ),
  },
  {
    title: "ছবি তুলুন",
    text: "পুরস্কারসহ পুরো কার্ডের একটি পরিষ্কার ছবি তুলুন, যাতে লেখা পড়া যায়।",
    icon: (
      <>
        <path d="M4 8h3l2-3h6l2 3h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" />
        <circle cx="12" cy="13.5" r="3.5" />
      </>
    ),
  },
  {
    title: "ফর্ম জমা দিন",
    text: "আপনার অর্ডারকৃত ফোন নম্বর ও ঠিকানা দিয়ে ফর্মটি পূরণ করে জমা দিন।",
    icon: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  },
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHONE_PATTERN = /^01\d{9}$/;

type Field = "fullName" | "phone" | "address" | "image" | "prize";
type FieldErrors = Partial<Record<Field, string>>;

const TICKET_ICON = STEPS[0].icon;

// `value` is what is stored on the claim; the track page maps it back to Bangla.
// `tone` is the card's accent gradient [from, to].
const PRIZES: {
  value: string;
  label: string;
  tone: [string, string];
  icon: ReactNode;
}[] = [
  {
    value: "TV",
    label: "টিভি",
    tone: ["#2563eb", "#7c3aed"],
    icon: (
      <>
        <rect x="3" y="5" width="18" height="12" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
  },
  {
    value: "Fridge",
    label: "ফ্রিজ",
    tone: ["#0891b2", "#2563eb"],
    icon: (
      <>
        <rect x="6" y="2.5" width="12" height="19" rx="2" />
        <path d="M6 10h12M9 6v2M9 13v3" />
      </>
    ),
  },
  {
    value: "Rice Cooker",
    label: "রাইস কুকার",
    tone: ["#16a34a", "#0d9488"],
    icon: (
      <>
        <path d="M4 11h16v5a4 4 0 01-4 4H8a4 4 0 01-4-4v-5z" />
        <path d="M6 11a6 6 0 0112 0M10 5h4" />
      </>
    ),
  },
  {
    value: "Induction Chula",
    label: "ইন্ডাকশন চুলা",
    tone: ["#f97316", "#db2777"],
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="12" cy="11.5" r="3" />
        <path d="M8 16.5h8" />
      </>
    ),
  },
  {
    value: "Luxury Wall Watch",
    label: "লাক্সারি দেয়াল ঘড়ি",
    tone: ["#b8860b", "#e6c35c"],
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="6.5" />
        <path d="M12 3v1.5M21 12h-1.5M12 21v-1.5M3 12h1.5M12 8.5V12l2.5 1.5" />
      </>
    ),
  },
];

// Thrown for an HTTP error response, so the catch below can tell it apart from
// a request that never reached the server.
class SubmitError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Customer-facing message for a failed submission. Only a request that never
// got a response is blamed on the internet connection.
function submitErrorMessage(error: unknown): string {
  if (!(error instanceof SubmitError)) {
    return "সার্ভারের সাথে সংযোগ করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।";
  }
  if (error.status === 413 || /too large/i.test(error.message)) {
    return "ছবির সাইজ অনেক বড়। ৫ MB এর কম সাইজের ছবি দিন।";
  }
  if (error.status === 429) {
    return "অল্প সময়ে অনেকবার চেষ্টা করা হয়েছে। এক মিনিট পর আবার চেষ্টা করুন।";
  }
  if (error.status >= 500) {
    return "সার্ভারে সাময়িক সমস্যা হয়েছে, আপনার তথ্য জমা হয়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।";
  }
  return "তথ্য জমা দেওয়া যায়নি। সব ঘর ঠিকভাবে পূরণ করে আবার চেষ্টা করুন।";
}

function Icon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className={styles.fieldError} role="alert">
      {message}
    </p>
  );
}

interface ScratchCardClientProps extends Pick<SiteChromeSlots, "header"> {
  /** "additional" is the form for a further card from a phone that already claimed. */
  mode?: "first" | "additional";
  initialPhone?: string;
  /** Admin-managed banner rendered above the page content. */
  banner?: ReactNode;
}

export default function ScratchCardClient({
  header,
  mode = "first",
  initialPhone = "",
  banner,
}: ScratchCardClientProps) {
  const router = useRouter();
  const isAdditional = mode === "additional";
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [claimedPhone, setClaimedPhone] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [prize, setPrize] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  // "checking" = looking up the phone; "uploading" = sending the form and card image.
  const [phase, setPhase] = useState<"idle" | "checking" | "uploading">("idle");
  const submitting = phase !== "idle";
  const [referenceCode, setReferenceCode] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Free the last preview's object URL when it changes or the page unmounts.
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const clearError = (field: Field) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const selectImage = (file: File | null) => {
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const onImageChange = (file: File | undefined) => {
    if (!file) return;
    let message = "";
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type))
      message = "শুধু JPG, PNG বা WEBP ছবি আপলোড করুন";
    else if (file.size > MAX_IMAGE_BYTES)
      message = "ছবির সাইজ ৫ MB এর কম হতে হবে";
    if (message) {
      setErrors((prev) => ({ ...prev, image: message }));
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    clearError("image");
    selectImage(file);
  };

  const validatePhoneOnBlur = () => {
    const value = phone.trim();
    if (value && !PHONE_PATTERN.test(value)) {
      setErrors((prev) => ({
        ...prev,
        phone: "সঠিক ১১ ডিজিটের ফোন নম্বর দিন (01XXXXXXXXX)",
      }));
    }
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!fullName.trim()) next.fullName = "আপনার পুরো নাম লিখুন";
    if (!phone.trim()) next.phone = "অর্ডার করা ফোন নম্বর দিন";
    else if (!PHONE_PATTERN.test(phone.trim()))
      next.phone = "সঠিক ১১ ডিজিটের ফোন নম্বর দিন (01XXXXXXXXX)";
    if (!address.trim()) next.address = "ডেলিভারি ঠিকানা লিখুন";
    if (!image) next.image = "স্ক্র্যাচ কার্ডের ছবি আপলোড করুন";
    if (!prize.trim()) next.prize = "আপনার প্রাপ্ত পুরস্কারটি নির্বাচন করুন";
    return next;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    const nextErrors = validate();
    setErrors(nextErrors);
    const firstInvalid = (Object.keys(nextErrors) as Field[])[0];
    if (firstInvalid || !image) {
      document.getElementById(`sc-${firstInvalid}`)?.focus();
      return;
    }

    const normalizedPhone = phone.trim();
    try {
      // Check before uploading so a repeat claim doesn't upload its image for nothing.
      if (!isAdditional) {
        setPhase("checking");
        const check = await fetch(
          `${BASE}/scratch-cards/check?phone=${encodeURIComponent(normalizedPhone)}`,
        );
        const checkJson = await check.json().catch(() => null);
        if (!check.ok)
          throw new SubmitError(
            check.status,
            checkJson?.message || "check failed",
          );
        if (checkJson?.data?.claimed) {
          setClaimedPhone(normalizedPhone);
          return;
        }
      }

      setPhase("uploading");
      const body = new FormData();
      body.append("fullName", fullName.trim());
      body.append("phone", normalizedPhone);
      body.append("address", address.trim());
      body.append("prize", prize.trim());
      body.append("image", image);
      if (isAdditional) body.append("additional", "true");

      // Not apiFetch: it forces a JSON Content-Type, which breaks multipart uploads.
      const res = await fetch(`${BASE}/scratch-cards/submit`, {
        method: "POST",
        body,
      });
      const json = await res.json().catch(() => null);
      if (res.status === 409) {
        setClaimedPhone(normalizedPhone);
        return;
      }
      if (!res.ok)
        throw new SubmitError(
          res.status,
          json?.message || res.statusText || "submit failed",
        );
      // Random code (e.g. SC-7K4Q9P) support can look up in the admin panel.
      setReferenceCode(
        typeof json?.data?.referenceCode === "string"
          ? json.data.referenceCode
          : null,
      );
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      // Logged so the real cause (status and server message) is visible in the browser console.
      console.error("Scratch card submit failed", error);
      setFormError(submitErrorMessage(error));
    } finally {
      setPhase("idle");
    }
  };

  const goToAdditionalForm = () => {
    if (!claimedPhone) return;
    router.push(
      `/scratch-card/another?phone=${encodeURIComponent(claimedPhone)}`,
    );
  };

  const removeImage = () => {
    selectImage(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const reset = () => {
    setFullName("");
    setPhone(isAdditional ? initialPhone : "");
    setAddress("");
    setPrize("");
    selectImage(null);
    setErrors({});
    setFormError("");
    setReferenceCode(null);
    setSubmitted(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const inputClass = (field: Field, extra = "") =>
    `${styles.input} ${errors[field] ? styles.inputInvalid : ""} ${extra}`;

  return (
    <div className={styles.page}>
      <MarqueeBanner />
      {header}

      <main className={`${styles.main} ${scratchCardFontClass}`}>
        <div className={styles.container}>
          {!submitted && banner}

          {!submitted && (
            <header className={styles.pageHead}>
              <h1 className={styles.title}>
                {isAdditional
                  ? "আপনার বর্তমান স্ক্র্যাচ কার্ডের পুরস্কার পেতে নিচের ফর্মটি সঠিক তথ্য দিয়ে পুরণ করুন"
                  : "আপনার স্ক্র্যাচ কার্ডের পুরস্কার পেতে নিচের ফর্মটি সঠিক তথ্য দিয়ে পুরণ করুন"}
              </h1>
              <p className={styles.subtitle}>
                {isAdditional
                  ? "এই নম্বরে যেহেতু আগে একটি পুরস্কার নেওয়া হয়েছে। আরেকটি কার্ড থাকলে নিচের ফর্মটি পূরণ করুন, আমাদের টিম যাচাই করে যোগাযোগ করবে।"
                  : ""}
              </p>
            </header>
          )}

          <div className={submitted ? styles.layoutSuccess : styles.layout}>
            {!submitted && (
              <aside className={styles.guide} aria-labelledby="sc-guide-title">
                <h2 id="sc-guide-title" className={styles.guideTitle}>
                  নিচের ধাপগুলো অনুসরণ করুন
                </h2>
                <ol className={styles.steps}>
                  {STEPS.map((step, index) => (
                    <li key={step.title} className={styles.step}>
                      <span className={styles.stepIcon}>
                        <Icon>{step.icon}</Icon>
                      </span>
                      <div className={styles.stepBody}>
                        <span className={styles.stepNum}>
                          ধাপ {(index + 1).toLocaleString("bn-BD")}
                        </span>
                        <strong className={styles.stepTitle}>
                          {step.title}
                        </strong>
                        <p className={styles.stepText}>{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </aside>
            )}

            <section className={styles.card} aria-live="polite">
              {submitted ? (
                <div className={styles.success}>
                  <div className={styles.successIcon}>
                    <Icon size={28}>
                      <path d="M5 13l4 4L19 7" />
                    </Icon>
                  </div>
                  <h2 className={styles.successTitle}>
                    আপনার তথ্য সফলভাবে জমা হয়েছে!
                  </h2>
                  <p className={styles.successText}>
                    ধন্যবাদ! আপনার স্ক্র্যাচ কার্ডের তথ্য আমরা পেয়েছি। যাচাই
                    শেষ হলে পুরস্কার নিশ্চিত করা হবে।
                  </p>

                  <dl className={styles.successMeta}>
                    {referenceCode && (
                      <div>
                        <dt>রেফারেন্স নম্বর</dt>
                        <dd className={styles.reference}>{referenceCode}</dd>
                      </div>
                    )}
                    <div>
                      <dt>বর্তমান অবস্থা</dt>
                      <dd>
                        <span className={styles.statusPill}>যাচাই চলছে</span>
                      </dd>
                    </div>
                  </dl>

                  <div className={styles.nextSteps}>
                    <p className={styles.nextStepsTitle}>এরপর কী হবে</p>
                    <ol>
                      <li>আমাদের টিম আপনার কার্ডের ছবি ও তথ্য যাচাই করবে।</li>
                      <li>
                        যাচাই শেষে অর্ডারের ফোন নম্বরে আপনার সাথে যোগাযোগ করা
                        হবে।
                      </li>
                      <li>
                        যেকোনো সময় ফোন নম্বর দিয়ে কার্ডের অবস্থা ট্র্যাক করতে
                        পারবেন।
                      </li>
                    </ol>
                  </div>

                  <div className={styles.successActions}>
                    <Link href="/scratch-card/track" className={styles.submit}>
                      কার্ডের অবস্থা ট্র্যাক করুন
                    </Link>
                    <button
                      type="button"
                      onClick={reset}
                      className={styles.secondaryBtn}
                    >
                      আরেকটি কার্ড জমা দিন
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.cardHead}>
                    <h2 className={styles.cardTitle}>
                      {isAdditional
                        ? "আপনার বর্তমান স্ক্র্যাচ কার্ড ফর্ম"
                        : "পুরস্কার গ্রহণ ফর্ম"}
                    </h2>
                    <p className={styles.cardHint}>
                      ভুল তথ্য দিলে পুরস্কারটি বাতিল বলে গণ্য হবে। সঠিক তথ্য
                      দিয়ে ফর্মটি পূরণ করুন।
                    </p>
                  </div>

                  <form onSubmit={submit} className={styles.form} noValidate>
                    <fieldset
                      className={styles.formFields}
                      disabled={submitting}
                    >
                      <div className={styles.row}>
                        <div className={styles.field}>
                          <label htmlFor="sc-fullName" className={styles.label}>
                            পুরো নাম{" "}
                            <span
                              className={styles.required}
                              aria-hidden="true"
                            >
                              *
                            </span>
                          </label>
                          <input
                            id="sc-fullName"
                            type="text"
                            autoComplete="name"
                            value={fullName}
                            onChange={(e) => {
                              setFullName(e.target.value);
                              clearError("fullName");
                            }}
                            placeholder="আপনার পুরো নাম"
                            className={inputClass("fullName")}
                            maxLength={128}
                            aria-invalid={Boolean(errors.fullName)}
                            aria-describedby={
                              errors.fullName ? "sc-fullName-error" : undefined
                            }
                          />
                          <FieldError
                            id="sc-fullName-error"
                            message={errors.fullName}
                          />
                        </div>

                        <div className={styles.field}>
                          <label htmlFor="sc-phone" className={styles.label}>
                            আপনি যে নাম্বার থেকে অর্ডার করেছেন সে নাম্বারটি
                            লিখুন{"\u00a0"}
                            <span
                              className={styles.required}
                              aria-hidden="true"
                            >
                              *
                            </span>
                          </label>
                          <input
                            id="sc-phone"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            value={phone}
                            onChange={(e) => {
                              setPhone(
                                e.target.value.replace(/\D/g, "").slice(0, 11),
                              );
                              clearError("phone");
                            }}
                            onBlur={validatePhoneOnBlur}
                            placeholder="01XXXXXXXXX"
                            className={inputClass("phone", styles.inputLatin)}
                            aria-invalid={Boolean(errors.phone)}
                            aria-describedby={
                              errors.phone ? "sc-phone-error" : undefined
                            }
                          />
                          <FieldError
                            id="sc-phone-error"
                            message={errors.phone}
                          />
                        </div>
                      </div>

                      <div className={styles.field}>
                        <label htmlFor="sc-address" className={styles.label}>
                          ডেলিভারি ঠিকানা{" "}
                          <span className={styles.required} aria-hidden="true">
                            *
                          </span>
                        </label>
                        <textarea
                          id="sc-address"
                          autoComplete="street-address"
                          value={address}
                          onChange={(e) => {
                            setAddress(e.target.value);
                            clearError("address");
                          }}
                          placeholder="বাসা/রোড, এলাকা, থানা, জেলা"
                          rows={3}
                          className={inputClass("address", styles.textarea)}
                          aria-invalid={Boolean(errors.address)}
                          aria-describedby={
                            errors.address
                              ? "sc-address-error"
                              : "sc-address-help"
                          }
                        />
                        {errors.address ? (
                          <FieldError
                            id="sc-address-error"
                            message={errors.address}
                          />
                        ) : (
                          <p id="sc-address-help" className={styles.help}>
                            যে ঠিকানায় আপনার অর্ডার ডেলিভারি হয়েছিল
                          </p>
                        )}
                      </div>

                      <div className={styles.field}>
                        <span className={styles.label} id="sc-image-label">
                          স্ক্র্যাচ কার্ডের ছবি{" "}
                          <span className={styles.required} aria-hidden="true">
                            *
                          </span>
                        </span>
                        <input
                          id="sc-image"
                          ref={fileRef}
                          type="file"
                          accept={ACCEPTED_IMAGE_TYPES.join(",")}
                          onChange={(e) => onImageChange(e.target.files?.[0])}
                          className={styles.fileInput}
                          aria-labelledby="sc-image-label"
                          aria-invalid={Boolean(errors.image)}
                          aria-describedby={
                            errors.image ? "sc-image-error" : undefined
                          }
                        />
                        {image && preview ? (
                          <div className={styles.preview}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={preview}
                              alt="আপলোড করা স্ক্র্যাচ কার্ডের ছবি"
                              className={styles.previewImg}
                            />
                            <div className={styles.previewInfo}>
                              <p className={styles.previewName}>{image.name}</p>
                              <p className={styles.previewSize}>
                                {(image.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <label
                              htmlFor="sc-image"
                              className={styles.previewAction}
                            >
                              বদলান
                            </label>
                            <button
                              type="button"
                              onClick={removeImage}
                              className={styles.previewRemove}
                            >
                              সরান
                            </button>
                          </div>
                        ) : (
                          <label
                            htmlFor="sc-image"
                            className={`${styles.dropzone} ${errors.image ? styles.dropzoneInvalid : ""}`}
                          >
                            <span className={styles.dropIcon}>
                              <Icon size={22}>
                                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12M7 9l5-5 5 5" />
                              </Icon>
                            </span>
                            <span className={styles.dropText}>
                              <strong>স্ক্র্যাচ কার্ডের ছবি আপলোড করুন</strong>
                              JPG, PNG বা WEBP · সর্বোচ্চ ৫ MB
                            </span>
                          </label>
                        )}
                        <FieldError
                          id="sc-image-error"
                          message={errors.image}
                        />
                      </div>

                      <div
                        className={styles.field}
                        role="radiogroup"
                        aria-labelledby="sc-prize-label"
                        aria-invalid={Boolean(errors.prize)}
                        aria-describedby={
                          errors.prize ? "sc-prize-error" : undefined
                        }
                      >
                        <span id="sc-prize-label" className={styles.label}>
                          আপনার প্রাপ্ত পুরস্কারটি নির্বাচন করুন{" "}
                          <span className={styles.required} aria-hidden="true">
                            *
                          </span>
                        </span>
                        <div className={styles.prizeGrid}>
                          {PRIZES.map((p, i) => (
                            <label
                              key={p.value}
                              style={
                                {
                                  "--prize-from": p.tone[0],
                                  "--prize-to": p.tone[1],
                                } as CSSProperties
                              }
                              className={`${styles.prizeOption} ${
                                prize === p.value ? styles.prizeOptionActive : ""
                              } ${errors.prize ? styles.prizeOptionInvalid : ""}`}
                            >
                              <input
                                id={i === 0 ? "sc-prize" : undefined}
                                type="radio"
                                name="prize"
                                value={p.value}
                                checked={prize === p.value}
                                onChange={() => {
                                  setPrize(p.value);
                                  clearError("prize");
                                }}
                                className={styles.prizeRadio}
                              />
                              <span className={styles.prizeIcon}>
                                <Icon size={22}>{p.icon}</Icon>
                              </span>
                              <span className={styles.prizeText}>
                                <strong>{p.label}</strong>
                                {p.value}
                              </span>
                              {prize === p.value && (
                                <span className={styles.prizeCheck} aria-hidden="true">
                                  <Icon size={14}>
                                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                                  </Icon>
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                        <FieldError
                          id="sc-prize-error"
                          message={errors.prize}
                        />
                      </div>
                    </fieldset>

                    {formError && (
                      <p className={styles.error} role="alert">
                        {formError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className={`${styles.submit} ${styles.submitGreen}`}
                      aria-busy={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className={styles.spinner} aria-hidden="true" />
                          {phase === "checking"
                            ? "তথ্য যাচাই হচ্ছে..."
                            : "ছবি আপলোড ও জমা হচ্ছে..."}
                        </>
                      ) : (
                        <>
                          জমা দিন <span aria-hidden="true">→</span>
                        </>
                      )}
                    </button>

                    <Link
                      href="/scratch-card/track"
                      className={`${styles.guideLink} ${styles.formTrackLink}`}
                    >
                      আগে জমা দেওয়া কার্ডের অবস্থা দেখুন{" "}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </form>
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      {claimedPhone && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sc-claimed-title"
          onClick={() => setClaimedPhone(null)}
        >
          <div
            className={`${styles.modal} ${scratchCardFontClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalIcon}>
              <Icon size={26}>{TICKET_ICON}</Icon>
            </div>
            <h2 id="sc-claimed-title" className={styles.modalTitle}>
              এই নম্বরে আগেই পুরস্কার নেওয়া হয়েছে
            </h2>
            <p className={styles.modalText}>
              <strong>{claimedPhone}</strong> নম্বরে আপনি একটি স্ক্র্যাচ কার্ড
              পুরস্কার নিয়েছেন। আপনার হাতে যদি আরেকটি স্ক্র্যাচ কার্ড থাকে,
              তাহলে নিচের বাটনে ক্লিক করুন।
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={goToAdditionalForm}
                className={styles.submit}
              >
                আরেকটি কার্ড জমা দিন
              </button>
              <button
                type="button"
                onClick={() => setClaimedPhone(null)}
                className={styles.secondaryBtn}
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import type { SiteChromeSlots } from "@/components/SiteChrome";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MarqueeBanner from "@/components/MarqueeBanner";
import { apiFetch } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { useCustomer, type CustomerInfo } from "@/context/CustomerContext";

const PRIMARY = "#111111";
const SECONDARY = "#404040";

type Mode = "login" | "register";

interface LoginResult {
  token: string;
  customer: CustomerInfo;
}

export default function CustomerLoginPage({ header, footer }: SiteChromeSlots) {
  const router = useRouter();
  const { login: customerLogin } = useCustomer();
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "register") {
      setMode("register");
    }
  }, []);

  const reset = () => {
    setError("");
    setMessage("");
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    reset();
    setFullName("");
    setPhone("");
    setPassword("");
  };

  const validate = () => {
    if (mode === "register" && !fullName.trim()) return "Full name দিন";
    if (!/^01\d{9}$/.test(phone.trim()))
      return "সঠিক mobile number দিন (01XXXXXXXXX)";
    if (password.trim().length < 6) return "Password কমপক্ষে ৬ অক্ষর হতে হবে";
    return "";
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    reset();
    try {
      if (mode === "register") {
        await apiFetch<ApiResponse<null>>("/customer/register", {
          method: "POST",
          body: JSON.stringify({
            name: fullName.trim(),
            phone: phone.trim(),
            password,
          }),
        });
        setMessage("Account তৈরি হয়েছে! এখন login করুন।");
        switchMode("login");
        return;
      }
      const res = await apiFetch<ApiResponse<LoginResult>>("/customer/login", {
        method: "POST",
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      customerLogin(res.data.token, res.data.customer);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    height: 38,
    border: "1px solid #d7d7d7",
    borderRadius: 5,
    padding: "0 12px",
    fontSize: 15,
    outline: "none",
    background: "#fff",
    color: "#111827",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#F5F5F5",
      }}
    >
      <MarqueeBanner />
      {header}

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "34px 16px 44px",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: 695,
            background: "#fff",
            border: "1px solid #d9d9d9",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          {/* Header bar */}
          <div
            style={{
              background: SECONDARY,
              color: "#fff",
              padding: "13px 16px",
              fontSize: 18,
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          >
            {mode === "login" ? "CUSTOMER LOGIN" : "REGISTER"}
          </div>

          <div style={{ padding: "10px 15px 26px" }}>
            {/* Full Name — register only */}
            {mode === "register" && (
              <Field
                label="Full Name *"
                value={fullName}
                onChange={setFullName}
                placeholder="Enter your full name"
              />
            )}

            <Field
              label="Mobile Number *"
              value={phone}
              onChange={setPhone}
              placeholder="Enter your mobile number"
              type="tel"
            />
            <Field
              label="Password *"
              value={password}
              onChange={setPassword}
              placeholder={
                mode === "login" ? "Enter your password" : "Choose a password"
              }
              type="password"
            />

            {/* Feedback */}
            {error && (
              <p
                style={{
                  color: "#dc2626",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 6,
                  padding: "9px 12px",
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                {error}
              </p>
            )}
            {message && (
              <p
                style={{
                  color: "#166534",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 6,
                  padding: "9px 12px",
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                {message}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={submit}
              disabled={loading}
              style={{
                width: "100%",
                height: 47,
                border: 0,
                borderRadius: 5,
                background: PRIMARY,
                color: "#fff",
                fontSize: 14,
                fontWeight: 900,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.65 : 1,
                textTransform: "uppercase",
              }}
            >
              {loading
                ? "PLEASE WAIT..."
                : mode === "login"
                  ? "LOGIN"
                  : "SUBMIT"}
            </button>

            {/* Toggle */}
            <div
              style={{
                marginTop: 18,
                textAlign: "center",
                color: "#000",
                fontSize: 14,
              }}
            >
              {mode === "login" ? (
                <>
                  You Have No Account?{" "}
                  <button
                    onClick={() => switchMode("register")}
                    style={{
                      border: 0,
                      background: "transparent",
                      color: SECONDARY,
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    ✎ Click To Register
                  </button>
                </>
              ) : (
                <>
                  If have an account.{" "}
                  <button
                    onClick={() => switchMode("login")}
                    style={{
                      border: 0,
                      background: "transparent",
                      color: SECONDARY,
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    ✎ Login here
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {footer}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label style={{ display: "block", marginBottom: 19 }}>
      <span
        style={{
          display: "block",
          color: "#222",
          fontSize: 14,
          fontWeight: 800,
          marginBottom: 10,
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: 38,
          border: "1px solid #d7d7d7",
          borderRadius: 5,
          padding: "0 12px",
          color: "#111827",
          fontSize: 15,
          outline: "none",
          background: "#fff",
          boxSizing: "border-box",
        }}
      />
    </label>
  );
}

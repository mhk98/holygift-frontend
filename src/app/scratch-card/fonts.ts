import { Hind_Siliguri, Inter } from "next/font/google";

// Scoped to the scratch card pages: Inter draws Latin text and Hind Siliguri
// fills in Bengali, which Inter does not cover.
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sc-inter",
});

export const hindSiliguri = Hind_Siliguri({
  weight: ["400", "500", "600", "700"],
  subsets: ["bengali", "latin"],
  display: "swap",
  variable: "--font-sc-hind",
});

export const scratchCardFontClass = `${inter.variable} ${hindSiliguri.variable}`;

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FoodOS - Free Calorie Calculator | 50 Shades of AI",
  description:
    "Calculate your BMR, maintenance calories, and get a personalized weight loss timeline. Built by Divy Kairoth for Episode 4 of 50 Shades of AI.",
  openGraph: {
    title: "FoodOS - Free Calorie Calculator | 50 Shades of AI",
    description:
      "The exact math behind losing weight. No BS. Calculate your BMR and get a personalized plan.",
    type: "website",
    siteName: "FoodOS by 50 Shades of AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "FoodOS - Free Calorie Calculator",
    description:
      "The exact math behind losing weight. No BS. Calculate your BMR and get a personalized plan.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

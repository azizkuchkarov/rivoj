import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, Geist } from "next/font/google";

import { AppShell } from "@/components/layout/AppShell";

import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rivoj — Logopedik markaz",
  description: "O‘qituvchilar va bolalar uchun zamonaviy boshqaruv",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={cn("h-full", "antialiased", fraunces.variable, "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

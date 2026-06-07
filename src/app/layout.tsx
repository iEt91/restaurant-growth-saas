import type { Metadata } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { SupportModeProvider } from "@/components/support-mode-provider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Restaurant Growth SaaS",
  description: "Plataforma multi-tenant para restaurantes con paneles y CRM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es" className={`${manrope.variable} ${mono.variable} h-full`}>
      <body className="min-h-full bg-slate-50 text-slate-950 antialiased">
        <SupportModeProvider>{children}</SupportModeProvider>
      </body>
    </html>
  );
}

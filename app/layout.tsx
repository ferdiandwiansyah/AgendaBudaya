import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter, Lora } from "next/font/google"
import "./globals.css";
import FooterGuard from "./components/ui/FooterGuard";
import NavbarGuard from "./components/ui/NavbarGuard"; 

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const lora  = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" })

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agenda Budaya",
  description: "Event & agenda budaya untuk publik.",
};

export const viewport: Viewport = {
  // boleh string sederhana:
  // themeColor: "#ffffff",

  // atau versi responsive (disarankan):
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#0b0f1a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NavbarGuard />
        {children}
        <FooterGuard/>
      </body>
    </html>
  );
}

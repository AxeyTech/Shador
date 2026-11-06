import type { Metadata, Viewport } from "next";
import { AudioProvider } from "@/lib/audio/AudioContext";
import { CrtProvider } from "@/lib/crt/CrtContext";
import { CrtOverlay } from "@/components/CrtOverlay";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://shador.onrender.com"
  ),
  title: "SHADOR",
  description:
    "Passive attack surface intelligence, DNS security, SPF/DMARC spoofability index, SSL cryptographic posture, and autonomous threat modeling.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/shador-oni-logo.jpg", sizes: "any", type: "image/jpeg" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/shador-oni-logo.jpg", sizes: "180x180" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "SHADOR",
    description:
      "Enterprise-grade passive reconnaissance, attack surface mapping, cryptographic posture auditing, and autonomous threat modeling.",
    url: "/",
    siteName: "SHADOR",
    images: [
      {
        url: "/shador-oni-logo.jpg",
        width: 1024,
        height: 1024,
        alt: "SHADOR Reconnaissance Engine",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SHADOR",
    description:
      "Passive attack surface intelligence, DNS spoofability auditing, SSL cryptographic posture, and autonomous threat modeling.",
    images: ["/shador-oni-logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <head>
        <link rel="icon" href="/shador-oni-logo.jpg" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="shortcut icon" href="/shador-oni-logo.jpg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col bg-deep-void text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
        <AudioProvider>
          <CrtProvider>
            {children}
            <CrtOverlay />
          </CrtProvider>
        </AudioProvider>
      </body>
    </html>
  );
}

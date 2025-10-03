import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SkipNav } from "@/components/accessibility/SkipNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HOUSEHELP",
  description:
    "Professional household services platform connecting trusted workers with families.",
  manifest: "/manifest.json",
  themeColor: "#6495ED",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HOUSEHELP",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SkipNav />
        <ErrorBoundary>
          <Providers>
            <div id="main-content">{children}</div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}

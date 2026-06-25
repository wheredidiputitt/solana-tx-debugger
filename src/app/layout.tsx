import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { QueryProvider } from "@/components/shared/QueryProvider";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SolanaTx Debugger — Decode any Solana transaction",
  description:
    "Paste a Solana transaction signature and get a clean, human-readable report: status, summary, token transfers, balance changes, programs invoked, logs, and decoded errors.",
  keywords: [
    "Solana",
    "transaction",
    "debugger",
    "decoder",
    "web3",
    "developer tools",
    "Jupiter",
    "SPL Token",
  ],
  authors: [{ name: "SolanaTx Debugger" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "SolanaTx Debugger",
    description: "Decode any Solana transaction into a clean, human-readable report.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster />
            <SonnerToaster position="bottom-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

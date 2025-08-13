import type { Metadata } from "next";

import "./globals.css";
import ContextProvider from "@/context";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "DreamLend - P2P Lending on Somnia L1",
  description:
    "Decentralized peer-to-peer lending platform built on Somnia L1 testnet",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ContextProvider>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="min-h-[calc(100vh-64px)]">{children}</main>
          </div>
        </ContextProvider>
      </body>
    </html>
  );
}

"use client";

import { ethersAdapter, projectId, networks } from "@/config";
import { createAppKit } from "@reown/appkit/react";
import { useTheme } from "next-themes";
import React, { type ReactNode, useEffect } from "react";
if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Set up metadata
const metadata = {
  name: "DreamLend Finance",
  description:
    "DreamLend Finance a secure , smart and permission less  way to lend/borrow",
  url: "https://www.dreamlend.finance", // origin must match your domain & subdomain
  icons: ["https://www.dreamlend.finance/logo.png"],
};

// Create the modal
export const modal = createAppKit({
  adapters: [ethersAdapter],
  projectId,
  networks,
  metadata,
  chainImages: {
    50312: "https://somnia.network/images/branding/somnia_logo_color.png",
  },

  themeMode: "light",
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    history: false,
    swaps: false,
    onramp: false,
    send: false,
    email: false,
    socials: false,
    receive: false,
    pay: false,
  },
  themeVariables: {
    "--w3m-accent": "hsl(var(--primary))",
    "--w3m-border-radius-master": "8px",
  },
});

function ThemeSync() {
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    const actualTheme = theme === "system" ? systemTheme : theme;

    if (modal && actualTheme) {
      modal.setThemeMode(actualTheme as "light" | "dark");
    }
  }, [theme, systemTheme]);

  return null;
}

function ContextProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <ThemeSync />
      {children}
    </>
  );
}

export default ContextProvider;

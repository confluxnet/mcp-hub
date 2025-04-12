"use client";

import { ThemeProvider } from "next-themes";
import { WalletProvider } from "@/contexts/WalletContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WalletProvider>{children}</WalletProvider>
    </ThemeProvider>
  );
}

"use client";

import dynamic from "next/dynamic";
import { ThemeProvider } from "next-themes";
import { WalletProvider } from "@/contexts/WalletContext";
import { StoryProvider } from "@/lib/context/StoryContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WalletProvider>
        <StoryProvider>{children}</StoryProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}

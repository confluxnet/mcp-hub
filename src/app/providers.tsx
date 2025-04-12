"use client";

import dynamic from 'next/dynamic';
import { ThemeProvider } from "next-themes";
import { StoryProvider } from "@/lib/context/StoryContext";

// Import wallet provider dynamically to avoid hydration issues with wallet adapters
const SolanaProviderDynamic = dynamic(
  () => import("@/components/providers/SolanaProvider"),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SolanaProviderDynamic>
        <StoryProvider>
          {children}
        </StoryProvider>
      </SolanaProviderDynamic>
    </ThemeProvider>
  );
}

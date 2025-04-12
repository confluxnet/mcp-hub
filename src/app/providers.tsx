"use client";

import { ThemeProvider } from "next-themes";
import { StoryProvider } from "@/lib/context/StoryContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <StoryProvider>
        {children}
      </StoryProvider>
    </ThemeProvider>
  );
}

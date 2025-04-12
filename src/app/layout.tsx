import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MCP Hub - Web3 Model Context Protocol Gateway",
  description: "An all-in-one gateway to explore, filter, and integrate Web3 MCP tools",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Nav />
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}

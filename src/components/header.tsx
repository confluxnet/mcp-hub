"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useState } from "react";
import { ethers } from "ethers";
import { PanelRight } from "lucide-react";

interface HeaderProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
  isSidebarOpen: boolean;
  setActiveTab: (tab: "usage" | "provide" | "dao") => void;
}

export function Header({ setIsSidebarOpen, isSidebarOpen, setActiveTab }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b z-40 flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-accent rounded-md"
        >
          <PanelRight className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <Link
          href="/docs"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Documentation
        </Link>
        <Link
          href="/about"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          About
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}

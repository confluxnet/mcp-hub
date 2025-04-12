"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useState } from "react";
import { ethers } from "ethers";

export function Nav() {
  const [account, setAccount] = useState<string>("");
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    try {
      setLoading(true);
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);

      // Get token balance
      const sagaToken = new ethers.Contract(
        process.env.NEXT_PUBLIC_SAGA_TOKEN_ADDRESS || "",
        ["function balanceOf(address) view returns (uint256)"],
        provider
      );
      const balance = await sagaToken.balanceOf(accounts[0]);
      setBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-2xl font-bold">
            MCP Hub
          </Link>
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
          {!account ? (
            <Button onClick={connectWallet} disabled={loading}>
              <Wallet className="w-4 h-4 mr-2" />
              {loading ? "Connecting..." : "Connect Wallet"}
            </Button>
          ) : (
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </p>
                <p className="text-gray-500">{balance} SAGA</p>
              </div>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

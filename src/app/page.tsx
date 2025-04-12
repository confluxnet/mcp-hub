"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import type { Eip1193Provider } from "ethers";
import Link from "next/link";
import { Header } from "@/components/header";
import { Aside } from "@/components/aside";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Search, Filter } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

// Import contract ABIs
import SagaTokenABI from "../contracts/SagaToken.json";
import MCPPoolABI from "../contracts/MCPPool.json";
import SagaDAOABI from "../contracts/SagaDAO.json";
import BillingSystemABI from "../contracts/BillingSystem.json";

// Import mock data
// import mockMcpsData from "@/data/mockMcps.json";

// Contract addresses from environment variables
const SAGA_TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_SAGA_TOKEN_ADDRESS || "0x1234567890123456789012345678901234567890";
const MCP_POOL_ADDRESS =
  process.env.NEXT_PUBLIC_MCP_POOL_ADDRESS || "0x1234567890123456789012345678901234567890";
const SAGA_DAO_ADDRESS =
  process.env.NEXT_PUBLIC_SAGA_DAO_ADDRESS || "0x1234567890123456789012345678901234567890";
const BILLING_SYSTEM_ADDRESS =
  process.env.NEXT_PUBLIC_BILLING_SYSTEM_ADDRESS || "0x1234567890123456789012345678901234567890";

// Add Saga Chainlet network configuration
const SAGA_CHAINLET_CONFIG = {
  chainId: "0x" + (2744423445533000).toString(16), // Convert decimal to hex with 0x prefix
  chainName: "confluxnet_2744423445533000-1",
  nativeCurrency: {
    name: "NEX",
    symbol: "NEX",
    decimals: 18,
  },
  rpcUrls: ["https://confluxnet-2744423445533000-1.jsonrpc.sagarpc.io"],
  blockExplorerUrls: ["https://confluxnet-2744423445533000-1.sagaexplorer.io"],
};

interface MCP {
  id: string;
  title: string;
  description: string;
  tags: string[];
  icon: string;
  category: string;
  usageCount: number;
  rating: number;
  price: number;
  owner: string;
  approved: boolean;
  active: boolean;
  apiEndpoints: string[];
  revenue: number;
  codeExamples?: {
    typescript: string;
    python: string;
    shell: string;
  };
}

interface MetaMaskProvider extends Eip1193Provider {
  isMetaMask?: boolean;
}

// Use mockMcpsData.mcps instead
// const mockMcps = mockMcpsData.mcps;

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mcps, setMcps] = useState<MCP[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [useCase, setUseCase] = useState<string>("");
  const [recommendedMcps, setRecommendedMcps] = useState<MCP[]>([]);
  const [selectedMcp, setSelectedMcp] = useState<MCP | null>(null);
  const [apiResponse, setApiResponse] = useState<string>("");
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [usageStats, setUsageStats] = useState<{ total: number; today: number }>({
    total: 0,
    today: 0,
  });
  const { toast } = useToast();

  // Use the useWallet hook unconditionally
  const { walletState, connectWallet } = useWallet();
  const { account, balance, mcpPool, sagaToken, billingSystem } = walletState;

  // Handle responsive sidebar
  useEffect(() => {
    loadMcps();
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load MCPs from Firestore
  const loadMcps = async () => {
    try {
      setLoading(true);

      // Fetch MCPs from Firestore
      const response = await fetch("/api/mcp-list");
      const result = await response.json();
      console.log("result", result);

      if (result.mcps) {
        // Filter only approved and active MCPs
        const approvedMcps = result.mcps.filter((mcp: MCP) => mcp.approved && mcp.active);
        setMcps(approvedMcps);
      } else {
        console.error("No MCPs found in Firestore");
        setMcps([]);
        toast({
          title: "Warning",
          description: "Could not load MCPs from Firestore.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading MCPs from Firestore:", error);
      setMcps([]);
      toast({
        title: "Error",
        description: "Failed to load MCPs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Find MCPs based on use case
  const findMcpsForUseCase = async () => {
    if (!useCase.trim()) return;

    try {
      setLoading(true);

      // This is a placeholder - in a real implementation, you would call an AI service
      // to analyze the use case and recommend MCPs
      const recommended = mcps.filter(
        (mcp) =>
          mcp.approved &&
          mcp.active &&
          (mcp.title.toLowerCase().includes(useCase.toLowerCase()) ||
            mcp.description.toLowerCase().includes(useCase.toLowerCase()))
      );

      setRecommendedMcps(recommended);

      if (recommended.length === 0) {
        toast({
          title: "No MCPs Found",
          description: "No MCPs match your use case. Try a different search.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error finding MCPs:", error);
      toast({
        title: "Error",
        description: "Failed to find MCPs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Use an MCP
  const handleUseMcp = async (mcp: MCP) => {
    if (!mcpPool || !billingSystem) return;

    try {
      setLoading(true);
      setSelectedMcp(mcp);

      // Process payment
      const priceInWei = ethers.parseEther(mcp.price.toString());
      const tx = await billingSystem.processPayment(mcp.owner, priceInWei);
      await tx.wait();

      // Call the MCP API (this is a placeholder)
      // In a real implementation, you would call the actual API endpoint
      const response = await fetch(mcp.apiEndpoints[0], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ useCase }),
      });

      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));

      // Update usage stats
      setUsageStats((prev) => ({
        total: prev.total + 1,
        today: prev.today + 1,
      }));

      // Update token balance
      if (sagaToken && account) {
        const newBalance = await sagaToken.balanceOf(account);
        setTokenBalance(ethers.formatEther(newBalance));
      }

      toast({
        title: "MCP Used Successfully",
        description: `You have used ${mcp.title} and paid ${mcp.price} SAGA tokens`,
      });

      // Reload MCPs to update usage count
      await loadMcps();
    } catch (error) {
      console.error("Error using MCP:", error);
      toast({
        title: "Error",
        description: "Failed to use MCP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Header setIsSidebarOpen={setIsSidebarOpen} isSidebarOpen={isSidebarOpen} />

      <Aside isSidebarOpen={isSidebarOpen} />

      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setIsSidebarOpen(false)} />
      )}

      <main
        className={`min-h-screen p-6 mt-16 transition-all duration-300 ${
          isSidebarOpen ? "md:ml-64" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Search and Filter Section */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Find MCPs for your use case..."
                    className="pl-10"
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={findMcpsForUseCase} disabled={loading || !useCase.trim()}>
                {loading ? "Searching..." : "Search"}
              </Button>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {/* Mock Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...mcps].reverse().map((mcp) => (
              <Link href={`/mcp/${mcp.id}`} key={mcp.id} className="block">
                <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{mcp.icon}</span>
                        <CardTitle>{mcp.title}</CardTitle>
                      </div>
                      <Badge variant="secondary">{mcp.category}</Badge>
                    </div>
                    <CardDescription>{mcp.description}</CardDescription>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {mcp.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <span>⭐</span>
                        <span>{mcp.rating}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {mcp.usageCount.toLocaleString()} uses
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Original MCP Cards Grid */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Available MCPs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mcps.map((mcp) => (
                <Card key={mcp.id}>
                  <CardHeader>
                    <CardTitle>{mcp.title}</CardTitle>
                    <CardDescription>{mcp.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p>
                        <strong>Price:</strong> {mcp.price} SAGA tokens
                      </p>
                      <p>
                        <strong>Owner:</strong> {mcp.owner.slice(0, 6)}...{mcp.owner.slice(-4)}
                      </p>
                      <p>
                        <strong>Usage Count:</strong> {mcp.usageCount}
                      </p>
                      <div className="flex space-x-2">
                        <Badge variant={mcp.approved ? "default" : "secondary"}>
                          {mcp.approved ? "Approved" : "Pending"}
                        </Badge>
                        <Badge variant={mcp.active ? "default" : "secondary"}>
                          {mcp.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => handleUseMcp(mcp)}
                      disabled={loading || !mcp.approved || !mcp.active}
                      className="w-full"
                    >
                      Use MCP
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

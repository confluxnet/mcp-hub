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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

// Import contract ABIs
import SagaTokenABI from "../../contracts/SagaToken.json";
import MCPPoolABI from "../../contracts/MCPPool.json";
import SagaDAOABI from "../../contracts/SagaDAO.json";
import BillingSystemABI from "../../contracts/BillingSystem.json";

// Import mock data
import mockMcpsData from "@/data/mockMcps.json";

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

// Define the MCP interface
interface MCP {
  id: string;
  title: string;
  description: string;
  price: number;
  apiEndpoints: string[];
  codeExamples: {
    typescript: string;
    python: string;
    shell: string;
  };
  tags?: string[];
  icon?: string;
  category?: string;
  usageCount?: number;
  owner?: string;
  approved?: boolean;
  active?: boolean;
  revenue?: number;
}

interface MetaMaskProvider extends Eip1193Provider {
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
  }
}

export default function ProvideMcps() {
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

  // Use the useWallet hook
  const { walletState, connectWallet } = useWallet();
  const { account, balance, mcpPool } = walletState;

  // Handle responsive sidebar
  useEffect(() => {
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

  // Load MCPs from the contract
  const loadMcps = async () => {
    if (!mcpPool) return;

    try {
      setLoading(true);
      // This is a placeholder - you'll need to implement the actual contract call
      try {
        const mcpsData = await mcpPool.getMcps();

        const formattedMcps: MCP[] = mcpsData.map((mcp: any) => ({
          id: mcp.id,
          title: mcp.title,
          description: mcp.description,
          tags: mcp.tags || [],
          icon: mcp.icon,
          category: mcp.category,
          usageCount: mcp.usageCount.toNumber(),
          rating: mcp.rating,
          price: parseFloat(ethers.formatEther(mcp.price)),
          owner: mcp.owner,
          approved: mcp.approved,
          active: mcp.active,
          apiEndpoints: mcp.apiEndpoints || [],
          revenue: parseFloat(ethers.formatEther(mcp.revenue)),
          codeExamples: mcp.codeExamples,
        }));

        setMcps(formattedMcps);
      } catch (mcpError) {
        console.error("Error loading MCPs from contract:", mcpError);
        // Set empty array if there's an error
        setMcps([]);
        toast({
          title: "Warning",
          description:
            "Could not load MCPs. The contract might not be deployed or the address might be incorrect.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading MCPs:", error);
      toast({
        title: "Error",
        description: "Failed to load MCPs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Submit new MCP
  const handleSubmitMcp = async () => {
    if (!mcpPool) return;

    try {
      setLoading(true);

      // Validate input
      if (
        !selectedMcp ||
        !selectedMcp.title ||
        !selectedMcp.description ||
        !selectedMcp.price ||
        !selectedMcp.apiEndpoints
      ) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Convert price to Wei
      const priceInWei = ethers.parseEther(selectedMcp.price.toString());

      // Submit MCP to the contract
      const tx = await mcpPool.submitMcp(
        selectedMcp.title,
        selectedMcp.description,
        priceInWei,
        selectedMcp.apiEndpoints,
        selectedMcp.codeExamples
      );
      await tx.wait();

      // Reset form
      setSelectedMcp(null);

      // Reload MCPs
      await loadMcps();

      toast({
        title: "Success",
        description: "MCP submitted successfully. Waiting for DAO approval.",
      });
    } catch (error) {
      console.error("Error submitting MCP:", error);
      toast({
        title: "Error",
        description: "Failed to submit MCP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fix the API endpoints handling
  const handleApiEndpointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedMcp) {
      // Get the input value as a string
      const inputValue = e.target.value as string;
      // Convert the input string to an array of strings
      const endpoints = inputValue ? inputValue.split(",").map((endpoint) => endpoint.trim()) : [];
      setSelectedMcp({
        ...selectedMcp,
        apiEndpoints: endpoints,
      });
    }
  };

  // Fix the code examples handling
  const handleCodeExampleChange = (language: "typescript" | "python" | "shell", value: string) => {
    if (selectedMcp) {
      setSelectedMcp({
        ...selectedMcp,
        codeExamples: {
          ...selectedMcp.codeExamples,
          [language]: value,
        },
      });
    }
  };

  // Fix the form field handlers
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedMcp) {
      setSelectedMcp({
        ...selectedMcp,
        title: e.target.value,
      });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedMcp) {
      setSelectedMcp({
        ...selectedMcp,
        description: e.target.value,
      });
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedMcp) {
      setSelectedMcp({
        ...selectedMcp,
        price: parseFloat(e.target.value),
      });
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
          <Tabs defaultValue="submit" className="space-y-6">
            <TabsList>
              <TabsTrigger value="submit">Submit MCP</TabsTrigger>
              <TabsTrigger value="dashboard">Provider Dashboard</TabsTrigger>
            </TabsList>

            <TabsContent value="submit" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Submit MCP for DAO Approval</CardTitle>
                  <CardDescription>
                    Fill in the details of your MCP to submit it for DAO approval.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">
                      Title
                    </label>
                    <Input
                      id="title"
                      placeholder="Enter MCP title"
                      value={selectedMcp?.title || ""}
                      onChange={handleTitleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description
                    </label>
                    <Textarea
                      id="description"
                      placeholder="Enter MCP description"
                      value={selectedMcp?.description || ""}
                      onChange={handleDescriptionChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="price" className="text-sm font-medium">
                      Price (SAGA tokens)
                    </label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="Enter MCP price"
                      value={selectedMcp?.price || ""}
                      onChange={handlePriceChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="apiEndpoints" className="text-sm font-medium">
                      API Endpoints (comma-separated)
                    </label>
                    <Input
                      id="apiEndpoints"
                      placeholder="Enter API endpoints"
                      value={selectedMcp?.apiEndpoints?.join(", ") || ""}
                      onChange={handleApiEndpointsChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="codeExamples" className="text-sm font-medium">
                      Code Examples
                    </label>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="typescript" className="text-sm font-medium">
                          TypeScript
                        </label>
                        <Textarea
                          id="typescript"
                          placeholder="Enter TypeScript example"
                          value={selectedMcp?.codeExamples?.typescript || ""}
                          onChange={(e) => handleCodeExampleChange("typescript", e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="python" className="text-sm font-medium">
                          Python
                        </label>
                        <Textarea
                          id="python"
                          placeholder="Enter Python example"
                          value={selectedMcp?.codeExamples?.python || ""}
                          onChange={(e) => handleCodeExampleChange("python", e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="shell" className="text-sm font-medium">
                          Shell
                        </label>
                        <Textarea
                          id="shell"
                          placeholder="Enter Shell example"
                          value={selectedMcp?.codeExamples?.shell || ""}
                          onChange={(e) => handleCodeExampleChange("shell", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSubmitMcp} disabled={loading} className="w-full">
                    {loading ? "Submitting..." : "Submit MCP"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your MCPs</CardTitle>
                    <CardDescription>Manage your submitted MCPs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mcps
                        .filter((mcp) => mcp.owner === account)
                        .map((mcp) => (
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
                          </Card>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Earnings</CardTitle>
                    <CardDescription>Your MCP earnings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Earnings</span>
                        <span className="text-2xl font-bold">{balance} SAGA</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Available Balance</span>
                        <span className="text-2xl font-bold">{tokenBalance} SAGA</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

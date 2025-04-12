"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import type { Eip1193Provider } from "ethers";
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

// Import contract ABIs
import SagaTokenABI from "../../contracts/SagaToken.json";
import MCPPoolABI from "../../contracts/MCPPool.json";
import SagaDAOABI from "../../contracts/SagaDAO.json";
import BillingSystemABI from "../../contracts/BillingSystem.json";

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

declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
  }
}

export default function ProvideMcps() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [account, setAccount] = useState<string>("");
  const [sagaToken, setSagaToken] = useState<ethers.Contract | null>(null);
  const [mcpPool, setMcpPool] = useState<ethers.Contract | null>(null);
  const [sagaDao, setSagaDao] = useState<ethers.Contract | null>(null);
  const [billingSystem, setBillingSystem] = useState<ethers.Contract | null>(null);
  const [mcps, setMcps] = useState<MCP[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [balance, setBalance] = useState("0");
  const [earnings, setEarnings] = useState("0");
  const [newMcp, setNewMcp] = useState({
    title: "",
    description: "",
    price: "",
    apiEndpoints: "",
    codeExamples: {
      typescript: "",
      python: "",
      shell: "",
    },
  });
  const { toast } = useToast();

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

  // Connect wallet and initialize contracts
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast({
          title: "Error",
          description: "Please install MetaMask to use this feature",
          variant: "destructive",
        });
        return;
      }

      const ethereum = window.ethereum as unknown as MetaMaskProvider;

      if (ethereum?.isMetaMask) {
        const accounts = (await ethereum.request({
          method: "eth_requestAccounts",
        })) as string[];

        // Check if we're on the correct network
        const provider = new ethers.BrowserProvider(ethereum);
        const network = await provider.getNetwork();
        const currentChainId = network.chainId.toString(16);

        if (currentChainId !== SAGA_CHAINLET_CONFIG.chainId.replace("0x", "")) {
          try {
            // Try to switch to the Saga network
            await ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: SAGA_CHAINLET_CONFIG.chainId }],
            });
          } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
              try {
                await ethereum.request({
                  method: "wallet_addEthereumChain",
                  params: [
                    {
                      chainId: SAGA_CHAINLET_CONFIG.chainId,
                      chainName: SAGA_CHAINLET_CONFIG.chainName,
                      nativeCurrency: SAGA_CHAINLET_CONFIG.nativeCurrency,
                      rpcUrls: SAGA_CHAINLET_CONFIG.rpcUrls,
                      blockExplorerUrls: SAGA_CHAINLET_CONFIG.blockExplorerUrls,
                    },
                  ],
                });
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to add Saga network to MetaMask",
                  variant: "destructive",
                });
                return;
              }
            } else {
              toast({
                title: "Error",
                description: "Failed to switch to Saga network",
                variant: "destructive",
              });
              return;
            }
          }
        }

        // Get the updated provider and signer after network switch
        const updatedProvider = new ethers.BrowserProvider(ethereum);
        const signer = await updatedProvider.getSigner();
        setAccount(accounts[0]);

        // Initialize contract instances
        const sagaTokenContract = new ethers.Contract(SAGA_TOKEN_ADDRESS, SagaTokenABI.abi, signer);
        const mcpPoolContract = new ethers.Contract(MCP_POOL_ADDRESS, MCPPoolABI.abi, signer);
        const sagaDaoContract = new ethers.Contract(SAGA_DAO_ADDRESS, SagaDAOABI.abi, signer);
        const billingSystemContract = new ethers.Contract(
          BILLING_SYSTEM_ADDRESS,
          BillingSystemABI.abi,
          signer
        );

        setSagaToken(sagaTokenContract);
        setMcpPool(mcpPoolContract);
        setSagaDao(sagaDaoContract);
        setBillingSystem(billingSystemContract);

        // Get token balance
        try {
          const balance = await sagaTokenContract.balanceOf(accounts[0]);
          setBalance(ethers.formatEther(balance));
        } catch (balanceError) {
          console.error("Error getting token balance:", balanceError);
          setBalance("0");
        }

        // Load MCPs
        await loadMcps();
      } else {
        toast({
          title: "MetaMask Required",
          description: "Please install MetaMask to use this application",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Error",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

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
      if (!newMcp.title || !newMcp.description || !newMcp.price || !newMcp.apiEndpoints) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Convert price to Wei
      const priceInWei = ethers.parseEther(newMcp.price);

      // Submit MCP to the contract
      const tx = await mcpPool.submitMcp(
        newMcp.title,
        newMcp.description,
        priceInWei,
        newMcp.apiEndpoints.split(",").map((endpoint) => endpoint.trim()),
        newMcp.codeExamples
      );
      await tx.wait();

      // Reset form
      setNewMcp({
        title: "",
        description: "",
        price: "",
        apiEndpoints: "",
        codeExamples: {
          typescript: "",
          python: "",
          shell: "",
        },
      });

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

  // Add disconnect wallet function
  const disconnectWallet = () => {
    setAccount("");
    setBalance("0");
    setSagaToken(null);
    setMcpPool(null);
    setSagaDao(null);
    setBillingSystem(null);
    setMcps([]);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
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

      <Aside
        isSidebarOpen={isSidebarOpen}
        account={account}
        balance={balance}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
      />

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
                      value={newMcp.title}
                      onChange={(e) => setNewMcp({ ...newMcp, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description
                    </label>
                    <Textarea
                      id="description"
                      placeholder="Enter MCP description"
                      value={newMcp.description}
                      onChange={(e) => setNewMcp({ ...newMcp, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="price" className="text-sm font-medium">
                      Price (SAGA tokens)
                    </label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="Enter price in SAGA tokens"
                      value={newMcp.price}
                      onChange={(e) => setNewMcp({ ...newMcp, price: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="apiEndpoints" className="text-sm font-medium">
                      API Endpoints (comma-separated)
                    </label>
                    <Input
                      id="apiEndpoints"
                      placeholder="Enter API endpoints"
                      value={newMcp.apiEndpoints}
                      onChange={(e) => setNewMcp({ ...newMcp, apiEndpoints: e.target.value })}
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
                          value={newMcp.codeExamples.typescript}
                          onChange={(e) =>
                            setNewMcp({
                              ...newMcp,
                              codeExamples: {
                                ...newMcp.codeExamples,
                                typescript: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor="python" className="text-sm font-medium">
                          Python
                        </label>
                        <Textarea
                          id="python"
                          placeholder="Enter Python example"
                          value={newMcp.codeExamples.python}
                          onChange={(e) =>
                            setNewMcp({
                              ...newMcp,
                              codeExamples: {
                                ...newMcp.codeExamples,
                                python: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor="shell" className="text-sm font-medium">
                          Shell
                        </label>
                        <Textarea
                          id="shell"
                          placeholder="Enter Shell example"
                          value={newMcp.codeExamples.shell}
                          onChange={(e) =>
                            setNewMcp({
                              ...newMcp,
                              codeExamples: {
                                ...newMcp.codeExamples,
                                shell: e.target.value,
                              },
                            })
                          }
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
                        <span className="text-2xl font-bold">{earnings} SAGA</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Available Balance</span>
                        <span className="text-2xl font-bold">{balance} SAGA</span>
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

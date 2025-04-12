import { useState, useEffect } from "react";
import { ethers } from "ethers";
import type { Eip1193Provider } from "ethers";
import { useRouter, usePathname } from "next/navigation";

import { Header } from "@/components/header";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  InfoIcon,
  Search,
  Filter,
  Wallet,
  Menu,
  X,
  BarChart2,
  Package,
  Users,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  PanelRight,
} from "lucide-react";

// Import contract ABIs
import SagaTokenABI from "../contracts/SagaToken.json";
import MCPPoolABI from "../contracts/MCPPool.json";
import SagaDAOABI from "../contracts/SagaDAO.json";
import BillingSystemABI from "../contracts/BillingSystem.json";

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

// Custom Alert component
interface AlertProps {
  children: React.ReactNode;
  variant?: "default" | "destructive";
}

function Alert({ children, variant = "default" }: AlertProps) {
  return (
    <div
      className={`p-4 rounded-md ${
        variant === "destructive" ? "bg-red-50 text-red-800" : "bg-blue-50 text-blue-800"
      }`}
    >
      {children}
    </div>
  );
}

function AlertTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-medium mb-1">{children}</h3>;
}

function AlertDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm">{children}</p>;
}

interface MCP {
  id: number;
  name: string;
  description: string;
  price: number;
  owner: string;
  approved: boolean;
  active: boolean;
  apiEndpoints: string[];
  usageCount: number;
  revenue: number;
}

type TabType = "usage" | "provide" | "dao";

interface Proposal {
  id: number;
  title: string;
  description: string;
  proposer: string;
  forVotes: number;
  againstVotes: number;
  executed: boolean;
  endBlock: number;
}

interface MetaMaskProvider extends Eip1193Provider {
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
  }
}

export function MCPMarketplace() {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [account, setAccount] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabType>("usage");
  const [sagaToken, setSagaToken] = useState<ethers.Contract | null>(null);
  const [mcpPool, setMcpPool] = useState<ethers.Contract | null>(null);
  const [sagaDao, setSagaDao] = useState<ethers.Contract | null>(null);
  const [billingSystem, setBillingSystem] = useState<ethers.Contract | null>(null);
  const [mcps, setMcps] = useState<MCP[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
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
  const [balance, setBalance] = useState("0");
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

  // Handle navigation
  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

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

        // Load MCPs and proposals
        await loadMcps();
        await loadProposals();
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
          id: mcp.id.toNumber(),
          name: mcp.name,
          description: mcp.description,
          price: parseFloat(ethers.formatEther(mcp.price)),
          owner: mcp.owner,
          approved: mcp.approved,
          active: mcp.active,
          apiEndpoints: mcp.apiEndpoints || [],
          usageCount: mcp.usageCount.toNumber(),
          revenue: parseFloat(ethers.formatEther(mcp.revenue)),
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

  // Load DAO proposals
  const loadProposals = async () => {
    if (!sagaDao) return;

    try {
      // This is a placeholder - you'll need to implement the actual contract call
      try {
        const proposalsData = await sagaDao.getProposals();

        const formattedProposals: Proposal[] = proposalsData.map((proposal: any) => ({
          id: proposal.id.toNumber(),
          title: proposal.title,
          description: proposal.description,
          proposer: proposal.proposer,
          forVotes: parseFloat(ethers.formatEther(proposal.forVotes)),
          againstVotes: parseFloat(ethers.formatEther(proposal.againstVotes)),
          executed: proposal.executed,
          endBlock: proposal.endBlock.toNumber(),
        }));

        setProposals(formattedProposals);
      } catch (proposalError) {
        console.error("Error loading proposals from contract:", proposalError);
        // Set empty array if there's an error
        setProposals([]);
        toast({
          title: "Warning",
          description:
            "Could not load proposals. The contract might not be deployed or the address might be incorrect.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading proposals:", error);
    }
  };

  // Submit MCP for DAO approval
  const submitMcpForApproval = async (
    name: string,
    description: string,
    price: string,
    apiEndpoints: string[]
  ) => {
    if (!sagaDao || !mcpPool) return;

    try {
      setLoading(true);

      // Create proposal for MCP approval
      const priceInWei = ethers.parseEther(price);
      const tx = await sagaDao.propose(
        [mcpPool.address], // targets
        [0], // values
        [
          ethers.AbiCoder.defaultAbiCoder().encode(
            ["string", "string", "uint256", "string[]"],
            [name, description, priceInWei, apiEndpoints]
          ),
        ], // calldatas
        `Approve MCP: ${name}` // description
      );

      await tx.wait();

      toast({
        title: "Proposal Submitted",
        description: "Your MCP has been submitted for DAO approval",
      });

      // Reload proposals
      await loadProposals();
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

  // Vote on a proposal
  const voteOnProposal = async (proposalId: number, support: boolean) => {
    if (!sagaDao) return;

    try {
      setLoading(true);

      const tx = await sagaDao.castVote(proposalId, support ? 1 : 0);
      await tx.wait();

      toast({
        title: "Vote Cast",
        description: `You have voted ${support ? "for" : "against"} the proposal`,
      });

      // Reload proposals
      await loadProposals();
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: "Failed to cast vote. Please try again.",
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
          (mcp.name.toLowerCase().includes(useCase.toLowerCase()) ||
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
        description: `You have used ${mcp.name} and paid ${mcp.price} SAGA tokens`,
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

  // Withdraw provider funds
  const withdrawProviderFunds = async () => {
    if (!billingSystem) return;

    try {
      setLoading(true);

      const tx = await billingSystem.withdrawProviderFunds();
      await tx.wait();

      toast({
        title: "Funds Withdrawn",
        description: "Your provider funds have been withdrawn successfully",
      });
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      toast({
        title: "Error",
        description: "Failed to withdraw funds. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get provider balance
  const getProviderBalance = async () => {
    if (!billingSystem || !account) return;

    try {
      const balance = await billingSystem.getProviderBalance(account);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("Error getting provider balance:", error);
      return "0";
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
    <div className="min-h-screen flex">
      <Header
        setIsSidebarOpen={setIsSidebarOpen}
        isSidebarOpen={isSidebarOpen}
        setActiveTab={setActiveTab}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed
          top-16
          left-0
          h-[calc(100vh-4rem)]
          w-64
          bg-background
          border-r
          transition-transform
          duration-300
          ease-in-out
          z-30
          flex
          flex-col
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-4">
          <h1 className="text-xl font-bold mb-6">MCP HUB</h1>
          <nav className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start pl-4"
              onClick={() => setActiveTab("usage")}
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              Usage Statistics
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start pl-4"
              onClick={() => setActiveTab("provide")}
            >
              <Package className="w-4 h-4 mr-2" />
              Provide MCPs
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start pl-4"
              onClick={() => setActiveTab("dao")}
            >
              <Users className="w-4 h-4 mr-2" />
              DAO Governance
            </Button>
          </nav>
        </div>

        {/* Connect Wallet Button at Bottom */}
        <div className="mt-auto p-4 border-t">
          <Button
            className="w-full flex items-center justify-center"
            onClick={connectWallet}
            variant={account ? "outline" : "default"}
          >
            <Wallet className="w-4 h-4 mr-2" />
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 p-6 mt-16 transition-all duration-300 ${
          isSidebarOpen ? "md:ml-64" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {activeTab === "usage" && (
            <>
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

              {/* MCP Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mcps.map((mcp) => (
                  <Card key={mcp.id}>
                    <CardHeader>
                      <CardTitle>{mcp.name}</CardTitle>
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
            </>
          )}

          {activeTab === "provide" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Submit MCP for DAO Approval</CardTitle>
                  <CardDescription>Create a new MCP and submit it for DAO approval</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mcpName">MCP Name</Label>
                    <Input id="mcpName" placeholder="e.g., Sentiment Analysis API" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mcpDescription">Description</Label>
                    <Textarea
                      id="mcpDescription"
                      placeholder="Describe what your MCP does and how it can be used"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mcpPrice">Price (SAGA tokens)</Label>
                    <Input id="mcpPrice" type="number" placeholder="e.g., 10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiEndpoints">API Endpoints (one per line)</Label>
                    <Textarea id="apiEndpoints" placeholder="https://api.example.com/sentiment" />
                  </div>
                  <Button
                    onClick={() => {
                      const name = (document.getElementById("mcpName") as HTMLInputElement).value;
                      const description = (
                        document.getElementById("mcpDescription") as HTMLInputElement
                      ).value;
                      const price = (document.getElementById("mcpPrice") as HTMLInputElement).value;
                      const endpoints = (
                        document.getElementById("apiEndpoints") as HTMLInputElement
                      ).value
                        .split("\n")
                        .filter((endpoint) => endpoint.trim() !== "");

                      if (name && description && price && endpoints.length > 0) {
                        submitMcpForApproval(name, description, price, endpoints);
                      } else {
                        toast({
                          title: "Missing Information",
                          description: "Please fill in all fields",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={loading}
                  >
                    Submit for DAO Approval
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Provider Dashboard</CardTitle>
                  <CardDescription>Manage your MCPs and earnings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Your MCPs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {mcps.filter((mcp) => mcp.owner === account).length > 0 ? (
                          <div className="space-y-4">
                            {mcps
                              .filter((mcp) => mcp.owner === account)
                              .map((mcp) => (
                                <div key={mcp.id} className="border p-4 rounded-md">
                                  <h3 className="font-bold">{mcp.name}</h3>
                                  <p className="text-sm text-gray-500">{mcp.description}</p>
                                  <div className="flex space-x-2 mt-2">
                                    <Badge variant={mcp.approved ? "default" : "secondary"}>
                                      {mcp.approved ? "Approved" : "Pending"}
                                    </Badge>
                                    <Badge variant={mcp.active ? "default" : "secondary"}>
                                      {mcp.active ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                  <div className="mt-2">
                                    <p>
                                      <strong>Usage:</strong> {mcp.usageCount} calls
                                    </p>
                                    <p>
                                      <strong>Revenue:</strong> {mcp.revenue} SAGA
                                    </p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p>You haven't created any MCPs yet</p>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Earnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span>Available Balance</span>
                            <span id="providerBalance">Loading...</span>
                          </div>
                          <Button onClick={withdrawProviderFunds} disabled={loading}>
                            Withdraw Funds
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "dao" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>DAO Governance</CardTitle>
                  <CardDescription>
                    Participate in the governance of the MCP Marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <InfoIcon className="h-4 w-4" />
                      <AlertTitle>DAO Information</AlertTitle>
                      <AlertDescription>
                        As a SAGA token holder, you can participate in governance by voting on
                        proposals. The more tokens you hold, the more voting power you have.
                      </AlertDescription>
                    </Alert>

                    <h3 className="text-lg font-medium">Active Proposals</h3>
                    {proposals.length > 0 ? (
                      <div className="space-y-4">
                        {proposals.map((proposal) => (
                          <Card key={proposal.id}>
                            <CardHeader>
                              <CardTitle>{proposal.title}</CardTitle>
                              <CardDescription>{proposal.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <p>
                                  <strong>Proposer:</strong> {proposal.proposer}
                                </p>
                                <div className="flex justify-between">
                                  <span>For: {proposal.forVotes} votes</span>
                                  <span>Against: {proposal.againstVotes} votes</span>
                                </div>
                                <Progress
                                  value={
                                    proposal.forVotes + proposal.againstVotes > 0
                                      ? (proposal.forVotes /
                                          (proposal.forVotes + proposal.againstVotes)) *
                                        100
                                      : 0
                                  }
                                />
                                <p>
                                  <strong>Status:</strong>{" "}
                                  {proposal.executed ? "Executed" : "Active"}
                                </p>
                              </div>
                            </CardContent>
                            <CardFooter className="flex space-x-2">
                              <Button
                                onClick={() => voteOnProposal(proposal.id, true)}
                                disabled={loading || proposal.executed}
                                className="flex-1"
                              >
                                Vote For
                              </Button>
                              <Button
                                onClick={() => voteOnProposal(proposal.id, false)}
                                disabled={loading || proposal.executed}
                                variant="outline"
                                className="flex-1"
                              >
                                Vote Against
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p>No active proposals</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import { ethers } from "ethers";
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
import { InfoIcon, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

// Import contract ABIs
import SagaTokenABI from "../contracts/SagaToken.json";
import MCPPoolABI from "../contracts/MCPPool.json";
import SagaDAOABI from "../contracts/SagaDAO.json";
import BillingSystemABI from "../contracts/BillingSystem.json";

// Contract addresses from environment variables
const SAGA_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SAGA_TOKEN_ADDRESS || "";
const MCP_POOL_ADDRESS = process.env.NEXT_PUBLIC_MCP_POOL_ADDRESS || "";
const SAGA_DAO_ADDRESS = process.env.NEXT_PUBLIC_SAGA_DAO_ADDRESS || "";
const BILLING_SYSTEM_ADDRESS = process.env.NEXT_PUBLIC_BILLING_SYSTEM_ADDRESS || "";

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

export function MCPMarketplace() {
  const [account, setAccount] = useState<string>("");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
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

  // Connect wallet and initialize contracts
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        // Use ethers v6 BrowserProvider
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);

        const accounts = await provider.send("eth_requestAccounts", []);
        const account = accounts[0];
        setAccount(account);

        const signer = await provider.getSigner();

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
        const balance = await sagaTokenContract.balanceOf(account);
        setBalance(ethers.formatEther(balance));

        // Load MCPs and proposals
        await loadMcps();
        await loadProposals();
      } else {
        toast({
          title: "MetaMask not found",
          description: "Please install MetaMask to use this application",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect wallet. Please try again.",
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

  return (
    <div className="space-y-8">
      {/* Wallet Connection */}
      <Card>
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>Connect your wallet to use the MCP Marketplace</CardDescription>
        </CardHeader>
        <CardContent>
          {!account ? (
            <Button onClick={connectWallet} disabled={loading}>
              {loading ? "Connecting..." : "Connect Wallet"}
            </Button>
          ) : (
            <div className="space-y-2">
              <p>Connected Account: {account}</p>
              <p>SAGA Token Balance: {balance} SAGA</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="use">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="use">Use MCPs</TabsTrigger>
          <TabsTrigger value="provide">Provide MCPs</TabsTrigger>
          <TabsTrigger value="dao">DAO Governance</TabsTrigger>
        </TabsList>

        {/* Use MCPs Tab */}
        <TabsContent value="use" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Find MCPs for Your Use Case</CardTitle>
              <CardDescription>
                Describe what you want to do, and we&apos;ll find the right MCPs for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="useCase">What do you want to do?</Label>
                <Textarea
                  id="useCase"
                  placeholder="e.g., I want to analyze sentiment in social media posts"
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                />
              </div>
              <Button onClick={findMcpsForUseCase} disabled={loading || !useCase.trim()}>
                {loading ? "Searching..." : "Find MCPs"}
              </Button>
            </CardContent>
          </Card>

          {/* Recommended MCPs */}
          {recommendedMcps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommended MCPs</CardTitle>
                <CardDescription>These MCPs match your use case</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedMcps.map((mcp) => (
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
                            <strong>Owner:</strong> {mcp.owner}
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
              </CardContent>
            </Card>
          )}

          {/* API Response */}
          {selectedMcp && apiResponse && (
            <Card>
              <CardHeader>
                <CardTitle>API Response from {selectedMcp.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                  {apiResponse}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>Your MCP usage and token consumption</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Usage</span>
                  <span>{usageStats.total} calls</span>
                </div>
                <Progress value={(usageStats.total / 100) * 100} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Today&apos;s Usage</span>
                  <span>{usageStats.today} calls</span>
                </div>
                <Progress value={(usageStats.today / 20) * 100} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Token Balance</span>
                  <span>{tokenBalance} SAGA</span>
                </div>
                <Progress value={(parseFloat(tokenBalance) / parseFloat(balance)) * 100} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Provide MCPs Tab */}
        <TabsContent value="provide" className="space-y-4">
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

          {/* Provider Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Dashboard</CardTitle>
              <CardDescription>Manage your MCPs and earnings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      <p>You haven&apos;t created any MCPs yet</p>
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
        </TabsContent>

        {/* DAO Governance Tab */}
        <TabsContent value="dao" className="space-y-4">
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
                              <strong>Status:</strong> {proposal.executed ? "Executed" : "Active"}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

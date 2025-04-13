"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
// Define a custom type for MetaMask provider
interface Eip1193Provider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
}
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
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useWallet } from "@/hooks/useWallet";

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
  price: number;
  apiEndpoints: string[];
  codeExamples: Record<string, any>;
  tags: string[];
  icon: string;
  category: string;
  usageCount: number;
  owner: string;
  approved: boolean;
  active: boolean;
  revenue: number;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  startTime: number;
  endTime: number;
  forVotes: number;
  againstVotes: number;
  executed: boolean;
  status: "active" | "passed" | "rejected" | "executed";
}

interface MetaMaskProvider extends Eip1193Provider {
  isMetaMask?: boolean;
}

export default function DaoGovernance() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [mcps, setMcps] = useState<MCP[]>([]);
  const [pendingMcps, setPendingMcps] = useState<MCP[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [newMcpPool, setNewMcpPool] = useState<ethers.Contract | null>(null);

  const [votingPower, setVotingPower] = useState("0");
  const [newProposal, setNewProposal] = useState({
    title: "",
    description: "",
    duration: "3", // days
  });
  const [selectedMcp, setSelectedMcp] = useState<MCP | null>(null);
  const [approvalReason, setApprovalReason] = useState("");
  const { toast } = useToast();

  // Use the useWallet hook unconditionally
  const { walletState, connectWallet } = useWallet();
  const { account, balance, mcpPool, sagaToken, sagaDao, billingSystem } = walletState;

  // Initialize MCP Pool
  const initializeMcpPool = async () => {
    if (!account || !window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const mcpPoolContract = new ethers.Contract(MCP_POOL_ADDRESS, MCPPoolABI.abi, signer);

      setNewMcpPool(mcpPoolContract);
      return mcpPoolContract;
    } catch (error) {
      console.error("Error initializing MCP Pool:", error);
      toast({
        title: "Error",
        description: "Failed to initialize MCP Pool contract",
        variant: "destructive",
      });
      return null;
    }
  };

  // Load MCPs from the contract
  const loadMcps = async () => {
    const poolToUse = mcpPool || newMcpPool;
    if (!poolToUse) return;

    try {
      setLoading(true);
      // This is a placeholder - you'll need to implement the actual contract call
      try {
        // getMCP 함수가 단일 객체를 반환하는 것으로 보임
        const mcpData = await poolToUse.getMCP(0);
        console.log("MCP Data:", mcpData);

        // Check if mcpData is an array
        if (Array.isArray(mcpData)) {
          // Handle array of MCPs
          const formattedMcps: MCP[] = mcpData.map((mcp: any) => ({
            id: mcp.id,
            title: mcp.title,
            description: mcp.description,
            tags: mcp.tags || [],
            icon: mcp.icon,
            category: mcp.category,
            usageCount: mcp.usageCount.toNumber(),
            rating: mcp.rating,
            price: parseFloat(formatEther(mcp.price)),
            owner: mcp.owner,
            approved: mcp.approved,
            active: mcp.active,
            apiEndpoints: mcp.apiEndpoints || [],
            revenue: parseFloat(formatEther(mcp.revenue)),
            codeExamples: mcp.codeExamples,
          }));
        } else {
          // Handle single MCP object
          const formattedMcps: MCP[] = [
            {
              id: mcpData.id || "0",
              title: mcpData.name || "Untitled MCP",
              description: mcpData.description || "No description available",
              usageCount: 0,
              price: 3,
              owner: mcpData.owner || "0xCd5202548Ee775FfDB3450A4EcFd1BcC05C88CB7",
              approved: mcpData.approved || false,
              active: mcpData.active || false,
              apiEndpoints: mcpData.apiEndpoints || ["https://f1uyuh74gnj0c7-8000.proxy.runpod.net"],
              codeExamples: {},
              tags: [],
              icon: "",
              category: "",
              revenue: 0,
            },
          ];
          console.log("[DEBUG] formattedMcps", formattedMcps);
        }

        setMcps(formattedMcps);
        setPendingMcps(formattedMcps.filter((mcp) => !mcp.approved));
      } catch (mcpError) {
        console.error("Error loading MCPs from contract:", mcpError);
        // Set empty array if there's an error
        setMcps([]);
        setPendingMcps([]);
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

  // mcpPool이 없을 때 초기화
  useEffect(() => {
    initializeMcpPool();
    loadMcps();
  }, [account, initializeMcpPool, loadMcps]);

  // Load proposals from the contract
  const loadProposals = async () => {
    if (!sagaDao) return;

    try {
      setLoading(true);
      // This is a placeholder - you'll need to implement the actual contract call
      try {
        const proposalsData = await sagaDao.getProposals();

        const formattedProposals: Proposal[] = proposalsData.map((proposal: any) => ({
          id: proposal.id,
          title: proposal.title,
          description: proposal.description,
          proposer: proposal.proposer,
          startTime: proposal.startTime.toNumber(),
          endTime: proposal.endTime.toNumber(),
          forVotes: parseFloat(formatEther(proposal.forVotes)),
          againstVotes: parseFloat(formatEther(proposal.againstVotes)),
          executed: proposal.executed,
          status: proposal.executed
            ? "executed"
            : proposal.endTime.toNumber() < Math.floor(Date.now() / 1000)
            ? proposal.forVotes.gt(proposal.againstVotes)
              ? "passed"
              : "rejected"
            : "active",
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
      toast({
        title: "Error",
        description: "Failed to load proposals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Approve or reject an MCP
  const handleMcpDecision = async (mcpId: string, approve: boolean) => {
    const poolToUse = mcpPool || newMcpPool;
    if (!poolToUse) return;

    try {
      setLoading(true);

      // Log contract interface to check available functions
      console.log("Contract interface:", poolToUse.interface);

      // Check if the contract has the required function
      const functionName = approve ? "approveMCP" : "rejectMCP";
      const functionFragment = poolToUse.interface.getFunction(functionName);

      if (!functionFragment) {
        throw new Error(`Contract does not have ${functionName} function`);
      }

      console.log(`${functionName} function fragment:`, functionFragment);

      // Call the appropriate contract function
      const tx = await poolToUse[functionName](mcpId);

      // 트랜잭션 진행 중 로딩 표시
      toast({
        title: "Transaction in Progress",
        description: `Please wait while your ${
          approve ? "approval" : "rejection"
        } is being processed...`,
      });

      // 트랜잭션 완료 대기
      await tx.wait();

      // If approved, post to mcp-list API
      if (approve) {
        const mcpToApprove = mcps.find((mcp) => mcp.id === mcpId);
        if (mcpToApprove) {
          try {
            const response = await fetch("/api/mcp-list", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: mcpToApprove.id,
                title: mcpToApprove.title,
                description: mcpToApprove.description,
                price: mcpToApprove.price,
                apiEndpoints: mcpToApprove.apiEndpoints,
                codeExamples: mcpToApprove.codeExamples,
                tags: mcpToApprove.tags,
                icon: mcpToApprove.icon,
                category: mcpToApprove.category,
                usageCount: mcpToApprove.usageCount,
                owner: mcpToApprove.owner,
                approved: true,
                active: true,
                revenue: mcpToApprove.revenue,
              }),
            });

            if (!response.ok) {
              throw new Error("Failed to post to mcp-list API");
            }
          } catch (error) {
            console.error("Error posting to mcp-list API:", error);
            toast({
              title: "Warning",
              description:
                "MCP was approved but failed to post to the marketplace. Please try again later.",
              variant: "destructive",
            });
          }
        }
      }

      // Reset form
      setSelectedMcp(null);
      setApprovalReason("");

      // 승인된 MCP를 목록에서 제거
      if (approve) {
        setMcps((prevMcps) => prevMcps.filter((mcp) => mcp.id !== mcpId));
        setPendingMcps((prevMcps) => prevMcps.filter((mcp) => mcp.id !== mcpId));
      }

      toast({
        title: "Success",
        description: `MCP ${approve ? "approved" : "rejected"} successfully.`,
      });
    } catch (error: any) {
      console.error("Error making MCP decision:", error);

      // 오류 메시지 개선
      let errorMessage = "Failed to make decision. Please try again.";

      if (error.message) {
        if (error.message.includes("missing role") || error.message.includes("revert")) {
          errorMessage =
            "You don't have permission to approve/reject MCPs. Only admins can perform this action.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new proposal
  const handleCreateProposal = async () => {
    const poolToUse = mcpPool || newMcpPool;
    if (!sagaDao || !account || !poolToUse) return;

    try {
      setLoading(true);
      console.log("[DEBUG] account", account);
      console.log("[DEBUG] proposalTitle", newProposal.title);
      console.log("[DEBUG] proposalDescription", newProposal.description);

      // Validate input
      if (!newProposal.title || !newProposal.description) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Create proposal
      const tx = await sagaDao.propose(
        [poolToUse.address], // targets: MCPPool 컨트랙트 주소
        [0], // values: ETH 전송량 (0으로 설정)
        ["0x0000000000000000000000000000000000000000000000000000000000000000"], // calldatas: placeholder for now
        newProposal.description // description: 제안 설명
      );
      await tx.wait();

      // Reset form
      setNewProposal({
        title: "",
        description: "",
        duration: "3",
      });
      setSelectedMcp(null);

      toast({
        title: "Success",
        description: "Proposal created successfully",
      });

      // Reload proposals
      await loadProposals();
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast({
        title: "Error",
        description: "Failed to create proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Vote on a proposal
  const handleVote = async (proposalId: string, support: boolean) => {
    if (!sagaDao) return;

    try {
      setLoading(true);

      // Submit vote to the contract
      const tx = await sagaDao.castVote(proposalId, support);
      await tx.wait();

      // Reload proposals
      await loadProposals();

      toast({
        title: "Success",
        description: `Vote cast ${support ? "for" : "against"} the proposal.`,
      });
    } catch (error) {
      console.error("Error casting vote:", error);
      toast({
        title: "Error",
        description: "Failed to cast vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Execute a passed proposal
  const handleExecuteProposal = async (proposalId: string) => {
    if (!sagaDao) return;

    try {
      setLoading(true);

      // Execute the proposal
      const tx = await sagaDao.executeProposal(proposalId);
      await tx.wait();

      // Reload proposals
      await loadProposals();

      toast({
        title: "Success",
        description: "Proposal executed successfully.",
      });
    } catch (error) {
      console.error("Error executing proposal:", error);
      toast({
        title: "Error",
        description: "Failed to execute proposal. Please try again.",
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
          <Tabs defaultValue="mcp-approval" className="space-y-6">
            <TabsList>
              <TabsTrigger value="mcp-approval">MCP Approval</TabsTrigger>
              <TabsTrigger value="proposals">Proposals</TabsTrigger>
              <TabsTrigger value="create-proposal">Create Proposal</TabsTrigger>
            </TabsList>

            <TabsContent value="mcp-approval" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending MCP Approvals</CardTitle>
                  <CardDescription>
                    Review and approve or reject pending MCP submissions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingMcps.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        No pending MCPs to review.
                      </p>
                    ) : (
                      pendingMcps.map((mcp) => (
                        <Card key={mcp.id} className="overflow-hidden">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>{mcp.title}</CardTitle>
                                <CardDescription>{mcp.description}</CardDescription>
                              </div>
                              <Badge variant="secondary">Pending Approval</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p>
                                <strong>Owner:</strong> {mcp.owner.slice(0, 6)}...
                                {mcp.owner.slice(-4)}
                              </p>
                              <p>
                                <strong>Price:</strong> {mcp.price} SAGA tokens
                              </p>
                              <p>
                                <strong>API Endpoint:</strong> {mcp.apiEndpoints.join(", ")}
                              </p>
                            </div>
                          </CardContent>
                          <CardFooter className="flex flex-col space-y-4">
                            <div className="w-full">
                              <Label htmlFor={`reason-${mcp.id}`}>Decision Reason</Label>
                              <Textarea
                                id={`reason-${mcp.id}`}
                                placeholder="Enter your reason for approval or rejection"
                                value={selectedMcp === mcp ? approvalReason : ""}
                                onChange={(e) => {
                                  setSelectedMcp(mcp);
                                  setApprovalReason(e.target.value);
                                }}
                              />
                            </div>
                            <div className="flex space-x-2 w-full">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleMcpDecision(mcp.id, false)}
                                disabled={loading || !selectedMcp || !approvalReason}
                              >
                                Reject
                              </Button>
                              <Button
                                className="flex-1"
                                onClick={() => handleMcpDecision(mcp.id, true)}
                                disabled={loading || !selectedMcp || !approvalReason}
                              >
                                Approve
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="proposals" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>DAO Proposals</CardTitle>
                  <CardDescription>
                    View and vote on active proposals. Execute passed proposals.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {proposals.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        No proposals available.
                      </p>
                    ) : (
                      proposals.map((proposal) => (
                        <Card key={proposal.id} className="overflow-hidden">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>{proposal.title}</CardTitle>
                                <CardDescription>{proposal.description}</CardDescription>
                              </div>
                              <Badge
                                variant={
                                  proposal.status === "active"
                                    ? "default"
                                    : proposal.status === "passed"
                                    ? "secondary"
                                    : proposal.status === "rejected"
                                    ? "destructive"
                                    : "outline"
                                }
                              >
                                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <p>
                                  <strong>Proposer:</strong> {proposal.proposer.slice(0, 6)}...
                                  {proposal.proposer.slice(-4)}
                                </p>
                                <p>
                                  <strong>Start Time:</strong>{" "}
                                  {new Date(proposal.startTime * 1000).toLocaleString()}
                                </p>
                                <p>
                                  <strong>End Time:</strong>{" "}
                                  {new Date(proposal.endTime * 1000).toLocaleString()}
                                </p>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>For: {proposal.forVotes.toFixed(2)} SAGA</span>
                                  <span>Against: {proposal.againstVotes.toFixed(2)} SAGA</span>
                                </div>
                                <Progress
                                  value={
                                    proposal.forVotes + proposal.againstVotes > 0
                                      ? (proposal.forVotes /
                                          (proposal.forVotes + proposal.againstVotes)) *
                                        100
                                      : 0
                                  }
                                  className="h-2"
                                />
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter>
                            {proposal.status === "active" ? (
                              <div className="flex space-x-2 w-full">
                                <Button
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleVote(proposal.id, false)}
                                  disabled={loading}
                                >
                                  Vote Against
                                </Button>
                                <Button
                                  className="flex-1"
                                  onClick={() => handleVote(proposal.id, true)}
                                  disabled={loading}
                                >
                                  Vote For
                                </Button>
                              </div>
                            ) : proposal.status === "passed" && !proposal.executed ? (
                              <Button
                                className="w-full"
                                onClick={() => handleExecuteProposal(proposal.id)}
                                disabled={loading}
                              >
                                Execute Proposal
                              </Button>
                            ) : null}
                          </CardFooter>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="create-proposal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Proposal</CardTitle>
                  <CardDescription>Create a new proposal for the DAO to vote on.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Proposal Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter proposal title"
                      value={newProposal.title}
                      onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Proposal Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter proposal description"
                      value={newProposal.description}
                      onChange={(e) =>
                        setNewProposal({ ...newProposal, description: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Select MCP to Approve</Label>
                    <div className="grid gap-4">
                      {pendingMcps.map((mcp) => (
                        <Card
                          key={mcp.id}
                          className={`cursor-pointer transition-colors ${
                            selectedMcp?.id === mcp.id ? "border-primary" : ""
                          }`}
                          onClick={() => setSelectedMcp(mcp)}
                        >
                          <CardHeader>
                            <CardTitle className="text-lg">{mcp.title}</CardTitle>
                            <CardDescription>{mcp.description}</CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleCreateProposal}
                    disabled={
                      loading || !newProposal.title || !newProposal.description || !selectedMcp
                    }
                    className="w-full"
                  >
                    {loading ? "Creating..." : "Create Proposal"}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Voting Power</CardTitle>
                  <CardDescription>
                    The amount of SAGA tokens you have staked for voting.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Voting Power</span>
                    <span className="text-2xl font-bold">{votingPower} NEX</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/CodeBlock";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import {
  Layers,
  Play,
  PlusCircle,
  Upload,
  FileUp,
  FileDown,
  RefreshCw,
  CheckCircle,
  XCircle,
  Info,
  FileCode,
  ArrowLeft,
  Download,
  Save,
  Shield,
  Cpu,
  Database,
  Code,
} from "lucide-react";

import mockMcpsData from "@/data/mockMcps.json";

// Types
interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  description?: string;
}

interface Dataset {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
}

interface VerificationMetrics {
  proofValidity: number;
  executionCost: number;
  verificationSpeed: number;
}

interface EvaluationResult {
  testCaseId: string;
  output: string;
  metrics: {
    accuracy: number;
    relevance: number;
    correctness: number;
  };
  verificationMetrics?: VerificationMetrics;
  passed: boolean;
  timestamp: string;
}

interface Results {
  [key: string]: EvaluationResult;
}

// Mock datasets specifically for Upstage Web3 MCP
const upstageDatasets: Dataset[] = [
  {
    id: "web3-verification",
    name: "On-chain Verification Tests",
    description: "Test on-chain verification capabilities and zero-knowledge proof generation",
    testCases: [
      {
        id: "test-1",
        description: "Basic inference with ZK-Proof",
        input:
          "Generate a prompt response with verification: 'Explain how zero-knowledge proofs enhance blockchain privacy'",
        expectedOutput:
          "Response: Zero-knowledge proofs enhance blockchain privacy by allowing one party to prove to another that a statement is true without revealing any additional information beyond the validity of the statement itself. In the context of blockchain, this means transactions can be verified as valid without exposing sensitive details about the sender, receiver, or amount.\n\nVerification Proof: [Valid ZK-Proof Generated]\nTransaction Hash: 0x7a31c11d782dbea8c819414b471934c9786be0c44918185682414624d8c9f171\nVerification Cost: 0.00042 ETH",
      },
      {
        id: "test-2",
        description: "Cross-chain verification",
        input:
          "Verify AI output across Ethereum and Polygon chains for prompt: 'Summarize DeFi market statistics for April 2025'",
        expectedOutput:
          "Cross-chain Verification Results:\n\nEthereum Verification:\n- Proof Hash: 0xae729c3fbd7e60af4bd7825af6a89be8c41c0a34d15ac124f1e0f8228a8e15a3\n- Block: 19,458,234\n- Status: VERIFIED\n\nPolygon Verification:\n- Proof Hash: 0xf5e21c84e93a7bc71dc0b858a6e0957fe5bd03192d4c6dd8614ec733813c69e8\n- Block: 48,392,104\n- Status: VERIFIED\n\nConsensus: VALID (2/2 chains confirm output authenticity)",
      },
      {
        id: "test-3",
        description: "Low-cost verification mode",
        input:
          "Generate hash-only verification proof for: 'Create a market analysis report for Ethereum layer 2 solutions'",
        expectedOutput:
          "Hash-Only Verification Mode:\n\nOutput Hash: 0x5cad9b9f89a78e192d0788b2a9ad5e4bfa5e6e23acb5b5d7425c4ba6f4d2c7e1\nTimestamp: 2025-04-13T15:43:21Z\nVerification Cost: 0.00008 ETH\nChain ID: 1\nSignature: 0x7c39eb092e3db28b1fc7e2acdf58cea49b1d6b8b88b37c957a0fc8935deac70e18",
      },
    ],
  },
  {
    id: "fine-tuning",
    name: "Decentralized Fine-tuning Tests",
    description: "Test decentralized model fine-tuning capabilities",
    testCases: [
      {
        id: "test-4",
        description: "Fine-tuning job initialization",
        input:
          "Initialize fine-tuning job for Solar-10.7B model with smart contract analysis dataset (CID: QmX7ZrQrCdM7VvCgNu5j5H2ZDiS2FXsEJBvkfnWqzPWGb2)",
        expectedOutput:
          "Fine-tuning Job Initialized:\n\nJob ID: ft-78945\nBase Model: upstage-solar-10.7b\nTraining Data CID: QmX7ZrQrCdM7VvCgNu5j5H2ZDiS2FXsEJBvkfnWqzPWGb2\nCompute Provider: decentralized\nEstimated Completion Time: 2025-04-15T16:30:00Z\nNode Distribution: 8 providers across 3 regions\nJob Status: PENDING",
      },
      {
        id: "test-5",
        description: "Fine-tuning progress monitoring",
        input: "Get status of fine-tuning job ft-78945",
        expectedOutput:
          "Fine-tuning Job Status:\n\nJob ID: ft-78945\nStatus: IN_PROGRESS\nCompletion: 43%\nCurrent Epoch: 2/5\nLoss: 0.0728\nValidation Accuracy: 91.2%\nActive Compute Nodes: 8/8\nEstimated Remaining Time: 4 hours 23 minutes\nVerification Hash: 0x8d72c54b91e27f8e4abda91b27f07b3e6aa17a684b231a7b8a6f141f52d3c8f2",
      },
      {
        id: "test-6",
        description: "Fine-tuned model deployment",
        input: "Deploy completed fine-tuned model ft-78945-complete to mainnet",
        expectedOutput:
          "Model Deployment Complete:\n\nModel ID: upstage-solar-10.7b-ft-contract-analyzer\nBase Model: upstage-solar-10.7b\nFine-tuning Job: ft-78945-complete\nVerification Hash: 0xf1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b\nDeployment Status: SUCCESS\nEndpoint: https://api.mcp.dog/v1/upstage-web3/models/upstage-solar-10.7b-ft-contract-analyzer\nPermissions: Public (Read-Only)\nModel Card Published: Yes\nTraining Metrics Published: Yes",
      },
    ],
  },
  {
    id: "multi-chain",
    name: "Multi-chain Integration Tests",
    description: "Test integration with multiple blockchain networks",
    testCases: [
      {
        id: "test-7",
        description: "Cross-chain AI inference",
        input:
          "Run inference on 'Analyze gas price trends on Ethereum vs Arbitrum' and store proofs on both chains",
        expectedOutput:
          "Cross-chain Operation Results:\n\nInference complete on prompt: 'Analyze gas price trends on Ethereum vs Arbitrum'\n\nEthereum Chain:\n- Transaction Hash: 0xd92b38b16b83c86c7d5f6398c0a9d15f6be3de27a3c33d4745ff17e2cb29a8d5\n- Gas Used: 124,532\n- Block Number: 19,458,235\n\nArbitrum Chain:\n- Transaction Hash: 0x64e7c50e35c91e4c4de8fc5868d71985f85382c9c5991c89e10c8e5d71d25683\n- Gas Used: 92,145\n- Block Number: 156,782,341\n\nVerification Status: SYNCHRONIZED\nData Availability: CONFIRMED",
      },
      {
        id: "test-8",
        description: "Multi-chain wallet integration",
        input:
          "Connect wallet 0x742d35Cc6634C0532925a3b844Bc454e4438f44e to AI service and list available chains",
        expectedOutput:
          "Wallet Connected:\n\nAddress: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e\nConnection Status: ACTIVE\n\nAvailable Chains:\n- Ethereum Mainnet (Chain ID: 1) ✓\n- Polygon (Chain ID: 137) ✓\n- Arbitrum One (Chain ID: 42161) ✓\n- Optimism (Chain ID: 10) ✓\n- Base (Chain ID: 8453) ✓\n\nDefault Chain: Ethereum Mainnet\nService Integration: ENABLED\nPermissions: READ_ONLY, VERIFICATION",
      },
      {
        id: "test-9",
        description: "Chain-specific model selection",
        input: "Select optimal model for Solana transaction analysis with on-chain verification",
        expectedOutput:
          "Chain-Specific Model Selection:\n\nChain: Solana\nOptimal Model: upstage-solar-10.7b-solana-specialist\nModel Size: 10.7B parameters\nSpecialization: Solana transaction & program analysis\nVerification Method: Ed25519 signature verification\nCompatibility: High (native Solana program structure awareness)\nLatency: Low (optimized for Solana TPS)\nAccuracy Benchmark: 94.3% on SolTest dataset\nValidation Method: Verified by Solana validators consensus",
      },
    ],
  },
  {
    id: "zkml-verification",
    name: "zkML Advanced Verification",
    description: "Test advanced zero-knowledge machine learning verification features",
    testCases: [
      {
        id: "test-10",
        description: "Full zkML circuit generation",
        input:
          "Generate complete zkML proof circuit for model inference: 'Predict ETH price movement based on on-chain metrics'",
        expectedOutput:
          "zkML Circuit Generation Complete:\n\nCircuit Size: 4.3M constraints\nCompression Ratio: 78.5%\nProof Generation Time: 8.2 seconds\nVerification Time: 0.04 seconds\nHardware Requirements: Standard\nProtocol: Groth16\nTrusted Setup: Not required (uses transparent setup)\nComplete Verification Hash: 0xc7d89f2a3b1e05c6d4e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d\nGas Cost Estimate: 180,000 (0.009 ETH at 50 gwei)\nVerifiability: On-chain & Off-chain",
      },
      {
        id: "test-11",
        description: "Selective disclosure proofs",
        input:
          "Generate selective disclosure proof for prompt: 'Analyze wallet 0x742d35Cc6634C0532925a3b844Bc454e4438f44e for suspicious activities'",
        expectedOutput:
          "Selective Disclosure Proof:\n\nProof Type: Age-based privacy zkSNARK\nInput Privacy: FULL (prompt content hidden)\nOutput Disclosure: PARTIAL\n- Disclosed: Risk assessment score, Category classification\n- Hidden: Detailed rationale, Specific transactions\n\nRisk Score: 12/100 (Low Risk)\nCategory: Standard Usage Pattern\nZero Knowledge Guarantee: The model has analyzed the wallet without revealing specific transactions\nVerifiable Claims:\n1. Wallet age > 1 year ✓\n2. No interaction with flagged contracts ✓\n3. Transaction volume within normal parameters ✓\n\nProof Verification: VALID",
      },
      {
        id: "test-12",
        description: "Composable verifiable inference",
        input:
          "Compose multi-step verifiable inference: 1) Analyze BTC-ETH correlation, 2) Generate price prediction, 3) Verify entire process",
        expectedOutput:
          "Composable Verifiable Inference Complete:\n\nStep 1: BTC-ETH Correlation Analysis\n- Computed Correlation: 0.82 (Strong Positive)\n- Time Range: Last 30 days\n- Data Points: 43,200\n- Step Verification Hash: 0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b\n\nStep 2: Price Prediction Generation\n- BTC Prediction (24h): $83,420 ±2.3%\n- ETH Prediction (24h): $5,890 ±3.1%\n- Confidence Level: 87%\n- Step Verification Hash: 0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c\n\nStep 3: Process Verification\n- Composite Proof Generated: VALID\n- Chain of Inference Integrity: PRESERVED\n- Computation Graph Verified: COMPLETE\n- Root Verification Hash: 0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d\n\nOverall Verification Status: SUCCESSFUL\nOn-chain Transaction: 0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
      },
    ],
  },
];

export default function UpstageWeb3EvaluationPage() {
  const { toast } = useToast();
  const mcpId = "2"; // Upstage Web3 MCP

  // State
  const [mcp, setMcp] = useState<any>(null);
  const [datasets, setDatasets] = useState<Dataset[]>(upstageDatasets);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [results, setResults] = useState<Results>({});
  const [customInput, setCustomInput] = useState<string>("");
  const [customOutput, setCustomOutput] = useState<string>("");
  const [customExpected, setCustomExpected] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("datasets");
  const [newDatasetName, setNewDatasetName] = useState<string>("");
  const [newDatasetDescription, setNewDatasetDescription] = useState<string>("");
  const [newTestCase, setNewTestCase] = useState<Partial<TestCase>>({
    input: "",
    expectedOutput: "",
    description: "",
  });

  // Load MCP data
  useEffect(() => {
    const mcpData = mockMcpsData.mcps.find((m) => m.id === "23"); // ID from mockMcps.json
    if (mcpData) {
      setMcp(mcpData);
    }
  }, []);

  // Handle dataset selection
  const handleSelectDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setTestCases(dataset.testCases);
  };

  // Run evaluation on a single test case
  const runSingleEval = async (testCase: TestCase) => {
    setIsRunning(true);

    // In a real implementation, this would call an API to run the evaluation
    setTimeout(() => {
      // Generate scores between 0.7 and 1.0
      const generateScore = () => 0.7 + Math.random() * 0.3;

      const accuracy = generateScore();
      const relevance = generateScore();
      const correctness = generateScore();

      // Additional metrics for verification (unique to Upstage Web3 MCP)
      const proofValidity = generateScore();
      const executionCost = generateScore() * 0.8; // Lower is better for cost
      const verificationSpeed = generateScore();

      const overallScore =
        (accuracy +
          relevance +
          correctness +
          proofValidity +
          (1 - executionCost) +
          verificationSpeed) /
        6;

      // Create a result
      const result: EvaluationResult = {
        testCaseId: testCase.id,
        output: testCase.expectedOutput
          .split("\n")
          .map((line) => (Math.random() > 0.9 ? `${line} [with minor variation]` : line))
          .join("\n"),
        metrics: {
          accuracy,
          relevance,
          correctness,
        },
        verificationMetrics: {
          proofValidity,
          executionCost,
          verificationSpeed,
        },
        passed: overallScore > 0.8,
        timestamp: new Date().toISOString(),
      };

      // Update results
      setResults((prev) => ({
        ...prev,
        [testCase.id]: result,
      }));

      setIsRunning(false);
    }, 1800); // Slightly longer for ZK-proof generation simulation
  };

  // Run evaluation on all test cases in selected dataset
  const runAllEvals = async () => {
    if (!selectedDataset) return;

    setIsRunning(true);

    // Run evaluations sequentially with a small delay
    for (const testCase of selectedDataset.testCases) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await runSingleEval(testCase);
    }

    setIsRunning(false);

    toast({
      title: "Evaluation Complete",
      description: `Completed verification and evaluation on ${selectedDataset.testCases.length} test cases.`,
    });
  };

  // Run custom evaluation
  const runCustomEval = async () => {
    if (!customInput.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please provide a valid input for evaluation.",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);

    // In a real implementation, this would call an API to run the evaluation
    setTimeout(() => {
      // Create a custom output with Web3 verification elements
      if (
        customInput.toLowerCase().includes("verification") ||
        customInput.toLowerCase().includes("proof")
      ) {
        const txHash =
          "0x" +
          Array(64)
            .fill(0)
            .map(() => "0123456789abcdef"[Math.floor(Math.random() * 16)])
            .join("");
        setCustomOutput(
          customExpected ||
            `Generated response with Web3 verification:\n\nResponse: ${
              customInput.length > 30 ? customInput.substring(0, 30) + "..." : customInput
            }\n\nVerification Proof: [Valid ZK-Proof Generated]\nTransaction Hash: ${txHash}\nVerification Status: CONFIRMED\nBlock Number: ${
              19000000 + Math.floor(Math.random() * 1000000)
            }\nChain ID: 1 (Ethereum Mainnet)`
        );
      } else {
        setCustomOutput(
          customExpected ||
            `Standard inference result for prompt: "${customInput}"\n\nGenerated content would appear here. When you provide an expected output, it will be compared to this result.`
        );
      }

      setIsRunning(false);

      toast({
        title: "Custom Evaluation Complete",
        description: "The Upstage model has processed your input with on-chain verification.",
      });
    }, 2000);
  };

  // Save custom test case to dataset
  const saveCustomTestCase = () => {
    if (!selectedDataset) {
      toast({
        title: "No Dataset Selected",
        description: "Please select or create a dataset first.",
        variant: "destructive",
      });
      return;
    }

    if (!customInput.trim() || !customOutput.trim()) {
      toast({
        title: "Incomplete Test Case",
        description: "Both input and output must be provided.",
        variant: "destructive",
      });
      return;
    }

    // Create a new test case
    const newTestCase: TestCase = {
      id: `test-${Date.now()}`,
      input: customInput,
      expectedOutput: customOutput,
      description: "Custom Web3 verification test case",
    };

    // Add to selected dataset
    const updatedDataset = {
      ...selectedDataset,
      testCases: [...selectedDataset.testCases, newTestCase],
    };

    // Update datasets
    setDatasets(datasets.map((d) => (d.id === selectedDataset.id ? updatedDataset : d)));
    setSelectedDataset(updatedDataset);
    setTestCases(updatedDataset.testCases);

    toast({
      title: "Test Case Saved",
      description: "Your Web3 verification test case has been added to the dataset.",
    });

    // Clear custom fields
    setCustomInput("");
    setCustomOutput("");
    setCustomExpected("");
  };

  // Create a new dataset
  const createNewDataset = () => {
    if (!newDatasetName.trim()) {
      toast({
        title: "Invalid Dataset Name",
        description: "Please provide a name for the dataset.",
        variant: "destructive",
      });
      return;
    }

    // Create a new dataset
    const newDataset: Dataset = {
      id: `dataset-${Date.now()}`,
      name: newDatasetName,
      description: newDatasetDescription || "Custom Web3 verification dataset",
      testCases: [],
    };

    // Add to datasets
    setDatasets([...datasets, newDataset]);
    setSelectedDataset(newDataset);
    setTestCases([]);

    toast({
      title: "Dataset Created",
      description: "Your new Web3 verification dataset has been created.",
    });

    // Clear fields
    setNewDatasetName("");
    setNewDatasetDescription("");
  };

  // Add a new test case to selected dataset
  const addTestCase = () => {
    if (!selectedDataset) {
      toast({
        title: "No Dataset Selected",
        description: "Please select or create a dataset first.",
        variant: "destructive",
      });
      return;
    }

    if (!newTestCase.input || !newTestCase.expectedOutput) {
      toast({
        title: "Incomplete Test Case",
        description: "Both input and expected output are required.",
        variant: "destructive",
      });
      return;
    }

    // Create a new test case
    const testCase: TestCase = {
      id: `test-${Date.now()}`,
      input: newTestCase.input,
      expectedOutput: newTestCase.expectedOutput,
      description: newTestCase.description,
    };

    // Add to selected dataset
    const updatedDataset = {
      ...selectedDataset,
      testCases: [...selectedDataset.testCases, testCase],
    };

    // Update datasets
    setDatasets(datasets.map((d) => (d.id === selectedDataset.id ? updatedDataset : d)));
    setSelectedDataset(updatedDataset);
    setTestCases(updatedDataset.testCases);

    toast({
      title: "Test Case Added",
      description: "Your test case has been added to the dataset.",
    });

    // Clear fields
    setNewTestCase({
      input: "",
      expectedOutput: "",
      description: "",
    });
  };

  // Export dataset to JSON
  const exportDataset = () => {
    if (!selectedDataset) return;

    const dataStr = JSON.stringify(selectedDataset, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportLink = document.createElement("a");
    exportLink.setAttribute("href", dataUri);
    exportLink.setAttribute(
      "download",
      `${selectedDataset.name.toLowerCase().replace(/\s+/g, "-")}.json`
    );
    document.body.appendChild(exportLink);
    exportLink.click();
    document.body.removeChild(exportLink);

    toast({
      title: "Dataset Exported",
      description: "Your Web3 verification dataset has been exported as JSON.",
    });
  };

  // Calculate overall success rate
  const calculateSuccessRate = () => {
    if (!selectedDataset) return 0;

    const resultsForDataset = selectedDataset.testCases
      .filter((tc) => results[tc.id])
      .map((tc) => results[tc.id]);

    if (resultsForDataset.length === 0) return 0;

    const passedCount = resultsForDataset.filter((r) => r.passed).length;
    return (passedCount / resultsForDataset.length) * 100;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getMetricValue = (
    testCase: TestCase | undefined,
    metricName: keyof VerificationMetrics
  ): string => {
    if (!testCase) return "N/A%";
    const result = results[testCase.id];
    if (!result?.verificationMetrics?.[metricName]) return "N/A%";
    return `${(result.verificationMetrics[metricName] * 100).toFixed(1)}%`;
  };

  const getMetricValueNumber = (
    testCase: TestCase | undefined,
    metricName: keyof VerificationMetrics
  ): number => {
    if (!testCase) return 0;
    const result = results[testCase.id];
    if (!result?.verificationMetrics?.[metricName]) return 0;
    return result.verificationMetrics[metricName] * 100;
  };

  const getTestCaseMetrics = (testCase: TestCase | undefined): string => {
    if (!testCase) return "N/A%";
    const result = results[testCase.id];
    if (!result?.metrics) return "N/A%";
    return `${(
      ((result.metrics.accuracy + result.metrics.relevance + result.metrics.correctness) / 3) *
      100
    ).toFixed(1)}%`;
  };

  if (!mcp) {
    return <div className="p-8 text-center">Loading Upstage Web3 MCP data...</div>;
  }

  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Link href={`/mcp/${mcpId}`} className="hover:underline inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Upstage Web3 MCP
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-4xl">{mcp.icon}</div>
          <div>
            <h1 className="text-3xl font-bold">{mcp.title} Evaluation</h1>
            <p className="text-muted-foreground mt-1">
              Test on-chain verification and zkML capabilities with standardized evaluations
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="bg-secondary/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Verification Datasets
              </CardTitle>
              <CardDescription>Test cases for on-chain verification</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto">
                {datasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    className={`p-4 border-b cursor-pointer hover:bg-secondary/50 ${
                      selectedDataset?.id === dataset.id ? "bg-secondary/70" : ""
                    }`}
                    onClick={() => handleSelectDataset(dataset)}
                  >
                    <div className="font-medium flex items-center">
                      {dataset.id === "web3-verification" && (
                        <Shield className="h-4 w-4 mr-2 text-primary" />
                      )}
                      {dataset.id === "fine-tuning" && (
                        <Cpu className="h-4 w-4 mr-2 text-primary" />
                      )}
                      {dataset.id === "multi-chain" && (
                        <Database className="h-4 w-4 mr-2 text-primary" />
                      )}
                      {dataset.id === "zkml-verification" && (
                        <Code className="h-4 w-4 mr-2 text-primary" />
                      )}
                      {![
                        "web3-verification",
                        "fine-tuning",
                        "multi-chain",
                        "zkml-verification",
                      ].includes(dataset.id) && <FileCode className="h-4 w-4 mr-2 text-primary" />}
                      {dataset.name}
                    </div>
                    <div className="text-sm text-muted-foreground">{dataset.description}</div>
                    <div className="text-xs mt-1">{dataset.testCases.length} test cases</div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setActiveTab("new-dataset")}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Dataset
              </Button>
              {selectedDataset && (
                <Button variant="outline" size="sm" onClick={exportDataset}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </CardFooter>
          </Card>

          {selectedDataset && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Success Rate</span>
                      <span>{calculateSuccessRate().toFixed(1)}%</span>
                    </div>
                    <Progress value={calculateSuccessRate()} className="h-2" />
                  </div>

                  <div className="text-sm space-y-2">
                    <div className="flex justify-between mb-1">
                      <span>Test Cases</span>
                      <span>{selectedDataset.testCases.length}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Evaluated</span>
                      <span>
                        {selectedDataset.testCases.filter((tc) => results[tc.id]).length} /{" "}
                        {selectedDataset.testCases.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Passed</span>
                      <span>
                        {
                          selectedDataset.testCases.filter(
                            (tc) => results[tc.id] && results[tc.id].passed
                          ).length
                        }
                      </span>
                    </div>

                    {/* ZK-specific metrics - only show if we have results */}
                    {selectedDataset.testCases.some(
                      (tc) => results[tc.id] && results[tc.id].verificationMetrics
                    ) && (
                      <>
                        <div className="border-t mt-3 pt-3">
                          <div className="font-medium mb-2">Verification Metrics</div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Proof Validity</span>
                              <span>
                                {getMetricValue(selectedDataset.testCases[0], "proofValidity")}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Execution Cost</span>
                              <span>
                                {getMetricValue(selectedDataset.testCases[0], "executionCost")}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Verification Speed</span>
                              <span>
                                {getMetricValue(selectedDataset.testCases[0], "verificationSpeed")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={runAllEvals}
                  disabled={isRunning || selectedDataset.testCases.length === 0}
                >
                  {isRunning ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run All Verifications
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="datasets">Verification Tests</TabsTrigger>
              <TabsTrigger value="custom">Custom Verification</TabsTrigger>
              <TabsTrigger value="new-dataset">Create Dataset</TabsTrigger>
              <TabsTrigger value="new-test-case">Add Test Case</TabsTrigger>
            </TabsList>

            {/* Test Cases Tab */}
            <TabsContent value="datasets" className="space-y-4">
              {selectedDataset ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{selectedDataset.name}</h2>
                      <p className="text-muted-foreground">{selectedDataset.description}</p>
                    </div>
                  </div>

                  {testCases.length > 0 ? (
                    testCases.map((testCase) => (
                      <Card key={testCase.id} className="mb-4">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">
                              {testCase.description || `Test Case ${testCase.id}`}
                            </CardTitle>
                            {results[testCase.id] && (
                              <Badge
                                variant={results[testCase.id].passed ? "default" : "destructive"}
                              >
                                {results[testCase.id].passed ? (
                                  <span className="flex items-center">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verified
                                  </span>
                                ) : (
                                  <span className="flex items-center">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Failed
                                  </span>
                                )}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-xs">Input</Label>
                              <div className="p-3 bg-secondary/50 rounded-md whitespace-pre-wrap text-sm">
                                {testCase.input}
                              </div>
                            </div>

                            <div>
                              <Label className="text-xs">Expected Output</Label>
                              <div className="p-3 bg-secondary/50 rounded-md whitespace-pre-wrap text-sm">
                                {testCase.expectedOutput}
                              </div>
                            </div>

                            {results[testCase.id] && (
                              <>
                                <div>
                                  <Label className="text-xs">Actual Output</Label>
                                  <div className="p-3 bg-secondary/50 rounded-md whitespace-pre-wrap text-sm">
                                    {results[testCase.id].output}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <Label className="text-xs">Output Metrics</Label>
                                    <div className="space-y-2 mt-1">
                                      <div>
                                        <div className="text-xs flex justify-between">
                                          <span>Accuracy</span>
                                          <span>
                                            {(results[testCase.id].metrics.accuracy * 100).toFixed(
                                              1
                                            )}
                                            %
                                          </span>
                                        </div>
                                        <Progress
                                          value={results[testCase.id].metrics.accuracy * 100}
                                          className="h-1"
                                        />
                                      </div>
                                      <div>
                                        <div className="text-xs flex justify-between">
                                          <span>Relevance</span>
                                          <span>
                                            {(results[testCase.id].metrics.relevance * 100).toFixed(
                                              1
                                            )}
                                            %
                                          </span>
                                        </div>
                                        <Progress
                                          value={results[testCase.id].metrics.relevance * 100}
                                          className="h-1"
                                        />
                                      </div>
                                      <div>
                                        <div className="text-xs flex justify-between">
                                          <span>Correctness</span>
                                          <span>
                                            {(
                                              results[testCase.id].metrics.correctness * 100
                                            ).toFixed(1)}
                                            %
                                          </span>
                                        </div>
                                        <Progress
                                          value={results[testCase.id].metrics.correctness * 100}
                                          className="h-1"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {results[testCase.id].verificationMetrics && (
                                    <div>
                                      <Label className="text-xs">Verification Metrics</Label>
                                      <div className="space-y-2 mt-1">
                                        <div>
                                          <div className="text-xs flex justify-between">
                                            <span>Proof Validity</span>
                                            <span>{getMetricValue(testCase, "proofValidity")}</span>
                                          </div>
                                          <Progress
                                            value={getMetricValueNumber(testCase, "proofValidity")}
                                            className="h-1"
                                          />
                                        </div>
                                        <div>
                                          <div className="text-xs flex justify-between">
                                            <span>Execution Cost</span>
                                            <span>{getMetricValue(testCase, "executionCost")}</span>
                                          </div>
                                          <Progress
                                            value={getMetricValueNumber(testCase, "executionCost")}
                                            className="h-1"
                                          />
                                        </div>
                                        <div>
                                          <div className="text-xs flex justify-between">
                                            <span>Verification Speed</span>
                                            <span>
                                              {getMetricValue(testCase, "verificationSpeed")}
                                            </span>
                                          </div>
                                          <Progress
                                            value={getMetricValueNumber(
                                              testCase,
                                              "verificationSpeed"
                                            )}
                                            className="h-1"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="text-xs text-muted-foreground">
                                  Last evaluated: {formatTimestamp(results[testCase.id].timestamp)}
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button
                            onClick={() => runSingleEval(testCase)}
                            disabled={isRunning}
                            size="sm"
                            variant="outline"
                          >
                            {isRunning ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Shield className="h-4 w-4 mr-2" />
                            )}
                            Run Verification
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="p-8 text-center border rounded-md">
                      <p className="text-muted-foreground">No test cases in this dataset.</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setActiveTab("new-test-case")}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Test Case
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center border rounded-md">
                  <p className="text-muted-foreground">
                    Select a verification dataset from the sidebar to view test cases.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Custom Evaluation Tab */}
            <TabsContent value="custom" className="space-y-4">
              <Card>
                <CardHeader className="bg-secondary/30 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Custom Verification
                  </CardTitle>
                  <CardDescription>
                    Test the Upstage Web3 MCP with your own inputs and verification requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="custom-input">Input with Verification Parameters</Label>
                    <Textarea
                      id="custom-input"
                      placeholder="Enter your test input and verification parameters here..."
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="min-h-32"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: &quot;Generate a response to &apos;Explain zkML&apos; with zk-proof
                      verification on Ethereum mainnet&quot;
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="custom-expected">
                      Expected Output with Verification Data (Optional)
                    </Label>
                    <Textarea
                      id="custom-expected"
                      placeholder="Enter the expected output including verification data for comparison..."
                      value={customExpected}
                      onChange={(e) => setCustomExpected(e.target.value)}
                      className="min-h-32"
                    />
                  </div>

                  {customOutput && (
                    <div>
                      <Label>Model Output with Verification</Label>
                      <div className="p-4 bg-secondary/50 rounded-md whitespace-pre-wrap min-h-32 text-sm">
                        {customOutput}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex space-x-2">
                    <Button onClick={runCustomEval} disabled={isRunning || !customInput.trim()}>
                      {isRunning ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4 mr-2" />
                      )}
                      Run Verified Inference
                    </Button>
                    {customOutput && (
                      <Button
                        variant="outline"
                        onClick={saveCustomTestCase}
                        disabled={!selectedDataset}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save as Test Case
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Create Dataset Tab */}
            <TabsContent value="new-dataset" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Verification Dataset</CardTitle>
                  <CardDescription>
                    Define a collection of test cases for on-chain verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="dataset-name">Dataset Name</Label>
                    <Input
                      id="dataset-name"
                      placeholder="e.g., Custom Zero-Knowledge Verification Tests"
                      value={newDatasetName}
                      onChange={(e) => setNewDatasetName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dataset-description">Description</Label>
                    <Textarea
                      id="dataset-description"
                      placeholder="Describe the purpose of this verification dataset..."
                      value={newDatasetDescription}
                      onChange={(e) => setNewDatasetDescription(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={createNewDataset} disabled={!newDatasetName.trim()}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Dataset
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Add Test Case Tab */}
            <TabsContent value="new-test-case" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add Verification Test Case</CardTitle>
                  <CardDescription>
                    {selectedDataset
                      ? `Add a verification test case to "${selectedDataset.name}"`
                      : "Select a dataset first to add test cases"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedDataset ? (
                    <>
                      <div>
                        <Label htmlFor="test-description">Description (Optional)</Label>
                        <Input
                          id="test-description"
                          placeholder="e.g., Test cross-chain verification with Ethereum and Polygon"
                          value={newTestCase.description || ""}
                          onChange={(e) =>
                            setNewTestCase({ ...newTestCase, description: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="test-input">Input</Label>
                        <Textarea
                          id="test-input"
                          placeholder="The input with verification parameters to test with..."
                          value={newTestCase.input || ""}
                          onChange={(e) =>
                            setNewTestCase({ ...newTestCase, input: e.target.value })
                          }
                          className="min-h-24"
                        />
                      </div>

                      <div>
                        <Label htmlFor="test-expected">
                          Expected Output with Verification Data
                        </Label>
                        <Textarea
                          id="test-expected"
                          placeholder="The expected output including verification proof data..."
                          value={newTestCase.expectedOutput || ""}
                          onChange={(e) =>
                            setNewTestCase({ ...newTestCase, expectedOutput: e.target.value })
                          }
                          className="min-h-24"
                        />
                      </div>
                    </>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>No Dataset Selected</AlertTitle>
                      <AlertDescription>
                        Please select an existing dataset or create a new one first.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={addTestCase}
                    disabled={!selectedDataset || !newTestCase.input || !newTestCase.expectedOutput}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Test Case
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* API Reference Section */}
      <Card className="mt-8">
        <CardHeader className="bg-secondary/30 border-b">
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Upstage Web3 Verification API Reference
          </CardTitle>
          <CardDescription>
            Programmatically test, verify, and evaluate this MCP using the API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="verify">
            <TabsList className="mb-4">
              <TabsTrigger value="verify">Verification API</TabsTrigger>
              <TabsTrigger value="run">Run Inference</TabsTrigger>
              <TabsTrigger value="analyze">Analyze Results</TabsTrigger>
            </TabsList>

            <TabsContent value="verify">
              <Label className="mb-2 block">Verify AI model outputs with on-chain proof</Label>
              <CodeBlock
                language="javascript"
                code={`// Verify an AI output using the Upstage Web3 MCP API
fetch("https://api.mcp.dog/v1/upstage-web3/verify", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    modelId: "upstage-solar-10.7b",
    prompt: "Explain how zero-knowledge proofs enhance blockchain privacy",
    output: "Zero-knowledge proofs enhance blockchain privacy by allowing...",
    proof: "0x7b2261746861c97a0e00f1c28a9b5c31a8dfcc9d6707f759c74c4b4c42689a1a..."
  })
})
.then(response => response.json())
.then(data => {
  console.log("Verification result:", data.isValid);
  console.log("Verification details:", data.verificationDetails);
})`}
              />
            </TabsContent>

            <TabsContent value="run">
              <Label className="mb-2 block">Run inference with on-chain verification</Label>
              <CodeBlock
                language="javascript"
                code={`// Run inference with on-chain verification
fetch("https://api.mcp.dog/v1/upstage-web3/inference", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    modelId: "upstage-solar-10.7b",
    prompt: "Explain the benefits of zkML for Web3 applications",
    parameters: {
      temperature: 0.7,
      maxTokens: 1000,
      verificationLevel: "zk-proof"  // Options: "none", "hash-only", "zk-proof"
    },
    storeOnChain: true,
    chainId: 1  // Ethereum Mainnet
  })
})
.then(response => response.json())
.then(data => {
  console.log("Model output:", data.result);
  console.log("Verification proof:", data.verificationProof);
  console.log("Transaction hash:", data.transactionHash);
})`}
              />
            </TabsContent>

            <TabsContent value="analyze">
              <Label className="mb-2 block">Analyze verification results</Label>
              <CodeBlock
                language="javascript"
                code={`// Run an automated zkML verification evaluation
fetch("https://api.mcp.dog/v1/upstage-web3/evaluate", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    evaluationConfig: {
      name: "Cross-Chain Verification Tests",
      modelId: "upstage-solar-10.7b",
      verificationLevels: ["hash-only", "zk-proof"],
      targetChains: [1, 137, 42161],  // Ethereum, Polygon, Arbitrum
      metrics: ["proofValidity", "executionCost", "verificationSpeed"]
    },
    testCases: [
      {
        prompt: "Explain zero-knowledge proofs in simple terms",
        parameters: { temperature: 0.7, maxTokens: 500 }
      },
      {
        prompt: "What are the trade-offs between different L2 scaling solutions?",
        parameters: { temperature: 0.7, maxTokens: 800 }
      }
    ]
  })
})
.then(response => response.json())
.then(evaluation => {
  console.log("Evaluation ID:", evaluation.id);
  console.log("Status:", evaluation.status);
  console.log("Detailed metrics:", evaluation.metrics);
})`}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

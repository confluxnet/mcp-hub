"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Activity, BarChart2, Shield, Database, Code, CodeSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { CodeBlock } from "@/components/CodeBlock";
import { InfoIcon } from "lucide-react";
import { Header } from "@/components/header";
import { Aside } from "@/components/aside";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";

// Import mock data
import mockMcpsData from "@/data/mockMcps.json";

// Get MCP data from the mock data
const getMcpData = (id: string) => {
  const mcp = mockMcpsData.mcps.find((mcp) => mcp.id === id);
  if (!mcp) return null;
  return mcp;
};

export default function UpstageWeb3McpPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const mcpId = "23"; // ID for the Upstage Web3 MCP in mockMcps.json
  const mcp = getMcpData(mcpId);

  if (!mcp) {
    return <div>MCP not found</div>;
  }

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
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Marketplace
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl">{mcp.icon}</div>
              <div>
                <h1 className="text-3xl font-bold">{mcp.title}</h1>
                <p className="text-muted-foreground">
                  Seamlessly integrate Upstage AI models with Web3 infrastructure
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {mcp.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Rating</div>
                    <div className="text-2xl font-bold">{mcp.rating}/5.0</div>
                  </div>
                  <Progress value={mcp.rating * 20} className="h-1 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Usage</div>
                    <div className="text-2xl font-bold">{mcp.usageCount.toLocaleString()}</div>
                  </div>
                  <Progress value={75} className="h-1 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Price</div>
                    <div className="text-2xl font-bold">{mcp.price} SAGA</div>
                  </div>
                  <Progress value={mcp.price * 3} className="h-1 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Revenue</div>
                    <div className="text-2xl font-bold">{mcp.revenue.toLocaleString()} SAGA</div>
                  </div>
                  <Progress value={65} className="h-1 mt-2" />
                </CardContent>
              </Card>
            </div>
            <p className="text-muted-foreground mb-6">{mcp.description}</p>
          </div>

          <div className="mb-4">
            <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 mb-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="code">Code Examples</TabsTrigger>
                <TabsTrigger value="api">API Reference</TabsTrigger>
                <TabsTrigger value="usage">Usage Guide</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Upstage Web3 MCP</CardTitle>
                        <CardDescription>
                          Bridging the gap between AI and blockchain with trustless verification
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <p>
                            The Upstage Web3 MCP enables seamless integration between Upstage's advanced AI models 
                            and blockchain applications. By leveraging zero-knowledge proofs and on-chain verification, 
                            this protocol ensures trustworthiness and transparency in AI-powered decentralized applications.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start space-x-3">
                              <Shield className="h-5 w-5 text-primary mt-0.5" />
                              <div>
                                <h3 className="font-medium">Verified AI</h3>
                                <p className="text-sm text-muted-foreground">
                                  Cryptographically verify AI model outputs directly on-chain.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <Database className="h-5 w-5 text-primary mt-0.5" />
                              <div>
                                <h3 className="font-medium">Decentralized Fine-tuning</h3>
                                <p className="text-sm text-muted-foreground">
                                  Fine-tune Upstage models using decentralized computation networks.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <Code className="h-5 w-5 text-primary mt-0.5" />
                              <div>
                                <h3 className="font-medium">Multi-chain Support</h3>
                                <p className="text-sm text-muted-foreground">
                                  Compatible with Ethereum, Polygon, Arbitrum, and other major chains.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <CodeSquare className="h-5 w-5 text-primary mt-0.5" />
                              <div>
                                <h3 className="font-medium">zkML Integration</h3>
                                <p className="text-sm text-muted-foreground">
                                  Cutting-edge zero-knowledge machine learning proof generation.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle>Getting Started</CardTitle>
                        <CardDescription>
                          Quick setup guide for Upstage Web3 MCP
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-start space-x-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-background text-xs font-bold">
                              1
                            </div>
                            <div>
                              <h3 className="font-medium">Install the SDK</h3>
                              <p className="text-sm text-muted-foreground">
                                Install the Upstage Web3 SDK in your project.
                              </p>
                              <CodeBlock language="shell" code="npm install @mcp/upstage-web3" />
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-background text-xs font-bold">
                              2
                            </div>
                            <div>
                              <h3 className="font-medium">Get API Key</h3>
                              <p className="text-sm text-muted-foreground">
                                Obtain an API key from the MCP Marketplace.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-background text-xs font-bold">
                              3
                            </div>
                            <div>
                              <h3 className="font-medium">Configure Client</h3>
                              <p className="text-sm text-muted-foreground">
                                Set up the client with your API key.
                              </p>
                              <CodeBlock language="typescript" code="const client = new UpstageWeb3Client({\n  apiKey: 'your-api-key'\n});" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Features</CardTitle>
                    <CardDescription>
                      Explore the powerful capabilities of the Upstage Web3 MCP
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold">On-chain Verification</h3>
                          <p className="text-muted-foreground">
                            The Upstage Web3 MCP provides cryptographic verification of AI model outputs, enabling 
                            trustless verification of model inference results directly on the blockchain. This ensures 
                            that all participants can verify that AI-generated content has not been tampered with.
                          </p>
                          <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                ✓
                              </div>
                              <span>Zero-knowledge proof generation for model outputs</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                ✓
                              </div>
                              <span>Verifiable inference execution</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                ✓
                              </div>
                              <span>On-chain storage of verification proofs</span>
                            </li>
                          </ul>
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold">Decentralized Fine-tuning</h3>
                          <p className="text-muted-foreground">
                            Fine-tune Upstage models using decentralized computation networks. This feature allows for 
                            collaborative model improvement while maintaining data privacy and reducing centralization risks.
                          </p>
                          <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                ✓
                              </div>
                              <span>Distributed training across compute providers</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                ✓
                              </div>
                              <span>Privacy-preserving training methods</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                ✓
                              </div>
                              <span>Verifiable model updates</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold">Multi-chain Support</h3>
                          <p className="text-muted-foreground">
                            Deploy and use Upstage models across multiple blockchain networks, ensuring maximum 
                            flexibility and interoperability for your decentralized applications.
                          </p>
                          <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                ✓
                              </div>
                              <span>Support for Ethereum, Polygon, Arbitrum, and more</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                ✓
                              </div>
                              <span>Cross-chain verification capabilities</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                ✓
                              </div>
                              <span>Unified API across different networks</span>
                            </li>
                          </ul>
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold">Advanced AI Models</h3>
                          <p className="text-muted-foreground">
                            Access to Upstage's cutting-edge AI models, including Solar and other specialized models 
                            optimized for Web3 applications and blockchain data analysis.
                          </p>
                          <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                ✓
                              </div>
                              <span>Solar 10.7B optimized for blockchain contexts</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                ✓
                              </div>
                              <span>Specialized models for contract analysis</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                ✓
                              </div>
                              <span>On-chain data-aware models</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="code">
                <Card>
                  <CardHeader>
                    <CardTitle>Code Examples</CardTitle>
                    <CardDescription>
                      Examples of how to use {mcp.title} in different programming languages
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="typescript" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                        <TabsTrigger value="python">Python</TabsTrigger>
                        <TabsTrigger value="shell">Shell</TabsTrigger>
                      </TabsList>
                      <TabsContent value="typescript">
                        <CodeBlock language="typescript" code={mcp.codeExamples.typescript} />
                        <div className="mt-6 space-y-4">
                          <h3 className="text-lg font-medium">Additional Examples</h3>
                          <div>
                            <h4 className="font-medium mb-2">Model Fine-tuning</h4>
                            <CodeBlock language="typescript" code={`// Fine-tune an Upstage model with decentralized computation
import { UpstageWeb3Client } from '@mcp/upstage-web3';

const client = new UpstageWeb3Client({
  apiKey: 'your-api-key'
});

// Start a fine-tuning job
const finetuneJob = await client.startFineTuning({
  baseModelId: 'upstage-solar-10.7b',
  trainingDataCID: 'QmX7ZrQrCdM7VvCgNu5j5H2ZDiS2FXsEJBvkfnWqzPWGb2',
  hyperparameters: {
    learningRate: 1e-5,
    epochs: 3,
    batchSize: 8
  },
  computeProvider: 'decentralized'
});

// Check fine-tuning job status
const jobStatus = await client.getFineTuningStatus(finetuneJob.jobId);`} />
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Verification</h4>
                            <CodeBlock language="typescript" code={`// Verify an AI model output
import { UpstageWeb3Client } from '@mcp/upstage-web3';

const client = new UpstageWeb3Client({
  apiKey: 'your-api-key'
});

// Verify a model output
const isValid = await client.verifyOutput({
  modelId: 'upstage-solar-10.7b',
  prompt: 'Explain the benefits of zkML for Web3 applications',
  output: 'zkML (zero-knowledge Machine Learning) provides several benefits for Web3...',
  proof: '0x7b2261746861c97a0e00f1c28a9b5c31a8dfcc9d6707f759c74c4b4c42689a1a...'
});

console.log(\`Output verification result: \${isValid ? 'Valid' : 'Invalid'}\`);`} />
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="python">
                        <CodeBlock language="python" code={mcp.codeExamples.python} />
                        <div className="mt-6 space-y-4">
                          <h3 className="text-lg font-medium">Additional Examples</h3>
                          <div>
                            <h4 className="font-medium mb-2">Model Fine-tuning</h4>
                            <CodeBlock language="python" code={`# Fine-tune an Upstage model with decentralized computation
from upstage_web3_client import UpstageWeb3Client

client = UpstageWeb3Client(api_key='your-api-key')

# Start a fine-tuning job
finetune_job = client.start_fine_tuning(
    base_model_id='upstage-solar-10.7b',
    training_data_cid='QmX7ZrQrCdM7VvCgNu5j5H2ZDiS2FXsEJBvkfnWqzPWGb2',
    hyperparameters={
        'learning_rate': 1e-5,
        'epochs': 3,
        'batch_size': 8
    },
    compute_provider='decentralized'
)

# Check fine-tuning job status
job_status = client.get_fine_tuning_status(finetune_job['job_id'])`} />
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Verification</h4>
                            <CodeBlock language="python" code={`# Verify an AI model output
from upstage_web3_client import UpstageWeb3Client

client = UpstageWeb3Client(api_key='your-api-key')

# Verify a model output
is_valid = client.verify_output(
    model_id='upstage-solar-10.7b',
    prompt='Explain the benefits of zkML for Web3 applications',
    output='zkML (zero-knowledge Machine Learning) provides several benefits for Web3...',
    proof='0x7b2261746861c97a0e00f1c28a9b5c31a8dfcc9d6707f759c74c4b4c42689a1a...'
)

print(f"Output verification result: {'Valid' if is_valid else 'Invalid'}")`} />
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="shell">
                        <CodeBlock language="shell" code={mcp.codeExamples.shell} />
                        <div className="mt-6 space-y-4">
                          <h3 className="text-lg font-medium">Additional Examples</h3>
                          <div>
                            <h4 className="font-medium mb-2">Model Fine-tuning</h4>
                            <CodeBlock language="shell" code={`# Start a fine-tuning job
curl -X POST https://api.mcp.dog/v1/upstage-web3/finetune \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "baseModelId": "upstage-solar-10.7b",
    "trainingDataCID": "QmX7ZrQrCdM7VvCgNu5j5H2ZDiS2FXsEJBvkfnWqzPWGb2",
    "hyperparameters": {
      "learningRate": 1e-5,
      "epochs": 3,
      "batchSize": 8
    },
    "computeProvider": "decentralized"
  }'

# Check fine-tuning job status
curl -X GET https://api.mcp.dog/v1/upstage-web3/finetune/JOB_ID \\
  -H "Authorization: Bearer your-api-key"`} />
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Verification</h4>
                            <CodeBlock language="shell" code={`# Verify an AI model output
curl -X POST https://api.mcp.dog/v1/upstage-web3/verify \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "modelId": "upstage-solar-10.7b",
    "prompt": "Explain the benefits of zkML for Web3 applications",
    "output": "zkML (zero-knowledge Machine Learning) provides several benefits for Web3...",
    "proof": "0x7b2261746861c97a0e00f1c28a9b5c31a8dfcc9d6707f759c74c4b4c42689a1a..."
  }'`} />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="api">
                <Card>
                  <CardHeader>
                    <CardTitle>API Reference</CardTitle>
                    <CardDescription>
                      Detailed information about the {mcp.title} API endpoints
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Base URL</h3>
                        <div className="bg-muted p-4 rounded-md">
                          <code className="text-sm">{mcp.apiEndpoints[0]}</code>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold">Endpoints</h3>
                        
                        <div className="border p-4 rounded-md">
                          <h4 className="text-lg font-medium">Run Inference</h4>
                          <div className="flex items-center mt-1 mb-4">
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded text-sm font-medium mr-2">POST</span>
                            <code className="text-sm">/upstage-web3/inference</code>
                          </div>
                          <p className="text-muted-foreground mb-4">
                            Executes an AI inference using Upstage models with on-chain verification
                          </p>
                          <div className="space-y-4">
                            <div>
                              <h5 className="font-medium">Request Body</h5>
                              <CodeBlock language="json" code={`{
  "modelId": "upstage-solar-10.7b",
  "prompt": "Explain the benefits of zkML for Web3 applications",
  "parameters": {
    "temperature": 0.7,
    "maxTokens": 1000,
    "verificationLevel": "zk-proof"
  },
  "storeOnChain": true,
  "chainId": 1
}`} />
                            </div>
                            <div>
                              <h5 className="font-medium">Response</h5>
                              <CodeBlock language="json" code={`{
  "result": "zkML (zero-knowledge Machine Learning) provides several benefits for Web3 applications...",
  "verificationProof": "0x7b2261746861c97a0e00f1c28a9b5c31a8dfcc9d6707f759c74c4b4c42689a1a...",
  "transactionHash": "0x8f5c3f8b3e0c5e9a7f8b5c7d8e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0"
}`} />
                            </div>
                          </div>
                        </div>
                        
                        <div className="border p-4 rounded-md">
                          <h4 className="text-lg font-medium">Fine-tune Model</h4>
                          <div className="flex items-center mt-1 mb-4">
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded text-sm font-medium mr-2">POST</span>
                            <code className="text-sm">/upstage-web3/finetune</code>
                          </div>
                          <p className="text-muted-foreground mb-4">
                            Starts a fine-tuning job for an Upstage model using decentralized computation
                          </p>
                          <div className="space-y-4">
                            <div>
                              <h5 className="font-medium">Request Body</h5>
                              <CodeBlock language="json" code={`{
  "baseModelId": "upstage-solar-10.7b",
  "trainingDataCID": "QmX7ZrQrCdM7VvCgNu5j5H2ZDiS2FXsEJBvkfnWqzPWGb2",
  "hyperparameters": {
    "learningRate": 1e-5,
    "epochs": 3,
    "batchSize": 8
  },
  "computeProvider": "decentralized"
}`} />
                            </div>
                            <div>
                              <h5 className="font-medium">Response</h5>
                              <CodeBlock language="json" code={`{
  "jobId": "ft-12345",
  "status": "pending",
  "estimatedCompletionTime": "2023-06-15T14:30:00Z",
  "modelId": null
}`} />
                            </div>
                          </div>
                        </div>
                        
                        <div className="border p-4 rounded-md">
                          <h4 className="text-lg font-medium">Verify Output</h4>
                          <div className="flex items-center mt-1 mb-4">
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded text-sm font-medium mr-2">POST</span>
                            <code className="text-sm">/upstage-web3/verify</code>
                          </div>
                          <p className="text-muted-foreground mb-4">
                            Verifies that an AI model output was generated by the claimed model
                          </p>
                          <div className="space-y-4">
                            <div>
                              <h5 className="font-medium">Request Body</h5>
                              <CodeBlock language="json" code={`{
  "modelId": "upstage-solar-10.7b",
  "prompt": "Explain the benefits of zkML for Web3 applications",
  "output": "zkML (zero-knowledge Machine Learning) provides several benefits for Web3...",
  "proof": "0x7b2261746861c97a0e00f1c28a9b5c31a8dfcc9d6707f759c74c4b4c42689a1a..."
}`} />
                            </div>
                            <div>
                              <h5 className="font-medium">Response</h5>
                              <CodeBlock language="json" code={`{
  "isValid": true,
  "verificationDetails": {
    "verifier": "0x1234567890123456789012345678901234567890",
    "timestamp": "2023-06-15T14:30:00Z",
    "chainId": 1,
    "blockNumber": 12345678
  }
}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="usage">
                <Card>
                  <CardHeader>
                    <CardTitle>Usage Guide</CardTitle>
                    <CardDescription>
                      Learn how to use the Upstage Web3 MCP in your applications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Common Use Cases</h3>
                        <p className="text-muted-foreground mb-6">
                          The Upstage Web3 MCP can be used in a variety of Web3 applications that require verified AI capabilities.
                        </p>
                        
                        <div className="space-y-6">
                          <div className="border p-4 rounded-md">
                            <h4 className="text-lg font-medium">Verified AI Content Generation</h4>
                            <p className="text-muted-foreground my-2">
                              Generate AI content with cryptographic proof of its origin, enabling NFT creators, content platforms,
                              and media organizations to verify the source and authenticity of AI-generated content.
                            </p>
                            <div className="mt-4">
                              <CodeBlock language="typescript" code={`// Generate verified AI content for an NFT
const verifiedContent = await client.runInference({
  modelId: 'upstage-solar-10.7b',
  prompt: 'Create a short story about a digital explorer in the metaverse',
  parameters: {
    temperature: 0.8,
    maxTokens: 2000,
    verificationLevel: 'zk-proof'
  },
  storeOnChain: true,
  chainId: 1
});

// Use the verification proof in NFT metadata
const nftMetadata = {
  name: "AI-Generated Metaverse Story",
  description: "A verified AI-generated story about digital exploration",
  content: verifiedContent.result,
  verificationProof: verifiedContent.verificationProof,
  verificationTx: verifiedContent.transactionHash
};`} />
                            </div>
                          </div>
                          
                          <div className="border p-4 rounded-md">
                            <h4 className="text-lg font-medium">On-chain AI Decision-making</h4>
                            <p className="text-muted-foreground my-2">
                              Enable transparent AI-driven decision making for DAOs, DeFi protocols, and other on-chain 
                              governance systems, with full verification capabilities.
                            </p>
                            <div className="mt-4">
                              <CodeBlock language="typescript" code={`// Generate a verified risk assessment for a DeFi protocol
const riskAssessment = await client.runInference({
  modelId: 'upstage-solar-10.7b',
  prompt: \`Analyze the risk profile of the following smart contract:
  
  contract LiquidityPool {
    // Contract code here...
  }\`,
  parameters: {
    temperature: 0.2,
    maxTokens: 1500,
    verificationLevel: 'zk-proof'
  },
  storeOnChain: true,
  chainId: 1
});

// Submit the assessment and proof to the DAO's governance contract
const tx = await daoGovernanceContract.submitAIAssessment(
  riskAssessment.result,
  riskAssessment.verificationProof
);`} />
                            </div>
                          </div>
                          
                          <div className="border p-4 rounded-md">
                            <h4 className="text-lg font-medium">Decentralized Model Training</h4>
                            <p className="text-muted-foreground my-2">
                              Create specialized AI models for Web3 applications by leveraging decentralized computation resources,
                              enabling community-driven model improvements with transparent verification.
                            </p>
                            <div className="mt-4">
                              <CodeBlock language="typescript" code={`// Start a decentralized fine-tuning job for a Web3 domain-specific model
const finetuningJob = await client.startFineTuning({
  baseModelId: 'upstage-solar-10.7b',
  trainingDataCID: 'QmX7ZrQrCdM7VvCgNu5j5H2ZDiS2FXsEJBvkfnWqzPWGb2',
  hyperparameters: {
    learningRate: 1e-5,
    epochs: 3,
    batchSize: 8
  },
  computeProvider: 'decentralized',
  targetDomain: 'smart-contract-analysis'
});

// Monitor job progress
const jobStatus = await client.getFineTuningStatus(finetuningJob.jobId);

// Once complete, use the new model
if (jobStatus.status === 'completed') {
  const newModelId = jobStatus.modelId;
  
  // Use the new model for smart contract analysis
  const analysis = await client.runInference({
    modelId: newModelId,
    prompt: 'Analyze this smart contract for security vulnerabilities...',
    // other parameters
  });
}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Best Practices</h3>
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              1
                            </div>
                            <div>
                              <h4 className="font-medium">Use Appropriate Verification Levels</h4>
                              <p className="text-sm text-muted-foreground">
                                Choose the right verification level based on your security needs. For critical applications,
                                use 'zk-proof' for maximum security. For less critical applications, 'hash-only' might be sufficient.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              2
                            </div>
                            <div>
                              <h4 className="font-medium">Store Verification Proofs</h4>
                              <p className="text-sm text-muted-foreground">
                                Always store verification proofs alongside the AI-generated content in your application.
                                This enables future verification without depending on the MCP service.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              3
                            </div>
                            <div>
                              <h4 className="font-medium">Implement Client-side Verification</h4>
                              <p className="text-sm text-muted-foreground">
                                For enhanced security, implement client-side verification of AI outputs in addition 
                                to relying on the MCP API. This provides an extra layer of security.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              4
                            </div>
                            <div>
                              <h4 className="font-medium">Monitor Gas Costs</h4>
                              <p className="text-sm text-muted-foreground">
                                When storing verification proofs on-chain, be mindful of gas costs. Consider using layer 2
                                solutions like Arbitrum or Polygon for cost-effective storage of verification data.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-between items-center mt-8">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Marketplace
              </Button>
            </Link>
            <Link href={`/mcp/2/evaluation`}>
              <Button className="gap-2">
                <Activity className="h-4 w-4" />
                Evaluate MCP
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
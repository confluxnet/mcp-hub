"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Wallet, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoIcon, ArrowRight } from "lucide-react";
import { notFound, useRouter } from "next/navigation";
import { CodeBlock } from "@/components/CodeBlock";
import { Header } from "@/components/header";
import { Aside } from "@/components/aside";
import { useWallet } from "@/components/providers/SolanaProvider";

// Import mock data
import bundlesData from "@/data/mockStoryProtocolBundles.json";
import mcpsData from "@/data/mockMcps.json";

// Get bundle data from the mock data
const getBundleData = (id: string) => {
  const bundle = bundlesData.bundles.find((bundle) => bundle.id === id);
  if (!bundle) return null;
  return bundle;
};

// Get MCP data by ID
const getMcpData = (id: string) => {
  const mcp = mcpsData.mcps.find((mcp) => mcp.id === id);
  if (!mcp) return null;
  return mcp;
};

export default function BundlePage({ params }: { params: { id: string } }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { isConnected, connecting, connectWallet, openWalletModal } = useWallet();
  const router = useRouter();

  const bundle = getBundleData(params.id);

  if (!bundle) {
    notFound();
  }

  // Get MCPs included in this bundle
  const includedMcps = bundle.mcps.map(id => getMcpData(id)).filter(Boolean);

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

  // If not connected, show connection screen
  if (!isConnected) {
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
          <div className="max-w-md mx-auto mt-12">
            <Card className="border-2 border-dashed p-6">
              <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Wallet className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Connect Your Wallet</h3>
                  <p className="text-muted-foreground">
                    Story Protocol requires a wallet connection to access its features.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2 w-full max-w-xs">
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={openWalletModal}
                    disabled={connecting}
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect Wallet
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="w-full" size="lg" asChild>
                    <Link href="/">
                      Return to Home
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>Your wallet is used to interact with the Story Protocol blockchain</span>
                </div>
              </div>
            </Card>
          </div>
        </main>
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
          <div className="mb-8">
            <Link href="/story-protocol" className="inline-flex items-center text-sm text-muted-foreground mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Story Protocol Bundles
            </Link>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-4xl">{bundle.icon}</span>
              <h1 className="text-3xl font-bold">{bundle.title}</h1>
            </div>
            <p className="text-muted-foreground mb-4">{bundle.description}</p>
            <div className="flex flex-wrap gap-2">
              {bundle.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Price</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${bundle.price}</p>
                <Button className="w-full mt-4" asChild>
                  <Link href={`/story-protocol/${bundle.id}/purchase`}>
                    Purchase Recipe
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating</span>
                    <span className="font-medium">⭐ {bundle.rating}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Uses</span>
                    <span className="font-medium">{bundle.usageCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Revenue</span>
                    <span className="font-medium">${bundle.revenue.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Included MCPs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {includedMcps.map((mcp) => (
                    <Link href={`/mcp/${mcp.id}`} key={mcp.id}>
                      <div className="flex items-center justify-between p-2 hover:bg-accent rounded-md transition-colors">
                        <div className="flex items-center gap-2">
                          <span>{mcp.icon}</span>
                          <span>{mcp.title}</span>
                        </div>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="integration">Integration Steps</TabsTrigger>
              <TabsTrigger value="code">Code Examples</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                  <CardDescription>
                    Learn how to integrate {bundle.title} into your application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium">About Story Protocol Integration</h3>
                        <p className="text-sm text-muted-foreground">
                          Story Protocol provides a comprehensive infrastructure for creators to build, 
                          protect, and monetize their intellectual property on-chain. This bundle 
                          includes multiple tools and APIs that work together to simplify the process of 
                          {bundle.title.toLowerCase().includes("nft") ? " creating and registering NFTs with proper IP protection" : 
                           bundle.title.toLowerCase().includes("licensing") ? " setting up and managing IP licensing and royalties" :
                           bundle.title.toLowerCase().includes("derivative") ? " creating and managing derivative works with proper attribution" : 
                           " integrating with Story Protocol"}. 
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Requirements</h3>
                        <p className="text-sm text-muted-foreground">
                          To use this bundle, you'll need:
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                          <li>A wallet with ETH (for transaction fees)</li>
                          <li>An API key from Story Protocol</li>
                          <li>A Pinata JWT for IPFS storage</li>
                          <li>Node.js v16+ or Python 3.7+ for running the example code</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integration">
              <Card>
                <CardHeader>
                  <CardTitle>Integration Steps</CardTitle>
                  <CardDescription>
                    Step-by-step guide to implementing {bundle.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {bundle.steps.map((step, index) => {
                      const relatedMcp = getMcpData(step.mcpId);
                      return (
                        <div key={index} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center justify-center rounded-full bg-accent w-6 h-6 text-center text-sm">
                              {index + 1}
                            </div>
                            <h3 className="font-medium">{step.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                          {relatedMcp && (
                            <div className="bg-accent/50 p-3 rounded-md">
                              <p className="text-sm mb-2">Using <span className="font-medium">{relatedMcp.title}</span> MCP</p>
                              <Link href={`/mcp/${relatedMcp.id}`}>
                                <Button variant="outline" size="sm" className="w-full">
                                  View MCP Details
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="code">
              <Card>
                <CardHeader>
                  <CardTitle>Code Examples</CardTitle>
                  <CardDescription>
                    Examples of how to use {bundle.title} in different programming languages
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
                      <CodeBlock language="typescript" code={bundle.codeExamples.typescript} />
                    </TabsContent>
                    <TabsContent value="python">
                      <CodeBlock language="python" code={bundle.codeExamples.python} />
                    </TabsContent>
                    <TabsContent value="shell">
                      <CodeBlock language="shell" code={bundle.codeExamples.shell} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, X, BookOpen, Save, Wallet, AlertTriangle, Loader2 } from "lucide-react";
import { Header } from "@/components/header";
import { Aside } from "@/components/aside";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "@/components/CodeBlock";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { storyProtocol } from "@/lib/storyProtocol";
import { useStory } from "@/lib/context/StoryContext";
import { useRouter } from "next/navigation";

// Import mock data
import mcpsData from "@/data/mockMcps.json";
import { useWallet } from "@/hooks/useWallet";

// Add dynamic export configuration
export const dynamic = "force-dynamic";

export default function CreateRecipePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const {
    isConnected,
    walletState: { account },
  } = useWallet();
  const router = useRouter();
  const { client, isInitialized } = useStory();

  // Recipe form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [icon, setIcon] = useState("📚");
  const [price, setPrice] = useState(0);
  const [selectedMcps, setSelectedMcps] = useState<string[]>([]);
  const [steps, setSteps] = useState<{ name: string; description: string; mcpId: string }[]>([
    { name: "", description: "", mcpId: "" },
  ]);
  const [tsCode, setTsCode] = useState("");
  const [pyCode, setPyCode] = useState("");
  const [shellCode, setShellCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter for MCPs
  const [mcpFilter, setMcpFilter] = useState("");

  // Filtered MCPs
  const filteredMcps = mcpsData.mcps.filter(
    (mcp) =>
      mcp.title.toLowerCase().includes(mcpFilter.toLowerCase()) ||
      mcp.description.toLowerCase().includes(mcpFilter.toLowerCase())
  );

  // Get MCP by ID
  const getMcpById = (id: string) => {
    return mcpsData.mcps.find((mcp) => mcp.id === id);
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

  // Wallet connection is now handled by the SolanaProvider

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const toggleMcpSelection = (mcpId: string) => {
    if (selectedMcps.includes(mcpId)) {
      setSelectedMcps(selectedMcps.filter((id) => id !== mcpId));
    } else {
      setSelectedMcps([...selectedMcps, mcpId]);
    }
  };

  const addStep = () => {
    setSteps([...steps, { name: "", description: "", mcpId: "" }]);
  };

  const updateStep = (index: number, field: string, value: string) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = {
      ...updatedSteps[index],
      [field]: value,
    };
    setSteps(updatedSteps);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const updatedSteps = [...steps];
      updatedSteps.splice(index, 1);
      setSteps(updatedSteps);
    }
  };

  const { setTxLoading, setTxHash, setTxName, setCurrentIpId, setLicenseTermsId } = useStory();

  // If wallet disconnects during the process, go back to recipe listing page
  useEffect(() => {
    if (!isConnected) {
      router.push("/story-protocol");
    }
  }, [isConnected, router]);

  const handleSubmit = async () => {
    if (!isConnected || !client) {
      setError("Please connect your wallet to use Story Protocol");
      return;
    }

    setIsSubmitting(true);
    setTxLoading(true);
    setTxName("Registering Recipe as IP Asset");
    setError(null);

    try {
      // Prepare the metadata for the recipe
      const recipeMetadata = {
        title,
        description,
        tags,
        icon,
        steps,
        mcps: selectedMcps,
        codeExamples: {
          typescript: tsCode,
          python: pyCode,
          shell: shellCode,
        },
      };

      // Register the recipe on Story Protocol and list it in the marketplace
      const result = await storyProtocol.createAndRegisterRecipe(client, {
        metadata: recipeMetadata,
        ownerAddress: account as `0x${string}`,
      });

      console.log("Registration result:", result);

      if (result.success) {
        // Store the created IP asset and license terms IDs in context
        setCurrentIpId(result.ipId as `0x${string}`);
        setLicenseTermsId(result.licenseTermsId as string);
        // Set transaction hash to show success notification
        setTxHash(result.ipId as string);
        setTxLoading(false);

        setShowSuccess(true);

        // Reset the form after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
          // Redirect to the recipe page
          router.push(`/story-protocol/${result.ipId}`);
        }, 3000);
      } else {
        console.error("Error in Story Protocol registration:", result.error);
        setError("There was an error registering your recipe. Please try again.");
        setTxLoading(false);
      }
    } catch (error) {
      console.error("Error submitting recipe:", error);
      setError("There was an error registering your recipe. Please try again.");
      setTxLoading(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show connect wallet UI if not connected
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
            <Link
              href="/story-protocol"
              className="inline-flex items-center text-sm text-muted-foreground mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Story Protocol
            </Link>

            <h1 className="text-3xl font-bold mb-6">Create MCP Recipe</h1>
          </div>
        </main>
      </div>
    );
  }

  // Show loading while Story Protocol client initializes
  if (!isInitialized) {
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
            <Link
              href="/story-protocol"
              className="inline-flex items-center text-sm text-muted-foreground mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Story Protocol
            </Link>

            <h1 className="text-3xl font-bold mb-6">Create MCP Recipe</h1>

            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <h3 className="text-xl font-medium">Initializing Story Protocol Client</h3>
                <p className="text-muted-foreground">
                  Please wait while we set up your creation experience...
                </p>
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
        className={`min-h-screen p-6 mt-16 pb-32 transition-all duration-300 ${
          isSidebarOpen ? "md:ml-64" : ""
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link
              href="/story-protocol"
              className="inline-flex items-center text-sm text-muted-foreground mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Story Protocol
            </Link>
            <h1 className="text-3xl font-bold mb-2">Create MCP Recipe</h1>
            <p className="text-muted-foreground">
              Create a recipe that bundles multiple MCPs together with step-by-step instructions.
              Your recipe will be registered as intellectual property on Story Protocol and can be
              sold to others.
            </p>
          </div>

          {showSuccess && (
            <Alert className="mb-6 border-green-500 bg-green-500/10">
              <BookOpen className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                Recipe successfully registered on Story Protocol and listed in the marketplace!
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 border-red-500 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-500">{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="details" className="w-full mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Recipe Details</TabsTrigger>
              <TabsTrigger value="mcps">Select MCPs</TabsTrigger>
              <TabsTrigger value="steps">Integration Steps</TabsTrigger>
              <TabsTrigger value="code">Code Examples</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Recipe Details</CardTitle>
                  <CardDescription>Provide basic information about your MCP recipe</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., NFT Creation & IP Registration Bundle"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what your recipe does and why it's valuable"
                      className="min-h-24"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Input
                      id="icon"
                      placeholder="e.g., 📚 or 🎭 or 📄"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (in USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="e.g., 25"
                      value={price || ""}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="tags"
                        placeholder="e.g., NFT, IP, Blockchain"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTag()}
                      />
                      <Button variant="outline" size="icon" onClick={addTag}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                        </Badge>
                      ))}
                      {tags.length === 0 && (
                        <span className="text-sm text-muted-foreground">No tags added yet</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mcps">
              <Card>
                <CardHeader>
                  <CardTitle>Select MCPs</CardTitle>
                  <CardDescription>Choose which MCPs to include in your recipe</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mcp-filter">Filter MCPs</Label>
                    <Input
                      id="mcp-filter"
                      placeholder="Search by name or description"
                      value={mcpFilter}
                      onChange={(e) => setMcpFilter(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto border rounded-md p-4">
                    {filteredMcps.map((mcp) => (
                      <div
                        key={mcp.id}
                        className={`p-3 rounded-md flex items-start gap-3 mb-2 border ${
                          selectedMcps.includes(mcp.id) ? "border-primary" : "border-border"
                        }`}
                      >
                        <Checkbox
                          checked={selectedMcps.includes(mcp.id)}
                          onChange={() => toggleMcpSelection(mcp.id)}
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={`mcp-${mcp.id}`}
                            className="text-base font-medium cursor-pointer"
                          >
                            <span className="mr-2">{mcp.icon}</span>
                            {mcp.title}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">{mcp.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {mcp.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredMcps.length === 0 && (
                      <div className="text-center p-4 text-muted-foreground">
                        No MCPs found matching your filter
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Selected MCPs ({selectedMcps.length})</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMcps.map((mcpId) => {
                        const mcp = getMcpById(mcpId);
                        return mcp ? (
                          <Badge key={mcpId} className="flex items-center gap-1 py-1.5">
                            <span>{mcp.icon}</span>
                            {mcp.title}
                            <X
                              className="h-3 w-3 cursor-pointer ml-1"
                              onClick={() => toggleMcpSelection(mcpId)}
                            />
                          </Badge>
                        ) : null;
                      })}
                      {selectedMcps.length === 0 && (
                        <span className="text-sm text-muted-foreground">No MCPs selected yet</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="steps">
              <Card>
                <CardHeader>
                  <CardTitle>Integration Steps</CardTitle>
                  <CardDescription>
                    Define the step-by-step process for using your MCP bundle
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {steps.map((step, index) => (
                    <div key={index} className="p-4 border rounded-md space-y-3 relative">
                      <div className="absolute top-3 right-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeStep(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center rounded-full bg-accent w-6 h-6 text-center text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <Input
                          placeholder="Step Name"
                          value={step.name}
                          onChange={(e) => updateStep(index, "name", e.target.value)}
                        />
                      </div>
                      <Textarea
                        placeholder="Step Description"
                        className="min-h-20"
                        value={step.description}
                        onChange={(e) => updateStep(index, "description", e.target.value)}
                      />
                      <div className="space-y-2">
                        <Label htmlFor={`step-mcp-${index}`}>Select MCP for this step</Label>
                        <select
                          id={`step-mcp-${index}`}
                          className="w-full p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          value={step.mcpId}
                          onChange={(e) => updateStep(index, "mcpId", e.target.value)}
                        >
                          <option value="">Select an MCP</option>
                          {selectedMcps.map((mcpId) => {
                            const mcp = getMcpById(mcpId);
                            return mcp ? (
                              <option key={mcpId} value={mcpId}>
                                {mcp.icon} {mcp.title}
                              </option>
                            ) : null;
                          })}
                        </select>
                      </div>
                    </div>
                  ))}
                  <Button onClick={addStep} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="code">
              <Card>
                <CardHeader>
                  <CardTitle>Code Examples</CardTitle>
                  <CardDescription>
                    Provide code examples showing how to use your MCP bundle
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs defaultValue="typescript" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                      <TabsTrigger value="shell">Shell</TabsTrigger>
                    </TabsList>
                    <TabsContent value="typescript">
                      <div className="space-y-2">
                        <Label htmlFor="ts-code">TypeScript Example</Label>
                        <Textarea
                          id="ts-code"
                          placeholder="// TypeScript example code here"
                          className="font-mono min-h-60"
                          value={tsCode}
                          onChange={(e) => setTsCode(e.target.value)}
                        />
                      </div>
                      {tsCode && (
                        <div className="mt-4 border rounded-md overflow-hidden">
                          <div className="bg-accent p-2 text-sm font-medium">Preview</div>
                          <CodeBlock language="typescript" code={tsCode} />
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="python">
                      <div className="space-y-2">
                        <Label htmlFor="py-code">Python Example</Label>
                        <Textarea
                          id="py-code"
                          placeholder="# Python example code here"
                          className="font-mono min-h-60"
                          value={pyCode}
                          onChange={(e) => setPyCode(e.target.value)}
                        />
                      </div>
                      {pyCode && (
                        <div className="mt-4 border rounded-md overflow-hidden">
                          <div className="bg-accent p-2 text-sm font-medium">Preview</div>
                          <CodeBlock language="python" code={pyCode} />
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="shell">
                      <div className="space-y-2">
                        <Label htmlFor="shell-code">Shell Example</Label>
                        <Textarea
                          id="shell-code"
                          placeholder="# Shell example commands here"
                          className="font-mono min-h-60"
                          value={shellCode}
                          onChange={(e) => setShellCode(e.target.value)}
                        />
                      </div>
                      {shellCode && (
                        <div className="mt-4 border rounded-md overflow-hidden">
                          <div className="bg-accent p-2 text-sm font-medium">Preview</div>
                          <CodeBlock language="shell" code={shellCode} />
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="sticky bottom-0 left-0 right-0 p-4 bg-background border-t flex justify-end">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting || !title || !description || selectedMcps.length === 0}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Registering on Story Protocol...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Register Recipe & List for Sale
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

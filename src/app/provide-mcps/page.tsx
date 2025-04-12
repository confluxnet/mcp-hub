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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { submitMcp, getMcps, MCP as ImportedMCPType } from "@/lib/api";

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
  codeExamples?: {
    typescript?: string;
    python?: string;
    shell?: string;
  };
  isFromFirestore?: boolean;
  createdAt?: string;
  updatedAt?: string;
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

// MCP Type for Firestore
interface MCPType {
  title: string;
  description: string;
  price: number;
  apiEndpoints: string[];
  codeExamples?: {
    typescript?: string;
    python?: string;
    shell?: string;
  };
  apiParams?: {
    method: string;
    path: string;
    pathParams: { key: string; type: string; required: boolean }[];
    queryParams: { key: string; type: string; required: boolean }[];
    bodyParams: { key: string; type: string; required: boolean }[];
  };
  owner?: string;
}

// Firestore API functions
const submitMcpToFirestore = async (mcpData: MCPType) => {
  try {
    const response = await fetch("/api/mcps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mcpData),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error submitting MCP:", error);
    return { success: false, error: "Failed to submit MCP" };
  }
};

const getMcpsFromFirestore = async () => {
  try {
    const response = await fetch("/api/mcps");
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching MCPs:", error);
    return { success: false, error: "Failed to fetch MCPs" };
  }
};

export default function ProvideMcps() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mcps, setMcps] = useState<MCP[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [useCase, setUseCase] = useState<string>("");
  const [recommendedMcps, setRecommendedMcps] = useState<MCP[]>([]);
  const [selectedMcp, setSelectedMcp] = useState<MCP>({
    id: "",
    title: "",
    description: "",
    price: 0,
    apiEndpoints: [],
    codeExamples: {},
    tags: [],
    icon: "",
    category: "",
    usageCount: 0,
    owner: "",
    approved: false,
    active: false,
    revenue: 0,
  });
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [usageStats, setUsageStats] = useState<{ total: number; today: number }>({
    total: 0,
    today: 0,
  });
  const [apiParams, setApiParams] = useState<{
    method: string;
    path: string;
    pathParams: { key: string; type: string; required: boolean }[];
    queryParams: { key: string; type: string; required: boolean }[];
    bodyParams: { key: string; type: string; required: boolean }[];
  }>({
    method: "GET",
    path: "",
    pathParams: [],
    queryParams: [],
    bodyParams: [],
  });
  const [openApiJson, setOpenApiJson] = useState<string>("");
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

  // Load MCPs from the contract and Firestore
  const loadMcps = async () => {
    if (!mcpPool) return;

    try {
      setLoading(true);
      // Get MCPs from the contract
      const mcpsData = await mcpPool.getMCP(0); // Get the first MCP
      console.log("Contract MCPs:", mcpsData);

      // Get MCPs from Firestore
      const firestoreResult = await getMcpsFromFirestore();
      console.log("Firestore MCPs:", firestoreResult);

      if (firestoreResult.success && firestoreResult.mcps) {
        setMcps(firestoreResult.mcps);
      }
    } catch (error) {
      console.error("Error loading MCPs from contract:", error);
      // If contract call fails, try to load from Firestore only
      const firestoreResult = await getMcpsFromFirestore();
      if (firestoreResult.success && firestoreResult.mcps) {
        setMcps(firestoreResult.mcps);
      }
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
      const tx = await mcpPool.registerMCP(
        selectedMcp.title,
        selectedMcp.description,
        selectedMcp.apiEndpoints[0] || "", // Use the first endpoint or empty string
        JSON.stringify(selectedMcp.codeExamples || {}), // Convert code examples to string
        priceInWei
      );
      await tx.wait();

      // Firestore에 MCP 데이터 저장
      const mcpData: MCPType = {
        title: selectedMcp.title,
        description: selectedMcp.description,
        price: selectedMcp.price,
        apiEndpoints: selectedMcp.apiEndpoints,
        codeExamples: selectedMcp.codeExamples,
        apiParams: apiParams,
        owner: account || "anonymous",
      };

      const result = await submitMcpToFirestore(mcpData);

      if (!result.success) {
        console.error("Failed to save MCP to Firestore:", result.error);
        toast({
          title: "Warning",
          description: "MCP submitted to blockchain but failed to save to database",
          variant: "destructive",
        });
      }

      // Reset form
      setSelectedMcp({
        id: "",
        title: "",
        description: "",
        price: 0,
        apiEndpoints: [],
        codeExamples: {},
        tags: [],
        icon: "",
        category: "",
        usageCount: 0,
        owner: "",
        approved: false,
        active: false,
        revenue: 0,
      });
      setApiParams({
        method: "GET",
        path: "",
        pathParams: [],
        queryParams: [],
        bodyParams: [],
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

  // Add a new parameter
  const addParameter = (type: "path" | "query" | "body") => {
    if (type === "path") {
      setApiParams((prev) => ({
        ...prev,
        pathParams: [...prev.pathParams, { key: "", type: "string", required: true }],
      }));
    } else if (type === "query") {
      setApiParams((prev) => ({
        ...prev,
        queryParams: [...prev.queryParams, { key: "", type: "string", required: false }],
      }));
    } else {
      setApiParams((prev) => ({
        ...prev,
        bodyParams: [...prev.bodyParams, { key: "", type: "string", required: false }],
      }));
    }
  };

  // Update a parameter
  const updateParameter = (
    type: "path" | "query" | "body",
    index: number,
    field: string,
    value: any
  ) => {
    if (type === "path") {
      setApiParams((prev) => {
        const newParams = [...prev.pathParams];
        newParams[index] = { ...newParams[index], [field]: value };
        return { ...prev, pathParams: newParams };
      });
    } else if (type === "query") {
      setApiParams((prev) => {
        const newParams = [...prev.queryParams];
        newParams[index] = { ...newParams[index], [field]: value };
        return { ...prev, queryParams: newParams };
      });
    } else {
      setApiParams((prev) => {
        const newParams = [...prev.bodyParams];
        newParams[index] = { ...newParams[index], [field]: value };
        return { ...prev, bodyParams: newParams };
      });
    }
  };

  // Remove a parameter
  const removeParameter = (type: "path" | "query" | "body", index: number) => {
    if (type === "path") {
      setApiParams((prev) => ({
        ...prev,
        pathParams: prev.pathParams.filter((_, i) => i !== index),
      }));
    } else if (type === "query") {
      setApiParams((prev) => ({
        ...prev,
        queryParams: prev.queryParams.filter((_, i) => i !== index),
      }));
    } else {
      setApiParams((prev) => ({
        ...prev,
        bodyParams: prev.bodyParams.filter((_, i) => i !== index),
      }));
    }
  };

  // Generate path from path parameters
  const generatePath = () => {
    let path = apiParams.path;
    apiParams.pathParams.forEach((param) => {
      path = path.replace(`{${param.key}}`, `:${param.key}`);
    });
    return path;
  };

  // Update path when path parameters change
  useEffect(() => {
    const path = generatePath();
    setApiParams((prev) => ({
      ...prev,
      path,
    }));
  }, [apiParams.pathParams]);

  // Handle OpenAPI JSON import
  const handleOpenApiImport = () => {
    try {
      const parsedJson = JSON.parse(openApiJson);

      // Extract API information from OpenAPI JSON
      if (parsedJson.paths) {
        const paths = Object.keys(parsedJson.paths);
        if (paths.length > 0) {
          const firstPath = paths[0];
          const methods = Object.keys(parsedJson.paths[firstPath]);

          if (methods.length > 0) {
            const firstMethod = methods[0];
            const pathInfo = parsedJson.paths[firstPath][firstMethod];

            // Extract path parameters
            const pathParams: { key: string; type: string; required: boolean }[] = [];
            const pathRegex = /{([^}]+)}/g;
            let match;
            while ((match = pathRegex.exec(firstPath)) !== null) {
              const paramName = match[1];
              const paramInfo = pathInfo.parameters?.find(
                (p: any) => p.name === paramName && p.in === "path"
              );
              pathParams.push({
                key: paramName,
                type: paramInfo?.schema?.type || "string",
                required: paramInfo?.required || true,
              });
            }

            // Set method and path
            setApiParams((prev) => ({
              ...prev,
              method: firstMethod.toUpperCase(),
              path: firstPath,
              pathParams,
            }));

            // Extract query parameters
            if (pathInfo.parameters) {
              const queryParams = pathInfo.parameters
                .filter((param: any) => param.in === "query")
                .map((param: any) => ({
                  key: param.name,
                  type: param.schema?.type || "string",
                  required: param.required || false,
                }));

              setApiParams((prev) => ({
                ...prev,
                queryParams,
              }));
            }

            // Extract request body
            if (pathInfo.requestBody?.content?.["application/json"]?.schema?.properties) {
              const bodyParams = Object.entries(
                pathInfo.requestBody.content["application/json"].schema.properties
              ).map(([key, value]: [string, any]) => ({
                key,
                type: value.type || "string",
                required:
                  pathInfo.requestBody.content["application/json"].schema.required?.includes(key) ||
                  false,
              }));

              setApiParams((prev) => ({
                ...prev,
                bodyParams,
              }));
            }

            toast({
              title: "OpenAPI JSON Imported",
              description: "API parameters have been extracted from the OpenAPI JSON.",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error parsing OpenAPI JSON:", error);
      toast({
        title: "Error",
        description: "Failed to parse OpenAPI JSON. Please check the format.",
        variant: "destructive",
      });
    }
  };

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
                      value={selectedMcp.title}
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
                      value={selectedMcp.description}
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
                      value={selectedMcp.price}
                      onChange={handlePriceChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="apiEndpoints" className="text-sm font-medium">
                      API Endpoint
                    </label>
                    <Input
                      id="apiEndpoints"
                      placeholder="Enter API endpoint"
                      value={selectedMcp.apiEndpoints.join(", ")}
                      onChange={handleApiEndpointsChange}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">API Parameters</label>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => addParameter("path")}>
                          Add Path Param
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addParameter("query")}>
                          Add Query Param
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addParameter("body")}>
                          Add Body Param
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">HTTP Method</label>
                      <Select
                        value={apiParams.method}
                        onValueChange={(value) =>
                          setApiParams((prev) => ({ ...prev, method: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select HTTP method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Base Path</label>
                      <Input
                        placeholder="/api/v1/resource"
                        value={apiParams.path}
                        onChange={(e) =>
                          setApiParams((prev) => ({ ...prev, path: e.target.value }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Use {"{paramName}"} to define path parameters, e.g., /api/v1/users/
                        {"{userId}"}
                      </p>
                    </div>

                    {apiParams.pathParams.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Path Parameters</label>
                        <div className="space-y-2">
                          {apiParams.pathParams.map((param, index) => (
                            <div key={`path-${index}`} className="flex items-center space-x-2">
                              <Input
                                placeholder="Parameter name"
                                value={param.key}
                                onChange={(e) =>
                                  updateParameter("path", index, "key", e.target.value)
                                }
                                className="flex-1"
                              />
                              <Select
                                value={param.type}
                                onValueChange={(value) =>
                                  updateParameter("path", index, "type", value)
                                }
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="string">String</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="integer">Integer</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeParameter("path", index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {apiParams.queryParams.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Query Parameters</label>
                        <div className="space-y-2">
                          {apiParams.queryParams.map((param, index) => (
                            <div key={`query-${index}`} className="flex items-center space-x-2">
                              <Input
                                placeholder="Parameter name"
                                value={param.key}
                                onChange={(e) =>
                                  updateParameter("query", index, "key", e.target.value)
                                }
                                className="flex-1"
                              />
                              <Select
                                value={param.type}
                                onValueChange={(value) =>
                                  updateParameter("query", index, "type", value)
                                }
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="string">String</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="boolean">Boolean</SelectItem>
                                  <SelectItem value="integer">Integer</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex items-center space-x-1">
                                <Checkbox
                                  checked={param.required}
                                  onChange={(checked) =>
                                    updateParameter("query", index, "required", checked)
                                  }
                                />
                                <label htmlFor={`query-required-${index}`} className="text-xs">
                                  Required
                                </label>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeParameter("query", index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {apiParams.bodyParams.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Body Parameters</label>
                        <div className="space-y-2">
                          {apiParams.bodyParams.map((param, index) => (
                            <div key={`body-${index}`} className="flex items-center space-x-2">
                              <Input
                                placeholder="Parameter name"
                                value={param.key}
                                onChange={(e) =>
                                  updateParameter("body", index, "key", e.target.value)
                                }
                                className="flex-1"
                              />
                              <Select
                                value={param.type}
                                onValueChange={(value) =>
                                  updateParameter("body", index, "type", value)
                                }
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="string">String</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="boolean">Boolean</SelectItem>
                                  <SelectItem value="integer">Integer</SelectItem>
                                  <SelectItem value="object">Object</SelectItem>
                                  <SelectItem value="array">Array</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex items-center space-x-1">
                                <Checkbox
                                  checked={param.required}
                                  onChange={(checked) =>
                                    updateParameter("body", index, "required", checked)
                                  }
                                />
                                <label htmlFor={`body-required-${index}`} className="text-xs">
                                  Required
                                </label>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeParameter("body", index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                        <span className="text-2xl font-bold">{tokenBalance} NEX</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Available Balance</span>
                        <span className="text-2xl font-bold">{balance} NEX</span>
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

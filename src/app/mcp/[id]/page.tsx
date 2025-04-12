"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { notFound } from "next/navigation";
import { CodeBlock } from "@/components/CodeBlock";
import { InfoIcon } from "lucide-react";

// Import mock data
import mockMcpsData from "@/data/mockMcps.json";

// Get MCP data from the mock data
const getMcpData = (id: string) => {
  const mcp = mockMcpsData.mcps.find((mcp) => mcp.id === id);
  if (!mcp) return null;
  return mcp;
};

export default function McpPage({ params }: { params: { id: string } }) {
  const mcp = getMcpData(params.id);

  if (!mcp) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{mcp.title}</h1>
        <p className="text-muted-foreground mb-4">{mcp.description}</p>
        <div className="flex flex-wrap gap-2">
          {mcp.tags.map((tag, index) => (
            <Badge key={index} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="code">Code Examples</TabsTrigger>
          <TabsTrigger value="api">API Reference</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>
                Learn how to integrate {mcp.title} into your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Getting Started</h3>
                    <p className="text-sm text-muted-foreground">
                      To use {mcp.title}, you'll need to obtain an API key from the MCP Marketplace.
                      Once you have your API key, you can use it to authenticate your requests.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      All API requests must include your API key in the Authorization header:
                    </p>
                    <CodeBlock language="shell" code="Authorization: Bearer your-api-key" />
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
                </TabsContent>
                <TabsContent value="python">
                  <CodeBlock language="python" code={mcp.codeExamples.python} />
                </TabsContent>
                <TabsContent value="shell">
                  <CodeBlock language="shell" code={mcp.codeExamples.shell} />
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
              <div className="space-y-6">
                {mcp.apiEndpoints.map((endpoint, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0">
                    <h3 className="font-medium mb-2">Endpoint: {endpoint}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Base URL for all API requests
                    </p>
                    <div className="bg-muted p-2 rounded-md">
                      <code className="text-sm">{endpoint}</code>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

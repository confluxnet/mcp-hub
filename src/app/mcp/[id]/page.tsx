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

// This will be replaced with actual data fetching
const mockMCPs = {
  "1": {
    id: "1",
    title: "AI Model Context",
    description:
      "Context management for AI models with advanced prompt engineering. This protocol enables seamless integration of AI models with blockchain data, providing a standardized way to handle model contexts and prompts.",
    tags: ["AI", "Web3"],
    codeExamples: {
      typescript: `// Example TypeScript implementation
import { MCPClient } from '@mcp/client';

const client = new MCPClient({
  apiKey: 'your-api-key'
});

const context = await client.createContext({
  model: 'gpt-4',
  parameters: {
    temperature: 0.7,
    maxTokens: 1000
  }
});`,
      python: `# Example Python implementation
from mcp_client import MCPClient

client = MCPClient(api_key='your-api-key')

context = client.create_context(
    model='gpt-4',
    parameters={
        'temperature': 0.7,
        'max_tokens': 1000
    }
)`,
      shell: `# Example Shell implementation
curl -X POST https://api.mcp.dog/v1/contexts \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4",
    "parameters": {
      "temperature": 0.7,
      "max_tokens": 1000
    }
  }'`,
    },
  },
  "2": {
    id: "2",
    title: "Blockchain Data Protocol",
    description:
      "Standardized protocol for blockchain data access and manipulation. This protocol provides a unified interface for interacting with various blockchain networks.",
    tags: ["Blockchain", "DeFi"],
    codeExamples: {
      typescript: `// Example TypeScript implementation
import { BlockchainClient } from '@mcp/blockchain';

const client = new BlockchainClient({
  apiKey: 'your-api-key'
});

const data = await client.getBlockData({
  chain: 'ethereum',
  blockNumber: 12345678
});`,
      python: `# Example Python implementation
from mcp_blockchain import BlockchainClient

client = BlockchainClient(api_key='your-api-key')

data = client.get_block_data(
    chain='ethereum',
    block_number=12345678
)`,
      shell: `# Example Shell implementation
curl -X GET https://api.mcp.dog/v1/blockchain/ethereum/blocks/12345678 \\
  -H "Authorization: Bearer your-api-key"`,
    },
  },
};

export default function MCPDetailPage({ params }: { params: { id: string } }) {
  // Use the id from params to get the correct MCP
  const mcp = mockMCPs[params.id as keyof typeof mockMCPs] || mockMCPs["1"];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to MCPs
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-4xl font-bold">{mcp.title}</h1>
          <p className="text-lg text-muted-foreground mt-2">{mcp.description}</p>
          <div className="flex gap-2 mt-4">
            {mcp.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <Tabs defaultValue="typescript" className="w-full">
          <TabsList>
            <TabsTrigger value="typescript">TypeScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="shell">Shell</TabsTrigger>
          </TabsList>
          <TabsContent value="typescript">
            <Card>
              <CardHeader>
                <CardTitle>TypeScript Implementation</CardTitle>
                <CardDescription>Example code using TypeScript</CardDescription>
              </CardHeader>
              <CardContent className="relative p-0">
                <div className="relative">
                  <CopyButton text={mcp.codeExamples.typescript} />
                  <SyntaxHighlighter
                    language="typescript"
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      borderRadius: "0.5rem",
                      padding: "1rem",
                    }}
                  >
                    {mcp.codeExamples.typescript}
                  </SyntaxHighlighter>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="python">
            <Card>
              <CardHeader>
                <CardTitle>Python Implementation</CardTitle>
                <CardDescription>Example code using Python</CardDescription>
              </CardHeader>
              <CardContent className="relative p-0">
                <div className="relative">
                  <CopyButton text={mcp.codeExamples.python} />
                  <SyntaxHighlighter
                    language="python"
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      borderRadius: "0.5rem",
                      padding: "1rem",
                    }}
                  >
                    {mcp.codeExamples.python}
                  </SyntaxHighlighter>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="shell">
            <Card>
              <CardHeader>
                <CardTitle>Shell Implementation</CardTitle>
                <CardDescription>Example code using cURL</CardDescription>
              </CardHeader>
              <CardContent className="relative p-0">
                <div className="relative">
                  <CopyButton text={mcp.codeExamples.shell} />
                  <SyntaxHighlighter
                    language="bash"
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      borderRadius: "0.5rem",
                      padding: "1rem",
                    }}
                  >
                    {mcp.codeExamples.shell}
                  </SyntaxHighlighter>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

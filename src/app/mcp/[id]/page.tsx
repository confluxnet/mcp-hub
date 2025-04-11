import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// This will be replaced with actual data fetching
const mockMCP = {
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
};

export default function MCPDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold">{mockMCP.title}</h1>
          <p className="text-lg text-muted-foreground mt-2">{mockMCP.description}</p>
          <div className="flex gap-2 mt-4">
            {mockMCP.tags.map((tag) => (
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
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{mockMCP.codeExamples.typescript}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="python">
            <Card>
              <CardHeader>
                <CardTitle>Python Implementation</CardTitle>
                <CardDescription>Example code using Python</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{mockMCP.codeExamples.python}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="shell">
            <Card>
              <CardHeader>
                <CardTitle>Shell Implementation</CardTitle>
                <CardDescription>Example code using cURL</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{mockMCP.codeExamples.shell}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

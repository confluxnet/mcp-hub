import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MCP {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

// This will be replaced with actual data later
const mockMCPs: MCP[] = [
  {
    id: "1",
    title: "AI Model Context",
    description: "Context management for AI models with advanced prompt engineering",
    tags: ["AI", "Web3"],
  },
  {
    id: "2",
    title: "Blockchain Data Protocol",
    description: "Standardized protocol for blockchain data access and manipulation",
    tags: ["Blockchain", "DeFi"],
  },
  {
    id: "3",
    title: "NFT Metadata Handler",
    description: "Protocol for managing and accessing NFT metadata across chains",
    tags: ["NFT", "Web3"],
  },
];

export function MCPList() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {mockMCPs.map((mcp) => (
        <Link href={`/mcp/${mcp.id}`} key={mcp.id}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle>{mcp.title}</CardTitle>
              <CardDescription>{mcp.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {mcp.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";

interface Tag {
  name: string;
  count: number;
}

// This will be replaced with actual data later
const mockTags: Tag[] = [
  { name: "AI", count: 12 },
  { name: "Blockchain", count: 8 },
  { name: "DeFi", count: 15 },
  { name: "NFT", count: 6 },
  { name: "Web3", count: 10 },
];

export function TagFilter() {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Tags</h2>
      <div className="space-y-2">
        {mockTags.map((tag) => (
          <div
            key={tag.name}
            className="flex items-center justify-between p-2 hover:bg-accent rounded-lg cursor-pointer"
          >
            <span>{tag.name}</span>
            <Badge variant="secondary">{tag.count}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

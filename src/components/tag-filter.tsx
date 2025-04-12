import { Badge } from "@/components/ui/badge";

interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  onSelectTag: (tag: string) => void;
}

export function TagFilter({ tags, selectedTags, onSelectTag }: TagFilterProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Tags</h2>
      <div className="space-y-2">
        {tags.map((tag) => (
          <div
            key={tag}
            className={`flex items-center justify-between p-2 hover:bg-accent rounded-lg cursor-pointer ${
              selectedTags.includes(tag) ? "bg-accent" : ""
            }`}
            onClick={() => onSelectTag(tag)}
          >
            <span>{tag}</span>
            <Badge variant={selectedTags.includes(tag) ? "default" : "secondary"}>
              {selectedTags.includes(tag) ? "Selected" : "Select"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

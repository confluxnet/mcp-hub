import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";

export function Search() {
  return (
    <div className="relative max-w-2xl mx-auto">
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input type="search" placeholder="Search MCPs..." className="pl-10 w-full" />
    </div>
  );
}

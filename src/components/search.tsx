import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function Search() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize query from URL params if available
  useEffect(() => {
    if (searchParams) {
      const searchQuery = searchParams.get("q");
      if (searchQuery) {
        setQuery(searchQuery);
      }
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Update URL with search query
    if (searchParams) {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }

      // Update URL without refreshing the page
      router.push(`?${params.toString()}`, { scroll: false });
    }
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="search"
        placeholder="Search MCPs..."
        className="pl-10 w-full"
        value={query}
        onChange={handleChange}
      />
    </div>
  );
}

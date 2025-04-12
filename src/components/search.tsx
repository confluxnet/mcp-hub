import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { HfInference } from "@huggingface/inference";
import { Badge } from "@/components/ui/badge";

// Define a type for the search results
interface SearchResult {
    id: string;
    title: string;
    description: string;
    tags: string[];
    score?: number;
}

export function Search({
    onSearch,
    items = []
}: {
    onSearch?: (query: string, results?: SearchResult[]) => void,
    items?: SearchResult[]
}) {
    const [query, setQuery] = useState<string>("");
    const [isProMode, setIsProMode] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [rankedResults, setRankedResults] = useState<SearchResult[]>([]);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hfInferenceRef = useRef<HfInference | null>(null);

    // Initialize HuggingFace inference client
    useEffect(() => {
        // We'll lazy-initialize the client only when needed
        if (!hfInferenceRef.current && process.env.NEXT_PUBLIC_HF_TOKEN) {
            hfInferenceRef.current = new HfInference(process.env.NEXT_PUBLIC_HF_TOKEN);
        }
    }, []);

    // Standard keyword-based search function
    const performBasicSearch = useCallback((searchQuery: string) => {
        if (!searchQuery.trim() || !items.length) return [];

        const lowercaseQuery = searchQuery.toLowerCase();
        return items.filter(item =>
            item.title.toLowerCase().includes(lowercaseQuery) ||
            item.description.toLowerCase().includes(lowercaseQuery) ||
            item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        );
    }, [items]);

    // Semantic search using HuggingFace models
    const performSemanticSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim() || !items.length) return [];

        try {
            setIsLoading(true);

            // If HF inference isn't available, fall back to basic search
            if (!hfInferenceRef.current) {
                console.warn("HuggingFace inference not available, falling back to basic search");
                return performBasicSearch(searchQuery);
            }

            // First get basic matches to reduce the search space
            const basicMatches = performBasicSearch(searchQuery);
            if (basicMatches.length === 0) return [];

            // Use the cross-encoder model to score each result
            const pairs = basicMatches.map(item => ({
                text_pair: [
                    searchQuery,
                    `${item.title}. ${item.description}. ${item.tags.join(" ")}`
                ]
            }));

            // Call HuggingFace feature-extraction endpoint
            // In production, this would be replaced with a call to your dedicated API
            const scores = await Promise.all(
                pairs.map(async (pair) => {
                    try {
                        // Use wryta-reranker-modernbert directly as a cross-encoder
                        const combinedText = `${pair.text_pair[0]} [SEP] ${pair.text_pair[1]}`;
                        const featureResult = await hfInferenceRef.current!.featureExtraction({
                            model: "wryta/wryta-reranker-modernbert-test",
                            inputs: combinedText
                        });

                        // For cross-encoders, output will be logits we can use directly
                        // We need only the first value for binary relevance scoring
                        if (Array.isArray(featureResult) && featureResult.length > 0) {
                            // Get the first logit, higher means more relevant
                            return featureResult[0];
                        }
                        return 0;
                    } catch (err) {
                        console.error("Error calculating similarity:", err);
                        return 0;
                    }
                })
            );

            // Combine the scores with the original items
            const scoredResults = basicMatches.map((item, idx) => ({
                ...item,
                score: scores[idx] || 0
            }));

            // Sort by score in descending order
            return scoredResults.sort((a, b) => (b.score || 0) - (a.score || 0));
        } catch (error) {
            console.error("Error performing semantic search:", error);
            return performBasicSearch(searchQuery);
        } finally {
            setIsLoading(false);
        }
    }, [items, performBasicSearch]);

    // Handle search input changes with debounce
    const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);

        // Clear any existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Debounce the search operation
        searchTimeoutRef.current = setTimeout(async () => {
            if (!newQuery.trim()) {
                setRankedResults([]);
                if (onSearch) onSearch("", []);
                return;
            }

            let results: SearchResult[];

            if (isProMode) {
                results = await performSemanticSearch(newQuery);
            } else {
                results = performBasicSearch(newQuery);
            }

            setRankedResults(results);
            if (onSearch) onSearch(newQuery, results);
        }, 300);
    }, [isProMode, onSearch, performBasicSearch, performSemanticSearch]);

    // Toggle between basic and pro mode search
    const toggleSearchMode = useCallback(() => {
        setIsProMode(prev => !prev);
        // Rerun search with new mode if there's a query
        if (query.trim()) {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(async () => {
                const results = !isProMode
                    ? await performSemanticSearch(query)
                    : performBasicSearch(query);

                setRankedResults(results);
                if (onSearch) onSearch(query, results);
            }, 100);
        }
    }, [isProMode, onSearch, performBasicSearch, performSemanticSearch, query]);

    return (
        <div className="relative max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        type="search"
                        placeholder={isProMode ? "Power search..." : "Search MCPs..."}
                        className={`pl-10 w-full ${isProMode ? "border-amber-500 focus-visible:ring-amber-500" : ""}`}
                        value={query}
                        onChange={handleSearchInputChange}
                    />
                    {isLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
                        </div>
                    )}
                </div>
                <Button
                    variant={isProMode ? "default" : "outline"}
                    size="icon"
                    onClick={toggleSearchMode}
                    className={`transition-colors duration-200 ${isProMode ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                    title={isProMode ? "Power Mode: Using advanced search" : "Enable Power Search"}
                >
                    <Zap className={`h-4 w-4 ${isProMode ? "text-white" : "text-muted-foreground"}`} />
                </Button>
            </div>

            {isProMode && (
                <Badge variant="outline" className="mt-2 ml-1 text-xs bg-amber-100 text-amber-800 border-amber-300">
                    Power Search Enabled
                </Badge>
            )}
        </div>
    );
}

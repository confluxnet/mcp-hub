"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/header";
import { Aside } from "@/components/aside";
import { TagFilter } from "@/components/tag-filter";
import { Search } from "@/components/search";
import { PlusCircle, Wallet, AlertTriangle, Loader2 } from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

// Import mock data
import bundlesData from "@/data/mockStoryProtocolBundles.json";
import { useWallet } from "@/hooks/useWallet";

// Add dynamic export configuration
export const dynamic = "force-dynamic";

// Create a component that uses useSearchParams
function StoryProtocolContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [bundles, setBundles] = useState(bundlesData.bundles);
  const { isConnected, connectWallet } = useWallet();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Get all unique tags from bundles
  const allTags = Array.from(new Set(bundlesData.bundles.flatMap((bundle) => bundle.tags)));

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

  // Initialize search query from URL params
  useEffect(() => {
    if (searchParams) {
      const query = searchParams.get("q");
      if (query) {
        setSearchQuery(query);
      }
    }
  }, [searchParams]);

  // Filter bundles based on selected tags and search query
  useEffect(() => {
    let filteredBundles = bundlesData.bundles;

    // Filter by tags if any are selected
    if (selectedTags.length > 0) {
      filteredBundles = filteredBundles.filter((bundle) =>
        selectedTags.some((tag) => bundle.tags.includes(tag))
      );
    }

    // Filter by search query if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredBundles = filteredBundles.filter(
        (bundle) =>
          bundle.title.toLowerCase().includes(query) ||
          bundle.description.toLowerCase().includes(query)
      );
    }

    setBundles(filteredBundles);
  }, [selectedTags, searchQuery]);

  const handleTagSelect = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCreateRecipe = () => {
    if (!isConnected) {
      toast({
        title: "Wallet connection required",
        description: "Please connect your wallet to create a recipe",
        variant: "destructive",
      });
      return;
    }
    router.push("/story-protocol/create");
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
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Story Protocol MCP Recipes</h1>
              <p className="text-muted-foreground">
                Curated recipes that bundle multiple MCPs together with step-by-step integration
                guides, registered as IP on Story Protocol.
              </p>
            </div>
            <Button className="mt-4 lg:mt-0" onClick={handleCreateRecipe}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Recipe
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/4 space-y-6 mb-6 lg:mb-0">
              <Card>
                <CardHeader>
                  <CardTitle>Filter Bundles</CardTitle>
                </CardHeader>
                <CardContent>
                  <Search />
                  <div className="mt-4">
                    <TagFilter
                      tags={allTags}
                      selectedTags={selectedTags}
                      onSelectTag={handleTagSelect}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>What are MCP Recipes?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    MCP Recipes are step-by-step guides that combine multiple MCPs to solve specific
                    use cases. Each recipe is registered as intellectual property on Story Protocol,
                    allowing creators to:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                    <li>Bundle existing MCPs into valuable workflows</li>
                    <li>Register their recipes as IP assets</li>
                    <li>Monetize their knowledge through recipe sales</li>
                    <li>Receive royalties when others use their recipes</li>
                  </ul>
                  <div className="flex flex-col space-y-2 mt-4">
                    <Button onClick={handleCreateRecipe}>Create Your Own Recipe</Button>
                    <Button variant="outline" asChild>
                      <Link
                        href="https://www.storyprotocol.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Learn About Story Protocol
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:w-3/4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bundles.map((bundle) => (
                  <Card
                    key={bundle.id}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl">{bundle.icon}</span>
                        <CardTitle>{bundle.title}</CardTitle>
                      </div>
                      <CardDescription>{bundle.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {bundle.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="space-y-1 mb-3">
                          <div className="text-sm font-medium">Integration Steps:</div>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {bundle.steps.map((step, index) => (
                              <li key={index}>{step.name}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span>⭐ {bundle.rating}</span>
                            <span className="mx-1">•</span>
                            <span>{bundle.usageCount.toLocaleString()} uses</span>
                          </div>
                          <div className="font-semibold">${bundle.price}</div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <Button variant="outline" className="w-1/2" asChild>
                        <Link href={`/story-protocol/${bundle.id}`}>Details</Link>
                      </Button>
                      <Button className="w-1/2" asChild>
                        <Link href={`/story-protocol/${bundle.id}/purchase`}>Purchase</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Main component with Suspense boundary
export default function StoryProtocolPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <StoryProtocolContent />
    </Suspense>
  );
}

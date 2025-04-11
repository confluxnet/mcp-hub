"use client";

import React from "react";

import SolanaProvider from "@/components/providers/SolanaProvider";
import { Search } from "@/components/search";
import { MCPList } from "@/components/mcp-list";
import { TagFilter } from "@/components/tag-filter";

export default function Home() {
  return (
    <SolanaProvider>
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">MCP Dog</h1>
            <p className="text-lg text-muted-foreground">
              Discover and integrate Model Context Protocols
            </p>
          </div>

          <Search />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <TagFilter />
            </div>
            <div className="md:col-span-3">
              <MCPList />
            </div>
          </div>
        </div>
      </main>
    </SolanaProvider>
  );
}

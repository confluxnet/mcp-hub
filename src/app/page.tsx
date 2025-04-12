"use client";

import React from "react";

import SolanaProvider from "@/components/providers/SolanaProvider";
import { Search } from "@/components/search";
import { MCPList } from "@/components/mcp-list";
import { TagFilter } from "@/components/tag-filter";
import { MCPMarketplace } from "@/components/MCPMarketplace";

export default function Home() {
  return (
    <SolanaProvider>
      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center mb-8">MCP Marketplace</h1>
          <p className="text-xl text-center text-gray-300 mb-12">
            Discover and use MCPs (Modular Computing Protocols) on the SAGA blockchain
          </p>
          <MCPMarketplace />
        </div>
      </main>
    </SolanaProvider>
  );
}

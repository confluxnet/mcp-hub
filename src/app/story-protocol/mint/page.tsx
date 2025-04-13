"use client";

import { StoryProtocolNFT } from "@/components/StoryProtocolNFT";
import { StoryProvider } from "@/lib/context/StoryContext";

export default function StoryProtocolMintPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Mint NFT with Story Protocol Integration</h1>
      
      <div className="mb-8 max-w-3xl mx-auto text-center">
        <p className="text-lg">
          This page demonstrates how to mint an NFT and automatically register it as 
          intellectual property on Story Protocol. NFTs minted through this interface 
          will have full IP protection, license terms, and royalty configuration.
        </p>
      </div>
      
      <StoryProvider>
        <StoryProtocolNFT />
      </StoryProvider>
      
      <div className="mt-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">How it Works</h2>
        <ol className="list-decimal pl-5 space-y-3">
          <li>
            <strong>NFT Minting</strong>: Creates a new NFT token on the blockchain with your metadata
          </li>
          <li>
            <strong>IP Registration</strong>: Registers the NFT as intellectual property on Story Protocol
          </li>
          <li>
            <strong>License Terms</strong>: Attaches license terms that specify how others can use your IP
          </li>
          <li>
            <strong>Royalty Configuration</strong>: Sets up royalty distribution for any commercial use
          </li>
        </ol>
      </div>
    </div>
  );
}
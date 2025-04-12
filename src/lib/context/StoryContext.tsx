"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
// Mock Story SDK until we can properly install the dependency
interface Story {
  ipAsset: any;
  licenseTerms: any;
  royalties: any;
}

const Story = {
  create: (config: any): Story => ({
    ipAsset: {},
    licenseTerms: {},
    royalties: {}
  })
};
import { Address } from "viem";
import { SPG_NFT_CONTRACT_ADDRESS } from "../utils";

interface StoryContextType {
  client: Story | null;
  setClient: (client: Story | null) => void;
  txLoading: boolean;
  setTxLoading: (loading: boolean) => void;
  txHash: string | null;
  setTxHash: (hash: string | null) => void;
  txName: string;
  setTxName: (name: string) => void;
  currentIpId: Address | null;
  setCurrentIpId: (ipId: Address | null) => void;
  licenseTermsId: string | null;
  setLicenseTermsId: (id: string | null) => void;
  derivativeIpId: Address | null;
  setDerivativeIpId: (ipId: Address | null) => void;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export function StoryProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<Story | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txName, setTxName] = useState("");
  const [currentIpId, setCurrentIpId] = useState<Address | null>(null);
  const [licenseTermsId, setLicenseTermsId] = useState<string | null>(null);
  const [derivativeIpId, setDerivativeIpId] = useState<Address | null>(null);

  return (
    <StoryContext.Provider 
      value={{
        client,
        setClient,
        txLoading,
        setTxLoading,
        txHash,
        setTxHash,
        txName,
        setTxName,
        currentIpId,
        setCurrentIpId,
        licenseTermsId,
        setLicenseTermsId,
        derivativeIpId,
        setDerivativeIpId
      }}
    >
      {children}
    </StoryContext.Provider>
  );
}

export function useStory() {
  const context = useContext(StoryContext);
  if (context === undefined) {
    throw new Error("useStory must be used within a StoryProvider");
  }
  return context;
}

// Initialize Story Protocol client with wallet
export async function initializeStory(walletClient: any, chainId: number): Promise<Story> {
  const chain = chainId;  
  const story = Story.create({
    chain,
    wallet: walletClient,
    options: {
      spgNftContract: SPG_NFT_CONTRACT_ADDRESS
    }
  });
  
  return story;
}
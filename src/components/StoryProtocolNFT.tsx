"use client";

import { useState } from "react";
import { useWallet } from "./providers/SolanaProvider";
import { useStory } from "@/lib/context/StoryContext";
import { useMintNFTWithStoryProtocol } from "@/lib/nft/mintNFT";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";

// Fixed version that properly handles onChange callback
const Checkbox = ({ checked, onChange, label }: { 
  checked: boolean; 
  onChange: (checked: boolean) => void;
  label?: string;
}) => {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="form-checkbox h-4 w-4 text-blue-600"
      />
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
};

export function StoryProtocolNFT() {
  const { isConnected, account, balance, walletName } = useWallet();
  const { isInitialized, txLoading, txHash, sagaBalance, setSagaBalance } = useStory();
  const { mintNFT } = useMintNFTWithStoryProtocol();
  
  // State for NFT metadata
  const [nftName, setNftName] = useState("");
  const [nftDescription, setNftDescription] = useState("");
  const [nftImage, setNftImage] = useState("https://ipfs.io/ipfs/QmVLqM6sWyF9iZfxeAFAaH2DbMaRveWuJrAzwrVL4vFJC8");
  const [attributes, setAttributes] = useState([
    { trait_type: "Category", value: "Recipe" },
    { trait_type: "Type", value: "Original" }
  ]);
  
  // State for balance allocation
  const [allocateBalance, setAllocateBalance] = useState(false);
  const [allocatedAmount, setAllocatedAmount] = useState("0.25");
  
  // Result state
  const [result, setResult] = useState<{
    success?: boolean;
    tokenId?: number;
    ipId?: string;
    error?: string;
  } | null>(null);
  
  const handleMint = async () => {
    if (!isConnected || !account) {
      setResult({ success: false, error: "Wallet not connected" });
      return;
    }
    
    if (!isInitialized) {
      setResult({ success: false, error: "Story Protocol client not initialized" });
      return;
    }
    
    if (!nftName || !nftDescription) {
      setResult({ success: false, error: "Please provide a name and description for the NFT" });
      return;
    }
    
    // Create NFT metadata
    const metadata = {
      name: nftName,
      description: nftDescription,
      image: nftImage,
      attributes: [
        ...attributes,
        // Add allocated balance as an attribute if enabled
        ...(allocateBalance ? [{ trait_type: "StoryBalance", value: allocatedAmount }] : [])
      ]
    };
    
    // Mock IPFS URI (in a real implementation we would upload the metadata to IPFS)
    const mockIpfsUri = `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    try {
      const mintResult = await mintNFT(account, mockIpfsUri, metadata);
      
      // Update Story Protocol balance if allocation is enabled
      if (allocateBalance && mintResult.success) {
        // In a real implementation, this would be a transaction to transfer tokens
        // For now, we'll just update the context balance
        const newBalance = (parseFloat(sagaBalance) - parseFloat(allocatedAmount)).toFixed(2);
        setSagaBalance(newBalance);
      }
      
      setResult({
        success: mintResult.success,
        tokenId: mintResult.tokenId,
        ipId: mintResult.ipId as string,
        error: mintResult.error ? String(mintResult.error) : undefined
      });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
  
  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mint NFT with Story Protocol</span>
          {isInitialized && <Badge variant="outline" className="ml-2 px-2 py-1">Story Protocol Ready</Badge>}
        </CardTitle>
        <CardDescription>
          Create an NFT that is automatically registered as intellectual property
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Wallet and balance information */}
        {isConnected && (
          <div className="bg-muted p-3 rounded-md mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Connected Wallet:</span>
              <span className="text-sm">{walletName} ({account.substring(0, 6)}...{account.substring(account.length - 4)})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Wallet Balance:</span>
              <span className="text-sm">{balance} {walletName === 'Phantom' || walletName === 'Solflare' ? 'SOL' : 'ETH'}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium">Story Protocol Balance:</span>
              <span className="text-sm">{sagaBalance} SAGA</span>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="nft-name">NFT Name</label>
          <Input 
            id="nft-name"
            value={nftName} 
            onChange={(e) => setNftName(e.target.value)} 
            placeholder="Enter NFT name"
            disabled={txLoading}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="nft-description">Description</label>
          <Textarea 
            id="nft-description"
            value={nftDescription} 
            onChange={(e) => setNftDescription(e.target.value)} 
            placeholder="Enter NFT description"
            rows={3}
            disabled={txLoading}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="nft-image">Image URL</label>
          <Input 
            id="nft-image"
            value={nftImage} 
            onChange={(e) => setNftImage(e.target.value)} 
            placeholder="Enter image URL"
            disabled={txLoading}
          />
        </div>
        
        {/* Balance allocation */}
        <div className="border rounded-md p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Checkbox 
              checked={allocateBalance} 
              onChange={setAllocateBalance}
              label="Allocate SAGA tokens to this NFT"
            />
          </div>
          
          {allocateBalance && (
            <div className="flex items-center space-x-2">
              <Input 
                type="number"
                min="0.01"
                step="0.01"
                value={allocatedAmount}
                onChange={(e) => setAllocatedAmount(e.target.value)}
                className="w-24"
                disabled={txLoading}
              />
              <span className="text-sm">SAGA</span>
            </div>
          )}
        </div>
        
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            <AlertDescription>
              {result.success ? (
                <div className="space-y-2">
                  <p>NFT minted successfully!</p>
                  {result.tokenId && <p>Token ID: {result.tokenId}</p>}
                  {result.ipId && <p>IP ID: {result.ipId}</p>}
                  {allocateBalance && <p>{allocatedAmount} SAGA tokens allocated</p>}
                </div>
              ) : (
                <p>Error: {result.error}</p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleMint} 
          disabled={txLoading || !isConnected || !isInitialized}
          className="w-full"
        >
          {txLoading ? "Processing..." : "Mint NFT + Register IP"}
        </Button>
      </CardFooter>
    </Card>
  );
}
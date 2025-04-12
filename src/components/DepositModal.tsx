"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, Wallet, RefreshCw, QrCode, Copy, Check, AlertTriangle } from "lucide-react";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number, token: string) => Promise<void>;
  balance: string;
}

interface TokenOption {
  value: string;
  label: string;
  logo: string;
  rate: number;
  address?: string;
}

const tokenOptions: TokenOption[] = [
  { value: 'saga', label: 'SAGA', logo: '🔮', rate: 1, address: '0x91ba6D970E48E3736c2611B8F11225D55F93bCD17' },
  { value: 'eth', label: 'ETH', logo: '⚡', rate: 0.0005, address: '0x91ba6D970E48E3736c2611B8F11225D55F93bCD17' },
  { value: 'usdc', label: 'USDC', logo: '💵', rate: 1.02, address: '0x91ba6D970E48E3736c2611B8F11225D55F93bCD17' },
  { value: 'sol', label: 'SOL', logo: '☀️', rate: 0.075, address: '83astBRguLMdt2h5U1Tpdq5tjFoJ6noeGwaY3mDLVcri' }
];

export function DepositModal({ isOpen, onClose, onDeposit, balance }: DepositModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<string>('saga');
  const [depositMethod, setDepositMethod] = useState<string>('wallet');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const { toast } = useToast();

  const selectedTokenDetails = tokenOptions.find(t => t.value === selectedToken);
  
  // Calculate estimated MCP credits
  const estimatedCredits = selectedTokenDetails 
    ? parseFloat(amount || '0') / selectedTokenDetails.rate 
    : 0;

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid deposit amount.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onDeposit(parseFloat(amount), selectedToken);
      toast({
        title: "Deposit successful!",
        description: `Successfully deposited ${amount} ${selectedToken.toUpperCase()} to your account.`
      });
      setAmount('');
      onClose();
    } catch (error) {
      console.error("Deposit error:", error);
      toast({
        title: "Deposit failed",
        description: "There was an error processing your deposit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyAddress = async () => {
    if (selectedTokenDetails?.address) {
      await navigator.clipboard.writeText(selectedTokenDetails.address);
      setIsCopied(true);
      toast({
        title: "Address copied",
        description: `${selectedToken.toUpperCase()} deposit address copied to clipboard.`
      });
      
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  const renderWalletDeposit = () => (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You&apos;ll be asked to approve this transaction in your connected wallet.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-20"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 font-medium text-sm">
              {selectedToken.toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Token</Label>
          <RadioGroup 
            value={selectedToken} 
            onValueChange={setSelectedToken}
            className="flex space-x-2"
          >
            {tokenOptions.map(token => (
              <div key={token.value} className="flex items-center">
                <RadioGroupItem value={token.value} id={`token-${token.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`token-${token.value}`}
                  className="flex items-center space-x-2 rounded-md border-2 border-muted bg-transparent px-3 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="text-lg">{token.logo}</span>
                  <span>{token.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
      
      <div className="p-4 bg-secondary/50 rounded-md">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Exchange Rate</span>
          <span>1 {selectedToken.toUpperCase()} = {selectedTokenDetails?.rate} MCP credits</span>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-sm text-muted-foreground">Estimated Credits</span>
          <span className="font-medium">{estimatedCredits.toFixed(2)} MCP</span>
        </div>
      </div>
    </div>
  );

  const renderManualDeposit = () => (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Send your deposit to the address below. Credits will appear in your account after confirmation.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-2">
        <Label>Select Token</Label>
        <RadioGroup 
          value={selectedToken} 
          onValueChange={setSelectedToken}
          className="grid grid-cols-2 gap-2"
        >
          {tokenOptions.map(token => (
            <div key={token.value} className="flex items-center">
              <RadioGroupItem value={token.value} id={`address-token-${token.value}`} className="peer sr-only" />
              <Label
                htmlFor={`address-token-${token.value}`}
                className="flex items-center space-x-2 rounded-md border-2 border-muted bg-transparent px-3 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer w-full"
              >
                <span className="text-lg">{token.logo}</span>
                <span>{token.label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      <div className="space-y-2">
        <Label>Deposit Address</Label>
        <div className="flex">
          <div className="border rounded-l-md p-2 flex-1 font-mono text-sm truncate bg-secondary">
            {selectedTokenDetails?.address}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-l-none"
            onClick={handleCopyAddress}
          >
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* QR Code Placeholder - In a real implementation, generate actual QR code */}
      <div className="flex justify-center py-4">
        <div className="border rounded-md p-4 flex items-center justify-center bg-white" style={{width: 200, height: 200}}>
          <QrCode size={150} />
        </div>
      </div>
      
      <div className="p-4 bg-secondary/50 rounded-md">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Network</span>
          <span>{selectedToken === 'sol' ? 'Solana' : 'Ethereum (ERC-20)'}</span>
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-muted-foreground">Min. Confirmation</span>
          <span>{selectedToken === 'sol' ? '32 blocks (~20s)' : '12 blocks (~3min)'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Deposit Funds</DialogTitle>
          <DialogDescription>
            Add credits to your Agent Explorer account to pay for MCP usage.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 bg-secondary rounded-md mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Current Balance</span>
            <span className="font-semibold">{parseFloat(balance).toFixed(2)} MCP</span>
          </div>
        </div>
        
        <Tabs defaultValue="wallet" onValueChange={setDepositMethod}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="wallet">
              <Wallet className="h-4 w-4 mr-2" />
              Connected Wallet
            </TabsTrigger>
            <TabsTrigger value="manual">
              <QrCode className="h-4 w-4 mr-2" />
              Manual Deposit
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="wallet">
            {renderWalletDeposit()}
          </TabsContent>
          
          <TabsContent value="manual">
            {renderManualDeposit()}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex items-center justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {depositMethod === 'wallet' ? (
            <Button onClick={handleDeposit} disabled={isSubmitting || !amount || parseFloat(amount) <= 0}>
              {isSubmitting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
              Deposit Now
            </Button>
          ) : (
            <Button onClick={onClose} variant="default">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
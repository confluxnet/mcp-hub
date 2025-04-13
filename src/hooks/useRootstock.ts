"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { rootstockTestnetPublicClient } from "@/lib/config/viemConfig";
import { createWalletClient, custom, parseEther, formatEther } from "viem";
import { rootstockTestnet } from "@/lib/config/rootstockChains";
import RootstockDEX from "@/contracts/RootstockDEX.json";
import BitcoinPegBridge from "@/contracts/BitcoinPegBridge.json";

export function useRootstock() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const getWalletClient = useCallback(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      return createWalletClient({
        chain: rootstockTestnet,
        transport: custom(window.ethereum),
      });
    }
    return null;
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      const walletClient = getWalletClient();
      
      if (!walletClient) {
        throw new Error("No wallet provider found. Please install a compatible wallet like MetaMask.");
      }

      // Request accounts access
      const accounts = await walletClient.requestAddresses();
      
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Mock balance for demo
        const balance = BigInt(Math.random() * 1e18);
        
        setBalance(formatEther(balance));

        // Get BTC price
        try {
          // Mock the BTC price as this is a demo
          // In a real implementation, we would read from the contract
          const price = BigInt(65000 * 10**18);
          
          setBtcPrice(Number(price) / 10**18);
        } catch (error) {
          console.error("Failed to get BTC price:", error);
          setBtcPrice(65000); // Fallback price
        }

        toast({
          title: "Wallet Connected",
          description: "Successfully connected to Rootstock Testnet",
        });
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [getWalletClient, toast]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setBalance("0");
    setIsConnected(false);
    toast({
      title: "Wallet Disconnected",
      description: "You have disconnected your wallet",
    });
  }, [toast]);

  const swapRBTCForUSDT = useCallback(async (amount: string) => {
    try {
      setIsLoading(true);
      const walletClient = getWalletClient();
      
      if (!walletClient || !account) {
        throw new Error("Wallet not connected");
      }

      // Mock transaction for demo purposes
      // In a real implementation, we would call the contract
      const hash = "0x" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);

      toast({
        title: "Swap Initiated",
        description: `Swapping ${amount} RBTC for USDT. Transaction: ${hash}`,
      });

      // Mock successful transaction
      // In a real implementation, we would wait for the transaction receipt
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Always succeed in demo
      if (true) {
        toast({
          title: "Swap Completed",
          description: `Successfully swapped ${amount} RBTC for USDT`,
        });
        
        // Mock balance update
        // In a real implementation, we would get the new balance from the blockchain
        const newBalance = BigInt(Math.random() * 1e18);
        
        setBalance(formatEther(newBalance));
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Swap failed:", error);
      toast({
        title: "Swap Failed",
        description: error instanceof Error ? error.message : "Failed to swap tokens",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [account, btcPrice, getWalletClient, toast]);

  const swapUSDTForRBTC = useCallback(async (amount: string) => {
    try {
      setIsLoading(true);
      const walletClient = getWalletClient();
      
      if (!walletClient || !account) {
        throw new Error("Wallet not connected");
      }

      // Mock transaction for demo purposes
      // In a real implementation, we would call the contract
      const hash = "0x" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);

      toast({
        title: "Swap Initiated",
        description: `Swapping ${amount} USDT for RBTC. Transaction: ${hash}`,
      });

      // Mock successful transaction
      // In a real implementation, we would wait for the transaction receipt
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Always succeed in demo
      if (true) {
        toast({
          title: "Swap Completed",
          description: `Successfully swapped ${amount} USDT for RBTC`,
        });
        
        // Mock balance update
        // In a real implementation, we would get the new balance from the blockchain
        const newBalance = BigInt(Math.random() * 1e18);
        
        setBalance(formatEther(newBalance));
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Swap failed:", error);
      toast({
        title: "Swap Failed",
        description: error instanceof Error ? error.message : "Failed to swap tokens",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [account, btcPrice, getWalletClient, toast]);

  const pegOutToBitcoin = useCallback(async (amount: string, btcAddress: string) => {
    try {
      setIsLoading(true);
      const walletClient = getWalletClient();
      
      if (!walletClient || !account) {
        throw new Error("Wallet not connected");
      }

      // Mock transaction for demo purposes
      // In a real implementation, we would call the contract
      const hash = "0x" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);

      toast({
        title: "Bitcoin Peg-out Initiated",
        description: `Sending ${amount} RBTC to Bitcoin address ${btcAddress}. Transaction: ${hash}`,
      });

      // Mock successful transaction
      // In a real implementation, we would wait for the transaction receipt
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Always succeed in demo
      if (true) {
        toast({
          title: "Peg-out Submitted",
          description: `Your peg-out request has been submitted. It will be processed within 24 hours.`,
        });
        
        // Mock balance update
        // In a real implementation, we would get the new balance from the blockchain
        const newBalance = BigInt(Math.random() * 1e18);
        
        setBalance(formatEther(newBalance));
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Peg-out failed:", error);
      toast({
        title: "Peg-out Failed",
        description: error instanceof Error ? error.message : "Failed to initiate Bitcoin peg-out",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [account, getWalletClient, toast]);

  // Update balance periodically when connected
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isConnected && account) {
      intervalId = setInterval(async () => {
        try {
          // Mock balance update for demo
          const balance = BigInt(Math.random() * 1e18);
          
          setBalance(formatEther(balance));
        } catch (error) {
          console.error("Failed to update balance:", error);
        }
      }, 30000); // Update every 30 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isConnected, account]);

  return {
    account,
    balance,
    isConnected,
    btcPrice,
    isLoading,
    connectWallet,
    disconnectWallet,
    swapRBTCForUSDT,
    swapUSDTForRBTC,
    pegOutToBitcoin,
  };
}
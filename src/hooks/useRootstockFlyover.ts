"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { FlyoverService, FlyoverServiceNetwork } from "@/lib/flyover/flyoverService";
// Define our own LiquidityProvider interface
interface LiquidityProvider {
  id: number;
  name: string;
  serviceFeeRate: number;
  serviceFee: bigint;
  active: boolean;
}

// Define types locally to avoid import issues
interface PeginQuote {
  id: string;
  providerId: number;
  amount: bigint;
  commission: bigint;
  estimatedDeliveryTime: number;
}

interface PegoutQuote {
  id: string;
  providerId: number;
  amount: bigint;
  commission: bigint;
  estimatedDeliveryTime: number;
}

interface AcceptedPeginQuote {
  quoteId: string;
  depositAddress: string;
  signature: string;
}

interface AcceptedPegoutQuote {
  quoteId: string;
  signature: string;
}
import { createWalletClient, custom, parseEther, formatEther } from "viem";
import { rootstockTestnet } from "@/lib/config/rootstockChains";
import { rootstockTestnetPublicClient } from "@/lib/config/viemConfig";

// Define the types for our hook state
export interface RootstockFlyoverState {
  isInitialized: boolean;
  isLoadingProviders: boolean;
  isProcessingTransaction: boolean;
  liquidityProviders: LiquidityProvider[];
  selectedProvider: LiquidityProvider | null;
  btcAddress: string;
  btcAmount: string;
  rbtcAmount: string;
  peginQuotes: PeginQuote[];
  pegoutQuotes: PegoutQuote[];
  acceptedPeginQuote: AcceptedPeginQuote | null;
  acceptedPegoutQuote: AcceptedPegoutQuote | null;
  transactions: Array<{
    type: 'pegin' | 'pegout';
    amount: string;
    status: 'pending' | 'completed' | 'failed';
    timestamp: number;
    txHash?: string;
    btcAddress?: string;
  }>;
  error: string | null;
}

export function useRootstockFlyover(network: FlyoverServiceNetwork = 'testnet') {
  const [flyoverService, setFlyoverService] = useState<FlyoverService | null>(null);
  const [walletAccount, setWalletAccount] = useState<string | null>(null);
  const [state, setState] = useState<RootstockFlyoverState>({
    isInitialized: false,
    isLoadingProviders: false,
    isProcessingTransaction: false,
    liquidityProviders: [],
    selectedProvider: null,
    btcAddress: '',
    btcAmount: '',
    rbtcAmount: '',
    peginQuotes: [],
    pegoutQuotes: [],
    acceptedPeginQuote: null,
    acceptedPegoutQuote: null,
    transactions: [],
    error: null,
  });
  const { toast } = useToast();

  // Initialize the Flyover service
  useEffect(() => {
    try {
      const service = new FlyoverService(network);
      setFlyoverService(service);
      setState(prev => ({ ...prev, isInitialized: true }));
    } catch (error) {
      console.error("Failed to initialize Flyover service:", error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : "Failed to initialize Flyover service" 
      }));
    }
  }, [network]);

  // Load liquidity providers
  const loadLiquidityProviders = useCallback(async () => {
    if (!flyoverService) return;

    setState(prev => ({ ...prev, isLoadingProviders: true, error: null }));
    
    try {
      const providers = await flyoverService.getLiquidityProviders();
      setState(prev => ({ 
        ...prev, 
        liquidityProviders: providers, 
        isLoadingProviders: false 
      }));
    } catch (error) {
      console.error("Failed to load liquidity providers:", error);
      setState(prev => ({ 
        ...prev, 
        isLoadingProviders: false, 
        error: error instanceof Error ? error.message : "Failed to load liquidity providers" 
      }));
      toast({
        title: "Error Loading Providers",
        description: error instanceof Error ? error.message : "Failed to load liquidity providers",
        variant: "destructive",
      });
    }
  }, [flyoverService, toast]);

  // Select a liquidity provider
  const selectProvider = useCallback((provider: LiquidityProvider) => {
    if (!flyoverService) return;

    try {
      flyoverService.useLiquidityProvider(provider);
      setState(prev => ({ ...prev, selectedProvider: provider, error: null }));
      toast({
        title: "Provider Selected",
        description: `Selected ${provider.name} as your liquidity provider`,
      });
    } catch (error) {
      console.error("Failed to select liquidity provider:", error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : "Failed to select liquidity provider" 
      }));
      toast({
        title: "Error Selecting Provider",
        description: error instanceof Error ? error.message : "Failed to select liquidity provider",
        variant: "destructive",
      });
    }
  }, [flyoverService, toast]);

  // Get peg-in quotes
  const getPeginQuotes = useCallback(async (amount: string, destinationAddress?: string) => {
    if (!flyoverService || !state.selectedProvider) {
      toast({
        title: "Provider Required",
        description: "Please select a liquidity provider first",
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({ ...prev, isProcessingTransaction: true, error: null }));
    
    try {
      const amountInSatoshis = Math.floor(parseFloat(amount) * 100000000); // Convert BTC to satoshis
      
      const quoteRequest = {
        amount: BigInt(amountInSatoshis),
        destinationAddress: destinationAddress || walletAccount || '',
      };
      
      const quotes = await flyoverService.getPeginQuotes(quoteRequest);
      setState(prev => ({ 
        ...prev, 
        peginQuotes: quotes, 
        btcAmount: amount,
        isProcessingTransaction: false 
      }));
      
      toast({
        title: "Quotes Retrieved",
        description: `Retrieved ${quotes.length} peg-in quotes`,
      });
      
      return quotes;
    } catch (error) {
      console.error("Failed to get peg-in quotes:", error);
      setState(prev => ({ 
        ...prev, 
        isProcessingTransaction: false, 
        error: error instanceof Error ? error.message : "Failed to get peg-in quotes" 
      }));
      toast({
        title: "Error Getting Quotes",
        description: error instanceof Error ? error.message : "Failed to get peg-in quotes",
        variant: "destructive",
      });
    }
  }, [flyoverService, state.selectedProvider, walletAccount, toast]);

  // Accept a peg-in quote
  const acceptPeginQuote = useCallback(async (quote: PeginQuote) => {
    if (!flyoverService) return;

    setState(prev => ({ ...prev, isProcessingTransaction: true, error: null }));
    
    try {
      const acceptedQuote = await flyoverService.acceptPeginQuote(quote);
      setState(prev => ({ 
        ...prev, 
        acceptedPeginQuote: acceptedQuote, 
        btcAddress: acceptedQuote.depositAddress,
        isProcessingTransaction: false,
        transactions: [
          {
            type: 'pegin',
            amount: state.btcAmount,
            status: 'pending',
            timestamp: Date.now(),
            btcAddress: acceptedQuote.depositAddress
          },
          ...prev.transactions
        ]
      }));
      
      toast({
        title: "Quote Accepted",
        description: `Send ${state.btcAmount} BTC to ${acceptedQuote.depositAddress}`,
      });
      
      return acceptedQuote;
    } catch (error) {
      console.error("Failed to accept peg-in quote:", error);
      setState(prev => ({ 
        ...prev, 
        isProcessingTransaction: false, 
        error: error instanceof Error ? error.message : "Failed to accept peg-in quote" 
      }));
      toast({
        title: "Error Accepting Quote",
        description: error instanceof Error ? error.message : "Failed to accept peg-in quote",
        variant: "destructive",
      });
    }
  }, [flyoverService, state.btcAmount, toast]);

  // Get peg-out quotes
  const getPegoutQuotes = useCallback(async (amount: string, btcAddress: string) => {
    if (!flyoverService || !state.selectedProvider) {
      toast({
        title: "Provider Required",
        description: "Please select a liquidity provider first",
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isProcessingTransaction: true, 
      error: null,
      btcAddress: btcAddress
    }));
    
    try {
      const amountInWei = parseEther(amount);
      
      const quoteRequest = {
        amount: amountInWei,
        destinationAddress: btcAddress,
      };
      
      const quotes = await flyoverService.getPegoutQuotes(quoteRequest);
      setState(prev => ({ 
        ...prev, 
        pegoutQuotes: quotes, 
        rbtcAmount: amount,
        isProcessingTransaction: false 
      }));
      
      toast({
        title: "Quotes Retrieved",
        description: `Retrieved ${quotes.length} peg-out quotes`,
      });
      
      return quotes;
    } catch (error) {
      console.error("Failed to get peg-out quotes:", error);
      setState(prev => ({ 
        ...prev, 
        isProcessingTransaction: false, 
        error: error instanceof Error ? error.message : "Failed to get peg-out quotes" 
      }));
      toast({
        title: "Error Getting Quotes",
        description: error instanceof Error ? error.message : "Failed to get peg-out quotes",
        variant: "destructive",
      });
    }
  }, [flyoverService, state.selectedProvider, toast]);

  // Accept a peg-out quote
  const acceptPegoutQuote = useCallback(async (quote: PegoutQuote) => {
    if (!flyoverService) return;

    setState(prev => ({ ...prev, isProcessingTransaction: true, error: null }));
    
    try {
      const acceptedQuote = await flyoverService.acceptPegoutQuote(quote);
      setState(prev => ({ 
        ...prev, 
        acceptedPegoutQuote: acceptedQuote, 
        isProcessingTransaction: false 
      }));
      
      toast({
        title: "Quote Accepted",
        description: "Peg-out quote accepted. Ready to deposit RBTC.",
      });
      
      return acceptedQuote;
    } catch (error) {
      console.error("Failed to accept peg-out quote:", error);
      setState(prev => ({ 
        ...prev, 
        isProcessingTransaction: false, 
        error: error instanceof Error ? error.message : "Failed to accept peg-out quote" 
      }));
      toast({
        title: "Error Accepting Quote",
        description: error instanceof Error ? error.message : "Failed to accept peg-out quote",
        variant: "destructive",
      });
    }
  }, [flyoverService, toast]);

  // Deposit RBTC for peg-out
  const depositPegout = useCallback(async (quote: PegoutQuote, signature: string) => {
    if (!flyoverService || !walletAccount) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({ ...prev, isProcessingTransaction: true, error: null }));
    
    try {
      const total = flyoverService.getQuoteTotal(quote);
      const txHash = await flyoverService.depositPegout(quote, signature, total);
      
      setState(prev => ({ 
        ...prev, 
        isProcessingTransaction: false,
        transactions: [
          {
            type: 'pegout',
            amount: state.rbtcAmount,
            status: 'pending',
            timestamp: Date.now(),
            txHash: txHash,
            btcAddress: state.btcAddress
          },
          ...prev.transactions
        ]
      }));
      
      toast({
        title: "Deposit Successful",
        description: `RBTC deposit initiated. Transaction: ${txHash}`,
      });
      
      return txHash;
    } catch (error) {
      console.error("Failed to deposit for peg-out:", error);
      setState(prev => ({ 
        ...prev, 
        isProcessingTransaction: false, 
        error: error instanceof Error ? error.message : "Failed to deposit for peg-out" 
      }));
      toast({
        title: "Error Depositing RBTC",
        description: error instanceof Error ? error.message : "Failed to deposit for peg-out",
        variant: "destructive",
      });
    }
  }, [flyoverService, walletAccount, state.rbtcAmount, state.btcAddress, toast]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No wallet provider found. Please install a compatible wallet like MetaMask.");
      }

      const walletClient = createWalletClient({
        chain: rootstockTestnet,
        transport: custom(window.ethereum),
      });
      
      // Request accounts access
      const accounts = await walletClient.requestAddresses();
      
      if (accounts && accounts.length > 0) {
        setWalletAccount(accounts[0]);
        
        toast({
          title: "Wallet Connected",
          description: "Successfully connected to Rootstock Testnet",
        });
        
        return accounts[0];
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWalletAccount(null);
    toast({
      title: "Wallet Disconnected",
      description: "You have disconnected your wallet",
    });
  }, [toast]);

  // Get wallet balance
  const getWalletBalance = useCallback(async () => {
    if (!walletAccount) return "0";

    try {
      // Mock balance for demo purposes
      const balance = BigInt(Math.random() * 1e18);
      
      return formatEther(balance);
    } catch (error) {
      console.error("Failed to get wallet balance:", error);
      return "0";
    }
  }, [walletAccount]);

  // Load providers when service is initialized
  useEffect(() => {
    if (flyoverService && state.isInitialized && state.liquidityProviders.length === 0) {
      loadLiquidityProviders();
    }
  }, [flyoverService, state.isInitialized, state.liquidityProviders.length, loadLiquidityProviders]);

  return {
    state,
    walletAccount,
    connectWallet,
    disconnectWallet,
    getWalletBalance,
    loadLiquidityProviders,
    selectProvider,
    getPeginQuotes,
    acceptPeginQuote,
    getPegoutQuotes,
    acceptPegoutQuote,
    depositPegout,
  };
}
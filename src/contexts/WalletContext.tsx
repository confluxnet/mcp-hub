import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import type { Eip1193Provider } from "ethers";
import { useToast } from "@/components/ui/use-toast";

// Import contract ABIs
import SagaTokenABI from "../contracts/SagaToken.json";
import MCPPoolABI from "../contracts/MCPPool.json";
import SagaDAOABI from "../contracts/SagaDAO.json";
import BillingSystemABI from "../contracts/BillingSystem.json";

// Contract addresses from environment variables
const SAGA_TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_SAGA_TOKEN_ADDRESS || "0x1234567890123456789012345678901234567890";
const MCP_POOL_ADDRESS =
  process.env.NEXT_PUBLIC_MCP_POOL_ADDRESS || "0x1234567890123456789012345678901234567890";
const SAGA_DAO_ADDRESS =
  process.env.NEXT_PUBLIC_SAGA_DAO_ADDRESS || "0x1234567890123456789012345678901234567890";
const BILLING_SYSTEM_ADDRESS =
  process.env.NEXT_PUBLIC_BILLING_SYSTEM_ADDRESS || "0x1234567890123456789012345678901234567890";

// Add Saga Chainlet network configuration
const SAGA_CHAINLET_CONFIG = {
  chainId: "0x" + (2744423445533000).toString(16), // Convert decimal to hex with 0x prefix
  chainName: "confluxnet_2744423445533000-1",
  nativeCurrency: {
    name: "NEX",
    symbol: "NEX",
    decimals: 18,
  },
  rpcUrls: ["https://confluxnet-2744423445533000-1.jsonrpc.sagarpc.io"],
  blockExplorerUrls: ["https://confluxnet-2744423445533000-1.sagaexplorer.io"],
};

interface WalletState {
  account: string;
  balance: string;
  sagaToken: ethers.Contract | null;
  mcpPool: ethers.Contract | null;
  sagaDao: ethers.Contract | null;
  billingSystem: ethers.Contract | null;
}

// Interface for serializable wallet state (for localStorage)
interface SerializableWalletState {
  account: string;
  balance: string;
}

interface WalletContextType {
  walletState: WalletState;
  loading: boolean;
  connectWallet: (showToast?: boolean) => Promise<void>;
  disconnectWallet: () => void;
  isConnected: () => boolean;
  isAdmin: () => boolean;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [walletState, setWalletState] = useState<WalletState>({
    account: "",
    balance: "0",
    sagaToken: null,
    mcpPool: null,
    sagaDao: null,
    billingSystem: null,
  });

  // Connect wallet and initialize contracts
  const connectWallet = async (showToast = true) => {
    try {
      setLoading(true);

      if (!window.ethereum) {
        toast({
          title: "Error",
          description: "Please install MetaMask to use this feature",
          variant: "destructive",
        });
        return;
      }

      const ethereum = window.ethereum as unknown as Eip1193Provider;

      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      // Check if we're on the correct network
      const provider = new ethers.BrowserProvider(ethereum);
      const network = await provider.getNetwork();
      const currentChainId = network.chainId.toString(16);

      if (currentChainId !== SAGA_CHAINLET_CONFIG.chainId.replace("0x", "")) {
        try {
          // Try to switch to the Saga network
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SAGA_CHAINLET_CONFIG.chainId }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: SAGA_CHAINLET_CONFIG.chainId,
                    chainName: SAGA_CHAINLET_CONFIG.chainName,
                    nativeCurrency: SAGA_CHAINLET_CONFIG.nativeCurrency,
                    rpcUrls: SAGA_CHAINLET_CONFIG.rpcUrls,
                    blockExplorerUrls: SAGA_CHAINLET_CONFIG.blockExplorerUrls,
                  },
                ],
              });
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to add Saga network to MetaMask",
                variant: "destructive",
              });
              return;
            }
          } else {
            toast({
              title: "Error",
              description: "Failed to switch to Saga network",
              variant: "destructive",
            });
            return;
          }
        }
      }

      // Get the updated provider and signer after network switch
      const updatedProvider = new ethers.BrowserProvider(ethereum);
      const signer = await updatedProvider.getSigner();
      const account = accounts[0];

      // Initialize contract instances
      const sagaTokenContract = new ethers.Contract(SAGA_TOKEN_ADDRESS, SagaTokenABI.abi, signer);
      const mcpPoolContract = new ethers.Contract(MCP_POOL_ADDRESS, MCPPoolABI.abi, signer);
      const sagaDaoContract = new ethers.Contract(SAGA_DAO_ADDRESS, SagaDAOABI.abi, signer);
      const billingSystemContract = new ethers.Contract(
        BILLING_SYSTEM_ADDRESS,
        BillingSystemABI.abi,
        signer
      );

      // Get token balance
      const balance = await sagaTokenContract.balanceOf(account);
      const formattedBalance = ethers.formatEther(balance);

      // Update state
      setWalletState({
        account,
        balance: formattedBalance,
        sagaToken: sagaTokenContract,
        mcpPool: mcpPoolContract,
        sagaDao: sagaDaoContract,
        billingSystem: billingSystemContract,
      });

      if (showToast) {
        toast({
          title: "Wallet Connected",
          description: `Connected to ${account.slice(0, 6)}...${account.slice(-4)}`,
        });
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Error",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletState({
      account: "",
      balance: "0",
      sagaToken: null,
      mcpPool: null,
      sagaDao: null,
      billingSystem: null,
    });

    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  // Check if wallet is connected
  const isConnected = () => {
    return !!walletState.account;
  };

  // Check if the current user is an admin
  const isAdmin = () => {
    const ADMIN_ADDRESS = "0xCC0174124b8A26a7f216639E6c6A26bd645d6761";
    return walletState.account.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
  };

  // Initialize wallet state from localStorage
  useEffect(() => {
    const loadWalletStateFromStorage = async () => {
      try {
        const storedWalletState = localStorage.getItem("walletState");

        if (storedWalletState) {
          const parsedState: SerializableWalletState = JSON.parse(storedWalletState);

          // Only update the serializable parts from localStorage
          setWalletState((prev) => ({
            ...prev,
            account: parsedState.account,
            balance: parsedState.balance,
          }));

          // If we have an account, try to reconnect to the wallet
          if (parsedState.account) {
            await connectWallet(false); // Don't show toast on auto-reconnect
          }
        }
      } catch (error) {
        console.error("Error loading wallet state from localStorage:", error);
      }
    };

    loadWalletStateFromStorage();
  }, []);

  // Save wallet state to localStorage whenever it changes
  useEffect(() => {
    // Only save serializable parts
    const serializableState: SerializableWalletState = {
      account: walletState.account,
      balance: walletState.balance,
    };

    localStorage.setItem("walletState", JSON.stringify(serializableState));
  }, [walletState.account, walletState.balance]);

  const value = {
    walletState,
    loading,
    connectWallet,
    disconnectWallet,
    isConnected,
    isAdmin,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

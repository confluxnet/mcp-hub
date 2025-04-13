"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { clusterApiUrl, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

// Define the wallet context interface
interface WalletContextType {
  isConnected: boolean;
  connecting: boolean;
  account: string;
  balance: string;
  walletName: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  openWalletModal: () => void;
}

// Create the context with default values
const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  connecting: false,
  account: '',
  balance: '0',
  walletName: '',
  connectWallet: async () => {},
  disconnectWallet: () => {},
  openWalletModal: () => {},
});

// Hook to use the wallet context
export const useWallet = () => useContext(WalletContext);

interface SolanaProviderProps {
  children: ReactNode;
}

export function SolanaProvider({ children }: SolanaProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [walletName, setWalletName] = useState('');
  const [network] = useState(WalletAdapterNetwork.Devnet);
  const [connection, setConnection] = useState<Connection | null>(null);

  // Initialize connection
  useEffect(() => {
    const endpoint = clusterApiUrl(network);
    setConnection(new Connection(endpoint));
  }, [network]);

  // Setup wallet event listeners
  useEffect(() => {
    // Mock implementation for phantom wallet
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length > 0) {
        const newAccount = accounts[0];
        setAccount(newAccount);
        setIsConnected(true);
        
        // Fetch balance
        if (connection) {
          try {
            const pubKey = new PublicKey(newAccount);
            const balanceInLamports = await connection.getBalance(pubKey);
            const balanceInSol = (balanceInLamports / LAMPORTS_PER_SOL).toFixed(4);
            setBalance(balanceInSol);
          } catch (error) {
            console.error('Error fetching balance:', error);
          }
        }
      } else {
        setIsConnected(false);
        setAccount('');
        setBalance('0');
      }
    };

    // Check if Phantom is installed
    const checkPhantomWallet = () => {
      if (typeof window !== 'undefined' && 'phantom' in window) {
        const phantom = (window as any).phantom?.solana;
        if (phantom?.isPhantom) {
          phantom.on('accountChanged', handleAccountsChanged);
          return () => {
            phantom.removeListener('accountChanged', handleAccountsChanged);
          };
        }
      }
    };

    const cleanup = checkPhantomWallet();
    return cleanup;
  }, [connection]);

  // Connect wallet function
  const connectWallet = async () => {
    setConnecting(true);
    try {
      if (typeof window !== 'undefined') {
        // Check for Phantom wallet
        if ('phantom' in window) {
          const provider = (window as any).phantom?.solana;
          if (provider?.isPhantom) {
            const response = await provider.connect();
            const publicKey = response.publicKey.toString();
            setAccount(publicKey);
            setWalletName('Phantom');
            setIsConnected(true);
            
            // Get balance
            if (connection) {
              const balanceInLamports = await connection.getBalance(response.publicKey);
              const balanceInSol = (balanceInLamports / LAMPORTS_PER_SOL).toFixed(4);
              setBalance(balanceInSol);
            }
            return;
          }
        }
        
        // Check for Solflare wallet
        if ('solflare' in window) {
          const provider = (window as any).solflare;
          if (provider?.isSolflare) {
            await provider.connect();
            const publicKey = provider.publicKey.toString();
            setAccount(publicKey);
            setWalletName('Solflare');
            setIsConnected(true);
            
            // Get balance
            if (connection && provider.publicKey) {
              const balanceInLamports = await connection.getBalance(provider.publicKey);
              const balanceInSol = (balanceInLamports / LAMPORTS_PER_SOL).toFixed(4);
              setBalance(balanceInSol);
            }
            return;
          }
        }
        
        // If no wallet is found
        window.open('https://phantom.app/', '_blank');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    try {
      if (typeof window !== 'undefined') {
        if ('phantom' in window && walletName === 'Phantom') {
          const provider = (window as any).phantom?.solana;
          if (provider?.isPhantom) {
            provider.disconnect();
          }
        }
        
        if ('solflare' in window && walletName === 'Solflare') {
          const provider = (window as any).solflare;
          if (provider?.isSolflare) {
            provider.disconnect();
          }
        }
      }
      
      setIsConnected(false);
      setAccount('');
      setBalance('0');
      setWalletName('');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Function to open wallet modal
  const openWalletModal = () => {
    connectWallet();
  };

  const value = {
    isConnected,
    connecting,
    account,
    balance,
    walletName,
    connectWallet,
    disconnectWallet,
    openWalletModal,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}
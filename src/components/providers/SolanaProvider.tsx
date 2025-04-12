'use client';

import React, { type ReactNode, useEffect, useState, createContext, useContext, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Wallet, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { projectId } from '@/lib/config';
import { ethers } from 'ethers';
import Web3Modal from '@web3modal/standalone';

// Define types for browser wallets
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
    phantom?: {
      solana?: {
        isPhantom?: boolean;
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
        disconnect: () => Promise<void>;
        on: (event: string, callback: (...args: any[]) => void) => void;
        removeListener: (event: string, callback: (...args: any[]) => void) => void;
      };
    };
    solflare?: {
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
    };
  }
}

// Create wallet context
type WalletContextType = {
  isConnected: boolean;
  connecting: boolean;
  account: string;
  balance: string;
  walletName: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  openWalletModal: () => void;
};

const defaultContext: WalletContextType = {
  isConnected: false,
  connecting: false,
  account: '',
  balance: '0',
  walletName: '',
  connectWallet: async () => {},
  disconnectWallet: () => {},
  openWalletModal: () => {},
};

const WalletContext = createContext<WalletContextType>(defaultContext);

export function useWallet() {
  return useContext(WalletContext);
}

interface WalletInfo {
  name: string;
  icon: string;
  installed: boolean;
  description: string;
  type: 'ethereum' | 'solana' | 'walletconnect';
}

// We'll initialize web3Modal dynamically to prevent SSR issues
let web3Modal: any = null;

// Wallet modal component
function WalletModal({ isOpen, onClose, onSelect }: { 
  isOpen: boolean, 
  onClose: () => void,
  onSelect: (walletInfo: WalletInfo) => void 
}) {
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for installed wallets
    const detectedWallets: WalletInfo[] = [
      {
        name: 'MetaMask',
        icon: 'https://metamask.io/images/metamask-logo.svg',
        installed: !!window.ethereum?.isMetaMask,
        description: 'Connect to your MetaMask wallet',
        type: 'ethereum'
      },
      {
        name: 'Phantom',
        icon: 'https://phantom.app/favicon.ico',
        installed: !!window.phantom?.solana?.isPhantom,
        description: 'Connect to your Phantom wallet',
        type: 'solana'
      },
      {
        name: 'Solflare',
        icon: 'https://solflare.com/favicon.ico',
        installed: !!window.solflare,
        description: 'Connect to your Solflare wallet',
        type: 'solana'
      }
    ];

    // Always add WalletConnect as an option
    detectedWallets.push({
      name: 'WalletConnect',
      icon: 'https://walletconnect.com/favicon.ico',
      installed: true, // Always available through QR code
      description: 'Scan with your mobile wallet',
      type: 'walletconnect'
    });

    setAvailableWallets(detectedWallets);

    // Show error if no wallets are installed
    if (!detectedWallets.some(wallet => wallet.installed)) {
      setError('No compatible wallets detected. Please install a wallet extension.');
    } else {
      setError(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to the application
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="flex items-center p-3 mt-2 text-sm rounded-md bg-red-50 text-red-500 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        <div className="space-y-2 py-4">
          {availableWallets.map((wallet) => (
            <Button
              key={wallet.name}
              variant="outline"
              className={`w-full justify-start text-left font-normal ${!wallet.installed ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (wallet.installed) {
                  onSelect(wallet);
                  onClose();
                } else {
                  window.open(
                    wallet.name === 'Phantom' 
                      ? 'https://phantom.app/' 
                      : wallet.name === 'MetaMask'
                        ? 'https://metamask.io/'
                        : wallet.name === 'Solflare'
                          ? 'https://solflare.com/'
                          : '#',
                    '_blank'
                  );
                }
              }}
              disabled={!wallet.installed}
            >
              <img 
                src={wallet.icon}
                alt={`${wallet.name} icon`}
                className="h-5 w-5 mr-2"
              />
              <div className="flex flex-col">
                <span>{wallet.name}</span>
                <span className="text-xs text-muted-foreground">{wallet.description}</span>
              </div>
              {!wallet.installed && (
                <span className="ml-auto text-xs">Not installed</span>
              )}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContextProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [walletName, setWalletName] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Auto-connection effect
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedWalletName = localStorage.getItem('walletName');
    const savedIsConnected = localStorage.getItem('walletConnected') === 'true';
    
    // Auto reconnect if previously connected
    if (savedIsConnected && savedWalletName) {
      setWalletName(savedWalletName);
      // Try to reconnect with the wallet after a delay
      setTimeout(() => {
        reconnectWallet(savedWalletName).catch(console.error);
      }, 500);
    }
  }, []);

  // Force connect if on Story Protocol page
  useEffect(() => {
    if (pathname.startsWith('/story-protocol') && !isConnected && !connecting) {
      openWalletModal();
    }
  }, [pathname, isConnected, connecting]);

  // Effect to clean up event listeners
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleEthereumAccountsChanged);
          window.ethereum.removeListener('disconnect', handleDisconnect);
        }
      }
    };
  }, []);

  // Handle Ethereum accounts changed
  const handleEthereumAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected
      setIsConnected(false);
      setAccount('');
      setBalance('0');
      localStorage.removeItem('walletConnected');
    } else {
      // Account changed
      setAccount(accounts[0]);
      updateEthereumBalance(accounts[0]);
    }
  }, []);

  // Handle wallet disconnection
  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setAccount('');
    setBalance('0');
    localStorage.removeItem('walletConnected');
  }, []);

  // Update Ethereum balance
  const updateEthereumBalance = useCallback(async (address: string) => {
    if (!provider) return;
    
    try {
      const balance = await provider.getBalance(address);
      const etherBalance = ethers.utils.formatEther(balance);
      setBalance(parseFloat(etherBalance).toFixed(4));
    } catch (error) {
      console.error('Error getting balance:', error);
    }
  }, [provider]);

  // Setup Ethereum listeners
  const setupEthereumListeners = useCallback(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    
    window.ethereum.on('accountsChanged', handleEthereumAccountsChanged);
    window.ethereum.on('disconnect', handleDisconnect);
  }, [handleEthereumAccountsChanged, handleDisconnect]);

  // Try to reconnect to previously connected wallet
  const reconnectWallet = useCallback(async (savedWalletName: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      setConnecting(true);
      
      if (savedWalletName === 'MetaMask' && window.ethereum?.isMetaMask) {
        await connectToMetaMask();
      } 
      else if (savedWalletName === 'Phantom' && window.phantom?.solana?.isPhantom) {
        await connectToPhantom();
      }
      else if (savedWalletName === 'Solflare' && window.solflare) {
        await connectToSolflare();
      }
      // WalletConnect sessions need to be re-established through the modal
    } catch (error) {
      console.error('Error reconnecting to wallet:', error);
      localStorage.removeItem('walletConnected');
    } finally {
      setConnecting(false);
    }
  }, []);

  // Connect to MetaMask
  const connectToMetaMask = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum?.isMetaMask) return;
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      
      // Create ethers provider
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);
      
      // Get account balance
      const balance = await web3Provider.getBalance(address);
      const etherBalance = ethers.utils.formatEther(balance);
      
      // Update state
      setAccount(address);
      setBalance(parseFloat(etherBalance).toFixed(4));
      setIsConnected(true);
      setWalletName('MetaMask');
      
      // Setup event listeners
      setupEthereumListeners();
      
      // Save connection state
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', address);
      localStorage.setItem('walletName', 'MetaMask');
      
      return address;
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      throw error;
    }
  }, [setupEthereumListeners]);

  // Connect to Phantom
  const connectToPhantom = useCallback(async () => {
    if (typeof window === 'undefined' || !window.phantom?.solana?.isPhantom) return;
    
    try {
      const { publicKey } = await window.phantom.solana.connect();
      const address = publicKey.toString();
      
      // Update state
      setAccount(address);
      setBalance('100.00'); // Example balance for Solana
      setIsConnected(true);
      setWalletName('Phantom');
      
      // Setup Phantom event listeners
      const phantomWallet = window.phantom.solana;
      if (typeof phantomWallet.on === 'function') {
        phantomWallet.on('disconnect', handleDisconnect);
      }
      
      // Save connection state
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', address);
      localStorage.setItem('walletName', 'Phantom');
      
      return address;
    } catch (error) {
      console.error('Error connecting to Phantom:', error);
      throw error;
    }
  }, [handleDisconnect]);

  // Connect to Solflare
  const connectToSolflare = useCallback(async () => {
    if (typeof window === 'undefined' || !window.solflare) return;
    
    try {
      const { publicKey } = await window.solflare.connect();
      const address = publicKey.toString();
      
      // Update state
      setAccount(address);
      setBalance('100.00'); // Example balance for Solana
      setIsConnected(true);
      setWalletName('Solflare');
      
      // Save connection state
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', address);
      localStorage.setItem('walletName', 'Solflare');
      
      return address;
    } catch (error) {
      console.error('Error connecting to Solflare:', error);
      throw error;
    }
  }, []);

  // Connect to WalletConnect
  const connectToWalletConnect = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Dynamically initialize Web3Modal to avoid SSR issues
      if (!web3Modal) {
        const Web3Modal = (await import('@web3modal/standalone')).default;
        web3Modal = new Web3Modal({
          projectId,
          standaloneChains: ['ethereum'],
          walletConnectVersion: 2,
        });
      }
      
      // Open WalletConnect modal
      const uri = await web3Modal.openModal();
      
      // Here we're just using a placeholder address until the connection is established
      // In a real implementation, we would wait for the connection to be established
      // and then get the actual address
      setAccount('Connecting via WalletConnect...');
      setIsConnected(true);
      setBalance('...'); 
      setWalletName('WalletConnect');
      
      // Store connection info
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletName', 'WalletConnect');
      
      return 'Connecting via WalletConnect...';
    } catch (error) {
      console.error('Error connecting with WalletConnect:', error);
      throw error;
    }
  }, []);

  // Handle wallet selection from modal
  const handleWalletSelect = useCallback(async (wallet: WalletInfo) => {
    try {
      setConnecting(true);
      
      let address: string | undefined;
      
      // Connect to the selected wallet
      if (wallet.type === 'ethereum' && wallet.name === 'MetaMask') {
        address = await connectToMetaMask();
      } 
      else if (wallet.type === 'solana' && wallet.name === 'Phantom') {
        address = await connectToPhantom();
      }
      else if (wallet.type === 'solana' && wallet.name === 'Solflare') {
        address = await connectToSolflare();
      }
      else if (wallet.type === 'walletconnect') {
        address = await connectToWalletConnect();
      }
      
      // If connection failed, clear state
      if (!address) {
        setIsConnected(false);
        setAccount('');
        setBalance('0');
        localStorage.removeItem('walletConnected');
      }
    } catch (error) {
      console.error(`Error connecting to ${wallet.name}:`, error);
      setIsConnected(false);
      setAccount('');
      setBalance('0');
    } finally {
      setConnecting(false);
    }
  }, [connectToMetaMask, connectToPhantom, connectToSolflare, connectToWalletConnect]);

  const openWalletModal = useCallback(() => {
    setShowWalletModal(true);
  }, []);

  const connectWallet = useCallback(async () => {
    openWalletModal();
  }, [openWalletModal]);

  const disconnectWallet = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Disconnect from the appropriate wallet
      if (walletName === 'MetaMask' && window.ethereum?.isMetaMask) {
        // MetaMask doesn't have a disconnect method in the provider
        // It's handled by clearing the state
      } 
      else if (walletName === 'Phantom' && window.phantom?.solana) {
        await window.phantom.solana.disconnect();
      } 
      else if (walletName === 'Solflare' && window.solflare) {
        await window.solflare.disconnect();
      }
      else if (walletName === 'WalletConnect' && web3Modal) {
        // Close WalletConnect session
        web3Modal.closeModal();
      }
      
      // Clear state
      setAccount('');
      setBalance('0');
      setIsConnected(false);
      setProvider(null);
      
      // Clear localStorage
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletName');
      
      // Redirect away from Story Protocol pages
      if (pathname.startsWith('/story-protocol')) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }, [walletName, pathname, router]);

  const contextValue = {
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
    <WalletContext.Provider value={contextValue}>
      {children}
      <WalletModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)}
        onSelect={handleWalletSelect}
      />
    </WalletContext.Provider>
  );
}

export default ContextProvider;
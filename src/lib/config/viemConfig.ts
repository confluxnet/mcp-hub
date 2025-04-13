import { createWalletClient, createPublicClient, custom, http } from 'viem';
import { mainnet } from 'viem/chains';
import { rootstock, rootstockTestnet } from './rootstockChains';

// Configure Ethereum provider
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
});

// Configure Rootstock provider
export const rootstockPublicClient = createPublicClient({
  chain: rootstock,
  transport: http()
});

// Configure Rootstock Testnet provider
export const rootstockTestnetPublicClient = createPublicClient({
  chain: rootstockTestnet,
  transport: http()
});

// Create wallet client conditionally based on environment
const createWalletClientSafe = () => {
  if (typeof window !== 'undefined') {
    return createWalletClient({
      chain: mainnet,
      transport: custom(window.ethereum)
    });
  }
  
  // Return a mock wallet client for SSR
  return {
    writeContract: async () => '0x',
  } as any;
};

// Export the wallet client
export const walletClient = createWalletClientSafe();

// Use the first account from the wallet
export const account = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Replace with actual account when connecting wallet
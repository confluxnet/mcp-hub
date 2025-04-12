import { createWalletClient, createPublicClient, custom, http } from 'viem';
import { mainnet } from 'viem/chains';

// Configure Ethereum provider
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
});

// Create the wallet client
export const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum)
});

// Use the first account from the wallet
export const account = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Replace with actual account when connecting wallet
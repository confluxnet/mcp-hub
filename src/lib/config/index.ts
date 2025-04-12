// Project ID for WalletConnect (simplified)
export const projectId = 
  process.env.NEXT_PUBLIC_PROJECT_ID_V2 || "b56e18d47c72ab683b10814fe9495694";

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Simplified network definitions
export const networks = {
  mainnet: 'mainnet-beta',
  testnet: 'testnet',
  devnet: 'devnet'
};

// Placeholder for compatibility
export const solanaWeb3JsAdapter = {};

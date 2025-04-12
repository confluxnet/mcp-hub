import { useContext } from "react";
import { WalletContext } from "@/contexts/WalletContext";

export function useWallet() {
  const context = useContext(WalletContext);

  // If we're on the server side, return a default context
  if (typeof window === "undefined") {
    return {
      walletState: {
        account: "",
        balance: "",
        sagaToken: null,
        mcpPool: null,
        sagaDao: null,
        billingSystem: null,
      },
      loading: false,
      connectWallet: async () => {},
      disconnectWallet: () => {},
      isConnected: () => false,
      isAdmin: () => false,
    };
  }

  // If we're on the client side but the context is undefined, throw an error
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }

  return context;
}

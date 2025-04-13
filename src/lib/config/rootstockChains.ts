import { defineChain } from "viem";

export const rootstock = defineChain({
  id: 30,
  name: "Rootstock",
  network: "rootstock",
  nativeCurrency: {
    decimals: 18,
    name: "Smart Bitcoin",
    symbol: "RBTC",
  },
  rpcUrls: {
    default: { http: ["https://public-node.rsk.co"] },
    public: { http: ["https://public-node.rsk.co"] },
  },
  blockExplorers: {
    default: { name: "RSK Explorer", url: "https://explorer.rsk.co" },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 4_201_197,
    },
  },
});

export const rootstockTestnet = defineChain({
  id: 31,
  name: "Rootstock Testnet",
  network: "rootstock-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Test Smart Bitcoin",
    symbol: "tRBTC",
  },
  rpcUrls: {
    default: { http: ["https://public-node.testnet.rsk.co"] },
    public: { http: ["https://public-node.testnet.rsk.co"] },
  },
  blockExplorers: {
    default: { name: "RSK Testnet Explorer", url: "https://explorer.testnet.rsk.co" },
  },
  testnet: true,
});
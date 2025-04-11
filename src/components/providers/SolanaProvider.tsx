'use client';

import { solanaWeb3JsAdapter, projectId, networks } from '@/lib/config';
import { createAppKit } from '@reown/appkit/react';
import React, { type ReactNode } from 'react';

// Set up metadata
const metadata = {
  name: 'solana-node-dashboard',
  description: 'solana-node-dashboard',
  url: 'https://solana-node-dashboard.vercel.app/',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

// Create the modal
export const modal = createAppKit({
  adapters: [solanaWeb3JsAdapter],
  projectId,
  networks,
  metadata,
  themeMode: 'light',
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
  themeVariables: {
    '--w3m-accent': '#000000',
  },
});

function ContextProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default ContextProvider;

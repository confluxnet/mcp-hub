import { providers } from 'ethers';

export function getProvider(): providers.Provider {
  return new providers.JsonRpcProvider();
}

export interface EnvelopingRequest {
  request: {
    from: string;
  };
}
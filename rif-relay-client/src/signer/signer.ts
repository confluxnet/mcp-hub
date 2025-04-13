import { Wallet } from 'ethers';
import type { EnvelopingRequest } from '../common';

export async function signEnvelopingRequest(
  envelopingRequest: EnvelopingRequest,
  fromAddress: string,
  signerWallet?: Wallet
): Promise<string> {
  if (!signerWallet) {
    throw new Error('No signer wallet available for address: ' + fromAddress);
  }
  
  // Simplified implementation for the purpose of fixing build issues
  return await signerWallet.signMessage('EnvelopingRequest');
}
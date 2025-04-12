import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Address } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 고유 ID 생성 함수
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Story Protocol contract addresses
export const SPG_NFT_CONTRACT_ADDRESS: Address = "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc";
export const ROYALTY_POLICY_LAP_ADDRESS: Address = "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E";

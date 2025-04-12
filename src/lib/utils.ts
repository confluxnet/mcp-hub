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
export const SPG_NFT_CONTRACT_ADDRESS: Address = "0x6e866c90E0D3d8F62C7cFD7C77Ab077E906E7156";

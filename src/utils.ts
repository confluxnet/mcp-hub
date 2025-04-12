import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Contract address for the default NFT contract
export const NFTContractAddress = '0x8a5e2a6343108bABEd07899d5815C81e14Ab61f9';

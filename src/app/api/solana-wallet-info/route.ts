import { NextResponse } from "next/server";

export async function GET() {
  try {
    // This is a server-side API route, so we can't directly use React hooks
    // Instead, we'll return a response that indicates the client should handle the wallet connection
    return NextResponse.json({
      address: null,
      network: null,
      message: "Wallet connection should be handled on the client side",
    });
  } catch (error) {
    console.error("Error in solana-wallet-info API:", error);
    return NextResponse.json(
      { error: `Failed to get wallet info: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

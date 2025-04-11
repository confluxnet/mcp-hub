import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { recipient, amount, senderAddress } = await request.json();

    if (!recipient) {
      return NextResponse.json({ error: "Recipient address is required" }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }

    // Transaction signing is now handled on the client side
    return NextResponse.json({
      message: "Transaction signing is handled on the client side",
      senderAddress,
      recipient,
      amount,
    });
  } catch (error: any) {
    console.error("Error in solana-send-transaction:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

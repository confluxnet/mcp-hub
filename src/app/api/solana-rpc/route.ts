import { NextRequest, NextResponse } from "next/server";

const SOLANA_RPC_URL =
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // RPC API 요청 전송
    const response = await fetch(SOLANA_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Solana RPC 요청 오류:", error);
    return NextResponse.json(
      { error: "Solana RPC 요청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

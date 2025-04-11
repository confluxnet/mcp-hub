import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 요청 본문에서 파라미터 추출
    const body = await request.json();
    const { address, rpcUrl, limit = 10 } = body;

    if (!address) {
      return NextResponse.json(
        { error: "주소가 지정되지 않았습니다." },
        { status: 400 }
      );
    }

    // 사용할 RPC URL 결정
    const finalRpcUrl =
      rpcUrl ||
      process.env.SOLANA_RPC_URL ||
      "https://api.mainnet-beta.solana.com";

    // 1. 먼저 주소와 관련된 서명 목록 가져오기
    const signaturesResponse = await fetch(finalRpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [
          address,
          {
            limit: Math.min(Number(limit), 10), // 최대 10개로 제한
          },
        ],
      }),
    });

    if (!signaturesResponse.ok) {
      const errorText = await signaturesResponse.text();
      return NextResponse.json(
        { error: `서명 목록 가져오기 실패: ${errorText}` },
        { status: 500 }
      );
    }

    const signaturesData = await signaturesResponse.json();

    if (signaturesData.error) {
      return NextResponse.json(
        { error: `RPC 에러: ${JSON.stringify(signaturesData.error)}` },
        { status: 500 }
      );
    }

    const signatures = signaturesData.result.map((item: any) => item.signature);

    // 2. 각 서명에 대해 상세 트랜잭션 데이터 가져오기
    const transactionsPromises = signatures.map(async (signature: string) => {
      const txResponse = await fetch(finalRpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTransaction",
          params: [
            signature,
            {
              encoding: "json",
              maxSupportedTransactionVersion: 0,
            },
          ],
        }),
      });

      if (!txResponse.ok) {
        console.error(
          `트랜잭션 가져오기 실패 (${signature}): ${txResponse.status}`
        );
        return null;
      }

      const txData = await txResponse.json();
      if (txData.error) {
        console.error(
          `트랜잭션 RPC 에러 (${signature}): ${JSON.stringify(txData.error)}`
        );
        return null;
      }

      // 트랜잭션 메타데이터 추가
      const meta = signaturesData.result.find(
        (item: any) => item.signature === signature
      );

      // 트랜잭션 타입 추정
      const type = getTransactionType(meta, txData.result);

      return {
        signature,
        blockTime: txData.result?.blockTime,
        slot: txData.result?.slot,
        type,
        err: txData.result?.meta?.err || null,
        transaction: txData.result,
      };
    });

    // 모든 트랜잭션 데이터 가져오기를 기다림
    const transactionsData = await Promise.all(transactionsPromises);

    // null 값 필터링(오류가 발생한 항목)
    const transactions = transactionsData.filter(Boolean);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("트랜잭션 히스토리 API 에러:", error);
    return NextResponse.json(
      { error: `트랜잭션 히스토리 처리 중 오류: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

// 트랜잭션 타입 추정 함수
function getTransactionType(meta: any, txData: any): string {
  // 오류가 발생한 트랜잭션
  if (meta?.err || txData?.meta?.err) return "Failed Transaction";

  // 메모가 있는 경우 확인
  if (meta?.memo) {
    if (meta.memo.toLowerCase().includes("swap")) return "Token Swap";
    if (meta.memo.toLowerCase().includes("transfer")) return "Token Transfer";
    if (meta.memo.toLowerCase().includes("mint")) return "Token Mint";
    if (meta.memo.toLowerCase().includes("nft")) return "NFT Transaction";
    return `Transaction with Memo: ${meta.memo.substring(0, 20)}${
      meta.memo.length > 20 ? "..." : ""
    }`;
  }

  // 프로그램 ID를 기반으로 판단
  if (txData?.transaction?.message?.instructions) {
    const programs = new Set<string>();
    txData.transaction.message.instructions.forEach((ix: any) => {
      if (ix.programId) programs.add(ix.programId);
    });

    // 일반적인 프로그램 ID로 유형 추측
    if (programs.has("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")) {
      return "Token Transaction";
    }
    if (programs.has("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")) {
      return "Token Account Transaction";
    }
    if (programs.has("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")) {
      return "NFT Transaction";
    }
    if (programs.has("SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8")) {
      return "Token Swap";
    }

    // 프로그램 ID 개수로 유형 추측
    if (programs.size > 3) {
      return "Complex Transaction";
    }
  }

  return "Transaction"; // 기본값
}

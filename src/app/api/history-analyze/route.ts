import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MODEL_NAME = "gemini-2.0-flash";

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // 요청 데이터 파싱
    const data = await request.json();
    const { transactions, address } = data;

    if (
      !transactions ||
      !Array.isArray(transactions) ||
      transactions.length === 0
    ) {
      return NextResponse.json(
        { error: "유효한 트랜잭션 배열이 필요합니다" },
        { status: 400 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { error: "분석 대상 주소가 필요합니다" },
        { status: 400 }
      );
    }

    // Gemini API 초기화
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // 안전 설정
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];

    // 프롬프트 작성 (영문)
    const systemPrompt = `You are a Solana blockchain transaction history analysis expert.
      
Please analyze the recent transaction history for account or program address ${address} and provide meaningful insights.
Your analysis should include:

1. Transaction activity summary (volume, patterns, anomalies)
2. List of main programs or smart contracts interacted with
3. Analysis of most frequent transaction types
4. Patterns in transaction activity over time
5. Token-related activity (transfers, swaps, staking, etc.)
6. Security insights (if any)
7. Comprehensive analysis and prediction of future activity

Write your response in English, in a natural conversational style.
Use plain language that non-technical users can understand.
Format your response as a single text paragraph.

Transaction history data summary:`;

    // 트랜잭션 데이터 요약 (너무 크면 API 제한에 걸릴 수 있음)
    const transactionsSummary = transactions.map((tx: any, index: number) => {
      // 트랜잭션 핵심 정보만 추출
      const { transaction = {}, meta = {}, blockTime, slot } = tx;

      // 인스트럭션 요약
      const instructions = transaction.message?.instructions || [];
      const instructionSummary = instructions.map((ins: any) => {
        return {
          programId: ins.programId,
          data: ins.data ? `${ins.data.slice(0, 20)}...` : "",
          accounts: ins.accounts ? ins.accounts.slice(0, 5) : [],
        };
      });

      // 로그 요약
      const logs = meta.logMessages || [];
      const logSummary =
        logs.length > 10
          ? [...logs.slice(0, 5), "... (생략됨) ...", ...logs.slice(-5)]
          : logs;

      return {
        index,
        signature: tx.transaction?.signatures?.[0] || "unknown",
        blockTime,
        slot,
        status: meta.err ? "실패" : "성공",
        instructionCount: instructions.length,
        instructionSummary: instructionSummary.slice(0, 3), // 처음 3개만
        logSummary,
        // 토큰 전송 정보 (있을 경우)
        tokenTransfers: meta.postTokenBalances || [],
      };
    });

    try {
      // Gemini API 호출
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\n\n이 주소(${address})에 대한 최근 ${
                  transactions.length
                }개 트랜잭션을 분석해 주세요: ${JSON.stringify(
                  transactionsSummary
                )}`,
              },
            ],
          },
        ],
        safetySettings,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      });

      const response = result.response;
      const analysisText =
        response.text() || "트랜잭션 분석 결과를 생성할 수 없습니다.";

      let insights;

      try {
        // JSON 파싱 시도를 제거하고 텍스트 그대로 사용
        insights = analysisText;
      } catch (e) {
        // 오류 발생 시 원본 텍스트 사용
        insights = analysisText;
      }

      return NextResponse.json({ insights });
    } catch (aiError) {
      console.error("LLM 분석 중 오류:", aiError);
      return NextResponse.json(
        {
          error: `트랜잭션 분석을 수행할 수 없습니다: ${
            (aiError as Error).message
          }`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("트랜잭션 히스토리 분석 에러:", error);
    return NextResponse.json(
      { error: `분석 중 오류 발생: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

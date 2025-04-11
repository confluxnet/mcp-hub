import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const DEFAULT_MODEL_NAME = "gemini-2.0-flash";

// 지원되는 전문가 모델 목록
const EXPERT_MODELS = {
  DEX_EXPERT: "dex-expert",
  NFT_EXPERT: "nft-expert",
  STAKING_EXPERT: "staking-expert",
  DEFI_EXPERT: "defi-expert",
  GENERIC_EXPERT: "generic-expert",
};

// 지원되는 LLM 모델 목록
const SUPPORTED_LLM_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-pro",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const { transactionData, expertModel, llmModel } = await req.json();

    if (!transactionData) {
      return NextResponse.json(
        { error: "트랜잭션 데이터가 누락되었습니다." },
        { status: 400 }
      );
    }

    if (!expertModel) {
      return NextResponse.json(
        { error: "전문가 모델 식별자가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 유효한 전문가 모델인지 확인
    const validExpertModels = Object.values(EXPERT_MODELS);
    if (!validExpertModels.includes(expertModel)) {
      return NextResponse.json(
        {
          error: `지원되지 않는 전문가 모델입니다: ${expertModel}`,
          supportedModels: validExpertModels,
        },
        { status: 400 }
      );
    }

    // 사용할 LLM 모델 선택 (기본값: gemini-2.0-flash)
    let selectedLLMModel = DEFAULT_MODEL_NAME;

    // 클라이언트가 모델을 지정한 경우 확인
    if (llmModel) {
      // 지원되는 모델인지 확인
      if (SUPPORTED_LLM_MODELS.includes(llmModel)) {
        selectedLLMModel = llmModel;
      } else {
        console.warn(
          `지원되지 않는 LLM 모델 요청: ${llmModel}, 기본 모델 사용`
        );
      }
    }

    console.log(`선택된 LLM 모델: ${selectedLLMModel}`);

    // Initialize the Generative AI API
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: selectedLLMModel });

    // Safety settings
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

    // 전문가 모델별 특화된 프롬프트 생성
    let expertPrompt = "";

    switch (expertModel) {
      case EXPERT_MODELS.DEX_EXPERT:
        expertPrompt = `
          You are a Solana DEX (Decentralized Exchange) expert.
          Focus on analyzing:
          - Token swap details (input/output tokens, amounts, slippage)
          - DEX protocols used (Jupiter, Raydium, Orca, etc.)
          - Routing efficiency and price impact
          - LP operations (adding/removing liquidity)
          - Transaction efficiency and fee structure
        `;
        break;

      case EXPERT_MODELS.NFT_EXPERT:
        expertPrompt = `
          You are a Solana NFT expert.
          Focus on analyzing:
          - NFT collection and token details
          - Transaction type (mint, transfer, list, delist, buy)
          - Marketplace details (Magic Eden, Tensor, etc.)
          - Metadata and royalty information
          - Rarity and estimated value (if possible)
        `;
        break;

      case EXPERT_MODELS.STAKING_EXPERT:
        expertPrompt = `
          You are a Solana staking expert.
          Focus on analyzing:
          - Stake account operations (create, delegate, split, merge)
          - Validator details and performance
          - Stake activation/deactivation timing
          - Rewards calculation and distribution
          - Delegation strategy efficiency
        `;
        break;

      case EXPERT_MODELS.DEFI_EXPERT:
        expertPrompt = `
          You are a Solana DeFi expert.
          Focus on analyzing:
          - Protocol interactions (Solend, Marinade, Kamino, etc.)
          - Lending/borrowing operations
          - Collateral management
          - Interest rates and yield strategies
          - Risk assessment and liquidation parameters
        `;
        break;

      default: // GENERIC_EXPERT
        expertPrompt = `
          You are a general Solana transaction expert.
          Focus on analyzing:
          - Transaction structure and instructions
          - Program interactions
          - Account operations
          - Overall purpose and outcome
          - Success/failure status and reasons
        `;
    }

    // 최종 프롬프트 생성
    const prompt = `
      ${expertPrompt}
      
      Please analyze the following Solana transaction from your expert perspective.
      Provide a comprehensive yet concise analysis in English (2-3 paragraphs).
      Use technical terms where appropriate but ensure the analysis is accessible to intermediate users.
      Include specific details from the transaction that support your analysis.
      
      Transaction data:
      ${JSON.stringify(transactionData, null, 2)}
    `;

    try {
      // Generate content with the Gemini model
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        safetySettings,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      });

      const response = result.response;
      const analysis =
        response.text() || "트랜잭션 분석 결과를 생성할 수 없습니다.";

      console.log(
        `${expertModel} 모델을 사용한 트랜잭션 분석 완료 (LLM: ${selectedLLMModel})`
      );

      // 응답 반환
      return NextResponse.json({
        expertAnalysis: analysis,
        expertModel: expertModel,
        llmModel: selectedLLMModel,
      });
    } catch (aiError) {
      console.error(`LLM 분석 중 오류 (모델: ${selectedLLMModel}):`, aiError);
      return NextResponse.json(
        {
          error: `트랜잭션 분석을 수행할 수 없습니다: ${
            (aiError as Error).message
          }`,
          expertModel: expertModel,
          llmModel: selectedLLMModel,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Gemini API 요청 오류:", error);
    return NextResponse.json(
      {
        error: `트랜잭션 분석 중 오류가 발생했습니다: ${
          (error as Error).message
        }`,
      },
      { status: 500 }
    );
  }
}

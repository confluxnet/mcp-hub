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

    const { transactionData, llmModel } = await req.json();

    if (!transactionData) {
      return NextResponse.json(
        { error: "트랜잭션 데이터가 누락되었습니다." },
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

    // Gemini API 요청용 프롬프트 생성
    const prompt = `
      You are a Solana blockchain transaction classifier expert.
      
      Please analyze the following Solana transaction and categorize it into one of these expert model types:
      - dex-expert: DEX transactions, token swaps, liquidity operations
      - nft-expert: NFT minting, transfers, marketplace interactions
      - staking-expert: Staking, delegation, validator operations
      - defi-expert: Lending, borrowing, yield farming, collateral management
      - generic-expert: General transactions that don't fit the other categories
      
      Return ONLY the exact model identifier string from the list above that best matches this transaction.
      DO NOT include any additional text, explanation, or formatting.
      
      Transaction data:
      ${JSON.stringify(transactionData, null, 2)}
    `;

    try {
      // Generate content with the Gemini model
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        safetySettings,
        generationConfig: {
          temperature: 0.1, // 낮은 temperature로 일관된 결과 유도
          maxOutputTokens: 50, // 짧은 응답만 필요
        },
      });

      const response = result.response;
      let expertModel = response.text().trim().toLowerCase();

      // 유효한 모델인지 확인하고 정규화
      const validModels = Object.values(EXPERT_MODELS).map((model) =>
        model.toLowerCase()
      );

      if (!validModels.includes(expertModel)) {
        console.warn(
          `LLM이 반환한 모델이 유효하지 않음: "${expertModel}". 기본값 사용`
        );

        // 응답에서 유효한 모델 문자열 추출 시도
        for (const validModel of validModels) {
          if (expertModel.includes(validModel)) {
            expertModel = validModel;
            break;
          }
        }

        // 여전히 유효하지 않으면 기본값 사용
        if (!validModels.includes(expertModel)) {
          expertModel = EXPERT_MODELS.GENERIC_EXPERT;
        }
      }

      console.log(
        `트랜잭션 분류 결과: ${expertModel} (LLM: ${selectedLLMModel})`
      );

      // 응답 반환
      return NextResponse.json({
        expertModel: expertModel,
        llmModel: selectedLLMModel,
      });
    } catch (aiError) {
      console.error(`LLM 분석 중 오류 (모델: ${selectedLLMModel}):`, aiError);
      return NextResponse.json({
        expertModel: EXPERT_MODELS.GENERIC_EXPERT,
        llmModel: selectedLLMModel,
        aiError: (aiError as Error).message,
      });
    }
  } catch (error) {
    console.error("Gemini API 요청 오류:", error);
    return NextResponse.json(
      {
        error: `트랜잭션 분류 중 오류가 발생했습니다: ${
          (error as Error).message
        }`,
      },
      { status: 500 }
    );
  }
}

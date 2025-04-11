import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MODEL_NAME = "gemini-2.0-flash";

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const { transactionData } = await req.json();

    if (!transactionData) {
      return NextResponse.json(
        { error: "트랜잭션 데이터가 누락되었습니다." },
        { status: 400 }
      );
    }

    // Initialize the Generative AI API with your API key
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

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

    // Gemini API 요청용 프롬프트 생성 (영문)
    const prompt = `
      You are a Solana blockchain transaction analysis expert.
      
      Please analyze the following Solana transaction and generate a concise 2-3 line summary.
      Focus on answering these key points:
      1. What type of operation is being performed? (e.g., token transfer, swap, NFT mint, stake, etc.)
      2. Which programs or protocols are involved? (e.g., Jupiter, Marinade, Magic Eden, etc.)
      3. What is the main purpose or effect of this transaction?
      
      Write the summary in English, in a natural conversational style.
      Use plain language that non-technical users can understand.
      If the transaction failed, explain the likely reason for failure.
      
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
          maxOutputTokens: 200,
        },
      });

      const response = result.response;
      const summary =
        response.text() || "트랜잭션 분석 결과를 생성할 수 없습니다.";

      // 간소화된 형태로 반환
      return NextResponse.json({
        analysis: summary,
      });
    } catch (aiError) {
      console.error("LLM 분석 중 오류:", aiError);
      return NextResponse.json({
        analysis:
          "트랜잭션 분석을 수행할 수 없습니다. LLM 오류가 발생했습니다.",
        aiError: (aiError as Error).message,
      });
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

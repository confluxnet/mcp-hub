import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MODEL_NAME = "gemini-2.0-flash";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(request: Request) {
  try {
    const { transactionData } = await request.json();

    if (!transactionData) {
      return NextResponse.json(
        { error: "트랜잭션 데이터가 필요합니다" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `
      You are a Solana transaction visualization expert who creates mermaid.js sequence diagrams.
      Please analyze the following Solana transaction and create a valid Mermaid sequence diagram.
      The diagram should show the interaction between accounts and programs in the transaction.
      
      Rules for the diagram (follow these EXACTLY):
      1. Start with "sequenceDiagram" (no backticks or markdown formatting)
      2. For each account, use "participant AccountName as ShortName" format to define participants
      3. For arrows, use these exact formats: 
         - "A->B: Message" for solid arrows
         - "A-->B: Message" for dotted arrows
         - "A->>B: Message" for solid arrowheads
         - "A-->>B: Message" for dotted arrowheads
      4. For activation, put "activate X" and "deactivate X" on separate lines (never on the same line as an arrow)
      5. If you need to show a return message, use "B-->>A: Return value" format
      6. Every message must have text content - empty messages are not allowed
      7. Don't use any special characters in participant names
      8. Each line should be valid mermaid.js syntax - no extra formatting
      9. Avoid using "deactivate" in the same line as the arrow
      10. Do not place any content after a colon (:) at the end of a line
      
      Create a clean, valid diagram that will render correctly in mermaid.js.
      Return ONLY the mermaid diagram code with no explanation, no markdown backticks, no extra text.
      
      Transaction data:
      ${JSON.stringify(transactionData, null, 2)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let mermaid = response.text();

    // 추가 안전장치: 백틱, 마크다운 형식 제거
    mermaid = mermaid.replace(/```mermaid\s*\n/g, "");
    mermaid = mermaid.replace(/```\s*$/g, "");

    // 추가 안전장치: 잘못된 구문 수정
    mermaid = mermaid
      .split("\n")
      .map((line) => {
        // 비어있는 화살표 메시지 수정
        if (
          (line.includes("->") || line.includes("-->>")) &&
          line.endsWith(":")
        ) {
          return line + " Process";
        }
        // deactivate가 같은 줄에 있는 경우 분리
        if (
          line.includes("deactivate") &&
          (line.includes("->") || line.includes("-->"))
        ) {
          const [arrowPart, deactivatePart] = line.split("deactivate");
          return `${arrowPart.trim()}\ndeactivate ${deactivatePart.trim()}`;
        }
        return line;
      })
      .join("\n");

    console.log("Generated mermaid diagram:", mermaid);

    return NextResponse.json({ mermaid });
  } catch (error) {
    console.error("Mermaid 다이어그램 생성 중 오류 발생:", error);
    return NextResponse.json(
      { error: "Mermaid 다이어그램 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // 필수 필드 검증
    if (!data.id || !data.title || !data.description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Firestore에 데이터 저장
    const mcpListRef = collection(db, "mcp_list");
    const docRef = await addDoc(mcpListRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        id: docRef.id,
        message: "MCP submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting MCP:", error);
    return NextResponse.json({ error: "Failed to submit MCP" }, { status: 500 });
  }
}

// MCP 목록 조회 API
export async function GET() {
  try {
    const mcpListRef = collection(db, "mcp_list");
    const q = query(mcpListRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const mcps = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }));

    return NextResponse.json({ mcps });
  } catch (error) {
    console.error("Error fetching MCPs:", error);
    return NextResponse.json({ error: "Failed to fetch MCPs" }, { status: 500 });
  }
}

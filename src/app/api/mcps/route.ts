import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // 필수 필드 검증
    if (!data.title || !data.description || !data.price || !data.apiEndpoints) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Firestore에 데이터 저장
    const mcpsRef = collection(db, "mcps");
    const docRef = await addDoc(mcpsRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "pending", // pending, approved, rejected
      owner: data.owner || "anonymous",
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
    const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
    const mcpsRef = collection(db, "mcps");
    const q = query(mcpsRef, orderBy("createdAt", "desc"));
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

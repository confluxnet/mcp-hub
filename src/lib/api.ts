// MCP 타입 정의
export interface MCP {
  id?: string;
  title: string;
  description: string;
  price: number;
  apiEndpoints: string[];
  codeExamples?: {
    typescript?: string;
    python?: string;
    shell?: string;
  };
  apiParams?: {
    method: string;
    path: string;
    pathParams: { key: string; type: string; required: boolean }[];
    queryParams: { key: string; type: string; required: boolean }[];
    bodyParams: { key: string; type: string; required: boolean }[];
  };
  owner?: string;
  status?: "pending" | "approved" | "rejected";
  createdAt?: string;
  updatedAt?: string;
}

// MCP 제출 함수
export async function submitMcp(
  mcp: MCP
): Promise<{ success: boolean; id?: string; message?: string; error?: string }> {
  try {
    const response = await fetch("/api/mcps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mcp),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to submit MCP",
      };
    }

    return {
      success: true,
      id: data.id,
      message: data.message,
    };
  } catch (error) {
    console.error("Error submitting MCP:", error);
    return {
      success: false,
      error: "Network error occurred",
    };
  }
}

// MCP 목록 조회 함수
export async function getMcps(): Promise<{ success: boolean; mcps?: MCP[]; error?: string }> {
  try {
    const response = await fetch("/api/mcps");
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to fetch MCPs",
      };
    }

    return {
      success: true,
      mcps: data.mcps,
    };
  } catch (error) {
    console.error("Error fetching MCPs:", error);
    return {
      success: false,
      error: "Network error occurred",
    };
  }
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Node, Edge } from "reactflow";
import { NodeData } from "@/types/node";
import { getFunctionById } from "./functions/registry";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 고유 ID 생성 함수
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// 노드 데이터 형식화 함수
export function formatNodeData(data: any): string {
  if (data === undefined || data === null) {
    return "null";
  }

  if (typeof data === "object") {
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
  }

  return String(data);
}

// 노드 간 연결 가능 여부 확인
export function isConnectionValid(
  sourceNode: Node<NodeData> | undefined,
  targetNode: Node<NodeData> | undefined,
  sourceHandle: string | null,
  targetHandle: string | null
): boolean {
  if (!sourceNode || !targetNode || !sourceHandle || !targetHandle) {
    return false;
  }

  // 출력 노드에서는 연결 불가
  if (!sourceNode.data.functionId) {
    return false;
  }

  // 자기 자신에게 연결 불가
  if (sourceNode.id === targetNode.id) {
    return false;
  }

  // 타겟 노드의 함수가 없으면 항상 연결 가능 (결과 노드일 경우)
  if (!targetNode.data.functionId) {
    return true;
  }

  // 타겟 노드의 함수 입력 타입 확인
  const targetFunction = getFunctionById(targetNode.data.functionId);
  if (!targetFunction) {
    return false;
  }

  // targetHandle이 'input-...'형식이므로 입력 이름 추출
  const inputName = targetHandle.replace("input-", "");
  const inputDef = targetFunction.inputs.find((input) => input.name === inputName);

  // 소스 노드의 함수 출력 타입 확인
  const sourceFunction = getFunctionById(sourceNode.data.functionId);
  if (!sourceFunction) {
    return false;
  }

  // 타입 호환성 확인 (간단한 구현)
  return true;
}

// 노드 실행 함수
export async function executeNode(
  node: Node<NodeData>,
  nodes: Node<NodeData>[],
  edges: Edge[]
): Promise<any> {
  if (!node.data.functionId) {
    return node.data.returnValue;
  }

  const nodeFunction = getFunctionById(node.data.functionId);
  if (!nodeFunction) {
    throw new Error(`Function not found: ${node.data.functionId}`);
  }

  // 입력 파라미터 수집
  const inputs: Record<string, any> = { ...node.data.inputs };

  // 연결된 노드에서 값 가져오기
  const incomingEdges = edges.filter((edge) => edge.target === node.id);
  for (const edge of incomingEdges) {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!sourceNode || sourceNode.data.returnValue === undefined) {
      throw new Error(`Input node not processed yet: ${edge.source}`);
    }

    // 타겟 핸들에서 입력 이름 추출
    const inputName = edge.targetHandle?.replace("input-", "") || "";
    inputs[inputName] = sourceNode.data.returnValue;
  }

  // 함수 실행
  return await nodeFunction.execute(inputs);
}

// 노드 실행 순서 결정을 위한 위상 정렬
export function topologicalSort(nodes: Node<NodeData>[], edges: Edge[]): Node<NodeData>[] {
  const result: Node<NodeData>[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();

  // 의존성 그래프 생성
  const graph: Record<string, string[]> = {};
  nodes.forEach((node) => {
    graph[node.id] = [];
  });

  edges.forEach((edge) => {
    if (graph[edge.target]) {
      graph[edge.target].push(edge.source);
    }
  });

  // DFS 수행
  const visit = (nodeId: string): void => {
    if (visited.has(nodeId)) return;
    if (temp.has(nodeId)) {
      throw new Error("Cycle detected in node graph");
    }

    temp.add(nodeId);

    (graph[nodeId] || []).forEach((dependency) => {
      visit(dependency);
    });

    temp.delete(nodeId);
    visited.add(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      result.unshift(node);
    }
  };

  // 모든 노드에 대해 DFS 수행
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      visit(node.id);
    }
  });

  return result;
}

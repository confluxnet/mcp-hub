export interface EvalResult {
  id: string;
  mcpId: string;
  testCaseId: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  pass: boolean;
  score: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  input: string;
  expectedOutput: string;
  evalCriteria: EvalCriteria[];
}

export interface EvalCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
  tags?: string[];
  createdAt?: number;
  createdBy?: string;
  isPublic?: boolean;
}

export interface EvalConfig {
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  evaluationMethod?: 'exact-match' | 'semantic-similarity' | 'regex' | 'criteria-based';
  similarityThreshold?: number;
  criteriaWeights?: Record<string, number>;
}

export interface EvalSummary {
  datasetId: string;
  mcpId: string;
  evalCount: number;
  successRate: number;
  averageScore: number;
  timestamp: number;
  evaluatedBy: string;
  config?: EvalConfig;
}

export interface EvalRun {
  id: string;
  mcpId: string;
  datasetId: string;
  startedAt: number;
  completedAt?: number;
  results: EvalResult[];
  summary?: EvalSummary;
  config: EvalConfig;
}

// Common Web3-specific test case categories
export const WEB3_TEST_CATEGORIES = [
  'transaction-analysis',
  'address-validation',
  'smart-contract-interaction',
  'wallet-operations',
  'defi-protocols',
  'nft-operations',
  'dao-governance',
  'cross-chain-operations',
  'gas-optimization',
  'security-analysis'
];

// Common evaluation criteria for Web3 agents
export const WEB3_EVAL_CRITERIA = [
  {
    id: 'accuracy',
    name: 'Information Accuracy',
    description: 'Correctly identifies blockchain-specific information'
  },
  {
    id: 'completeness',
    name: 'Completeness',
    description: 'Includes all relevant information about the transaction or operation'
  },
  {
    id: 'security-awareness',
    name: 'Security Awareness',
    description: 'Identifies security implications or risks'
  },
  {
    id: 'format-adherence',
    name: 'Format Adherence',
    description: 'Follows the required output format precisely'
  },
  {
    id: 'address-handling',
    name: 'Address Handling',
    description: 'Correctly processes blockchain addresses'
  },
  {
    id: 'token-identification',
    name: 'Token Identification',
    description: 'Correctly identifies tokens and their standards (ERC20, ERC721, etc.)'
  },
  {
    id: 'chain-awareness',
    name: 'Chain Awareness',
    description: 'Accurately identifies relevant blockchain networks'
  },
  {
    id: 'protocol-detection',
    name: 'Protocol Detection',
    description: 'Correctly identifies DeFi or other Web3 protocols'
  }
];
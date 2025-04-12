"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CodeBlock } from "@/components/CodeBlock";
import { CheckCircle, XCircle, FileText, Database } from "lucide-react";

// Types for MCP Evaluations
interface EvalResult {
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

interface TestCase {
  id: string;
  name: string;
  description: string;
  input: string;
  expectedOutput: string;
  evalCriteria: EvalCriteria[];
}

interface EvalCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
}

interface Dataset {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
}

interface EvaluatorProps {
  mcpId: string;
  mcpName: string;
  datasets?: Dataset[];
  onRunEval?: (mcpId: string, testCaseIds: string[]) => Promise<EvalResult[]>;
}

export function MCPEvaluator({ mcpId, mcpName, datasets = [], onRunEval }: EvaluatorProps) {
  const [activeTab, setActiveTab] = useState("datasets");
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [evalResults, setEvalResults] = useState<EvalResult[]>([]);
  const [isRunningEval, setIsRunningEval] = useState(false);
  const [newTestCase, setNewTestCase] = useState<Partial<TestCase>>({});
  const [newDataset, setNewDataset] = useState<Partial<Dataset>>({});

  // Mock datasets if none provided
  const mockDatasets: Dataset[] = [
    {
      id: "dataset-1",
      name: "Basic Web3 Transactions",
      description: "Tests basic transaction analysis and classification",
      testCases: [
        {
          id: "test-1",
          name: "Simple ETH Transfer",
          description: "Tests detection of a simple ETH transfer between wallets",
          input: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e transferred 1.5 ETH to 0x8ba1f109551bD432803012645Ac136ddd64DBA72",
          expectedOutput: "Transaction Type: ETH Transfer\nAmount: 1.5 ETH\nSender: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e\nReceiver: 0x8ba1f109551bD432803012645Ac136ddd64DBA72",
          evalCriteria: [
            { id: "criteria-1", name: "Transaction Type Detection", description: "Correctly identifies transaction type", weight: 0.4 },
            { id: "criteria-2", name: "Amount Extraction", description: "Correctly extracts transaction amount", weight: 0.3 },
            { id: "criteria-3", name: "Address Parsing", description: "Correctly identifies sender and receiver", weight: 0.3 }
          ]
        },
        {
          id: "test-2",
          name: "Token Swap",
          description: "Tests detection of a DEX token swap",
          input: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e swapped 50 USDT for 0.025 ETH on Uniswap",
          expectedOutput: "Transaction Type: Token Swap\nFrom Token: USDT\nFrom Amount: 50\nTo Token: ETH\nTo Amount: 0.025\nDEX: Uniswap\nWallet: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
          evalCriteria: [
            { id: "criteria-4", name: "DEX Detection", description: "Correctly identifies DEX used", weight: 0.3 },
            { id: "criteria-5", name: "Token Pair Detection", description: "Correctly identifies token pair", weight: 0.3 },
            { id: "criteria-6", name: "Amount Calculation", description: "Correctly calculates exchange amounts", weight: 0.4 }
          ]
        }
      ]
    },
    {
      id: "dataset-2",
      name: "Complex DeFi Interactions",
      description: "Tests analysis of complex DeFi operations",
      testCases: [
        {
          id: "test-3",
          name: "Liquidity Provision",
          description: "Tests detection of adding liquidity to a pool",
          input: "0x8ba1f109551bD432803012645Ac136ddd64DBA72 added 5 ETH and 10000 USDC to Curve Finance ETH-USDC pool",
          expectedOutput: "Transaction Type: Liquidity Provision\nProtocol: Curve Finance\nPool: ETH-USDC\nToken 1: ETH\nAmount 1: 5\nToken 2: USDC\nAmount 2: 10000\nWallet: 0x8ba1f109551bD432803012645Ac136ddd64DBA72",
          evalCriteria: [
            { id: "criteria-7", name: "Protocol Detection", description: "Correctly identifies the DeFi protocol", weight: 0.3 },
            { id: "criteria-8", name: "Pool Identification", description: "Correctly identifies the pool", weight: 0.3 },
            { id: "criteria-9", name: "Asset Amounts", description: "Correctly parses amounts for both assets", weight: 0.4 }
          ]
        }
      ]
    }
  ];

  const availableDatasets = datasets.length > 0 ? datasets : mockDatasets;

  // Run evaluation on selected dataset
  const runEvaluation = async () => {
    if (!selectedDataset || !onRunEval) return;
    
    try {
      setIsRunningEval(true);
      const testCaseIds = selectedDataset.testCases.map(tc => tc.id);
      const results = await onRunEval(mcpId, testCaseIds);
      setEvalResults(results);
    } catch (error) {
      console.error("Error running evaluations:", error);
    } finally {
      setIsRunningEval(false);
    }
  };

  // Generate mock evaluation results
  const generateMockResults = () => {
    if (!selectedDataset) return;
    
    setIsRunningEval(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const mockResults: EvalResult[] = selectedDataset.testCases.map(testCase => {
        const pass = Math.random() > 0.3; // 70% pass rate for demo
        return {
          id: `result-${testCase.id}`,
          mcpId,
          testCaseId: testCase.id,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: pass 
            ? testCase.expectedOutput 
            : testCase.expectedOutput.split('\n').map(line => 
                Math.random() > 0.5 ? line : `${line} [with some inaccuracy]`
              ).join('\n'),
          pass,
          score: pass ? 0.85 + (Math.random() * 0.15) : 0.5 + (Math.random() * 0.3),
          timestamp: Date.now(),
          metadata: {
            criteriaScores: testCase.evalCriteria.map(c => ({
              criteriaId: c.id,
              score: pass ? 0.8 + (Math.random() * 0.2) : 0.4 + (Math.random() * 0.4)
            }))
          }
        };
      });
      
      setEvalResults(mockResults);
      setIsRunningEval(false);
    }, 2000);
  };

  // Calculate overall success rate from results
  const calculateSuccessRate = (results: EvalResult[]) => {
    if (results.length === 0) return 0;
    const passedTests = results.filter(r => r.pass).length;
    return (passedTests / results.length) * 100;
  };

  // Calculate average score from results
  const calculateAverageScore = (results: EvalResult[]) => {
    if (results.length === 0) return 0;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    return (totalScore / results.length) * 100;
  };

  // Handle adding a new test case
  const handleAddTestCase = () => {
    if (!selectedDataset || !newTestCase.name || !newTestCase.input || !newTestCase.expectedOutput) {
      return;
    }

    const newTestCaseObj: TestCase = {
      id: `test-${Date.now()}`,
      name: newTestCase.name || "",
      description: newTestCase.description || "",
      input: newTestCase.input || "",
      expectedOutput: newTestCase.expectedOutput || "",
      evalCriteria: [
        { 
          id: `criteria-${Date.now()}`, 
          name: "Default Criteria", 
          description: "Basic evaluation criteria", 
          weight: 1.0 
        }
      ]
    };

    const updatedDataset = {
      ...selectedDataset,
      testCases: [...selectedDataset.testCases, newTestCaseObj]
    };

    // If we're using real datasets, we would need to update them in the parent component
    setSelectedDataset(updatedDataset);
    
    // If using mock data, update the mock datasets
    const updatedDatasets = availableDatasets.map(ds => 
      ds.id === selectedDataset.id ? updatedDataset : ds
    );
    
    setNewTestCase({});
  };

  // Handle creating a new dataset
  const handleCreateDataset = () => {
    if (!newDataset.name) return;
    
    const newDatasetObj: Dataset = {
      id: `dataset-${Date.now()}`,
      name: newDataset.name || "",
      description: newDataset.description || "",
      testCases: []
    };
    
    // If using real datasets, we would need to update them in the parent component
    
    // If using mock data, update the mock datasets
    const updatedDatasets = [...availableDatasets, newDatasetObj];
    setNewDataset({});
    setSelectedDataset(newDatasetObj);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between">
              <span>MCP Evaluator: {mcpName}</span>
              <Badge variant="secondary" className="ml-2">Beta</Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Test and improve MCP outputs through evaluations using standard datasets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="datasets">
                <Database className="w-4 h-4 mr-2" />
                Datasets
              </TabsTrigger>
              <TabsTrigger value="results">
                <FileText className="w-4 h-4 mr-2" />
                Evaluation Results
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="datasets" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Available Datasets</h3>
                  <div className="border rounded-md h-64 overflow-y-auto">
                    <ul className="divide-y">
                      {availableDatasets.map(dataset => (
                        <li 
                          key={dataset.id}
                          className={`p-3 cursor-pointer hover:bg-secondary/50 ${selectedDataset?.id === dataset.id ? 'bg-secondary' : ''}`}
                          onClick={() => setSelectedDataset(dataset)}
                        >
                          <div className="font-medium">{dataset.name}</div>
                          <div className="text-sm text-muted-foreground">{dataset.description}</div>
                          <div className="text-xs mt-1">
                            {dataset.testCases.length} test cases
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium">Create New Dataset</h4>
                    <div className="space-y-2">
                      <Input 
                        placeholder="Dataset Name" 
                        value={newDataset.name || ''}
                        onChange={e => setNewDataset({...newDataset, name: e.target.value})}
                      />
                      <Textarea 
                        placeholder="Dataset Description" 
                        value={newDataset.description || ''}
                        onChange={e => setNewDataset({...newDataset, description: e.target.value})}
                      />
                      <Button onClick={handleCreateDataset}>Create Dataset</Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  {selectedDataset ? (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Test Cases for {selectedDataset.name}</h3>
                        <Button onClick={generateMockResults} disabled={isRunningEval}>
                          {isRunningEval ? "Running..." : "Run Evaluation"}
                        </Button>
                      </div>
                      
                      <div className="border rounded-md h-64 overflow-y-auto">
                        <ul className="divide-y">
                          {selectedDataset.testCases.map(testCase => (
                            <li key={testCase.id} className="p-3">
                              <div className="font-medium">{testCase.name}</div>
                              <div className="text-sm text-muted-foreground">{testCase.description}</div>
                              <div className="mt-1 grid grid-cols-2 gap-2">
                                <div className="text-xs">
                                  <span className="font-medium">Input:</span> {testCase.input.substring(0, 30)}...
                                </div>
                                <div className="text-xs">
                                  <span className="font-medium">Expected:</span> {testCase.expectedOutput.substring(0, 30)}...
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium">Add New Test Case</h4>
                        <div className="space-y-2">
                          <Input 
                            placeholder="Test Case Name" 
                            value={newTestCase.name || ''}
                            onChange={e => setNewTestCase({...newTestCase, name: e.target.value})}
                          />
                          <Input 
                            placeholder="Description" 
                            value={newTestCase.description || ''}
                            onChange={e => setNewTestCase({...newTestCase, description: e.target.value})}
                          />
                          <Textarea 
                            placeholder="Input Data" 
                            value={newTestCase.input || ''}
                            onChange={e => setNewTestCase({...newTestCase, input: e.target.value})}
                          />
                          <Textarea 
                            placeholder="Expected Output" 
                            value={newTestCase.expectedOutput || ''}
                            onChange={e => setNewTestCase({...newTestCase, expectedOutput: e.target.value})}
                          />
                          <Button onClick={handleAddTestCase}>Add Test Case</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center border rounded-md p-6">
                      <div className="text-center text-muted-foreground">
                        Select a dataset to view and manage test cases
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="space-y-4">
              {evalResults.length > 0 ? (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm font-medium mb-1">Success Rate</div>
                        <div className="flex items-center">
                          <Progress value={calculateSuccessRate(evalResults)} className="h-2 flex-1 mr-2" />
                          <div className="font-medium">{calculateSuccessRate(evalResults).toFixed(1)}%</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm font-medium mb-1">Average Score</div>
                        <div className="flex items-center">
                          <Progress value={calculateAverageScore(evalResults)} className="h-2 flex-1 mr-2" />
                          <div className="font-medium">{calculateAverageScore(evalResults).toFixed(1)}%</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-4">
                    {evalResults.map(result => {
                      const testCase = selectedDataset?.testCases.find(tc => tc.id === result.testCaseId);
                      return (
                        <Card key={result.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base">{testCase?.name || "Test Case"}</CardTitle>
                              <Badge variant={result.pass ? "default" : "destructive"}>
                                {result.pass ? (
                                  <span className="flex items-center">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Pass
                                  </span>
                                ) : (
                                  <span className="flex items-center">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Fail
                                  </span>
                                )}
                              </Badge>
                            </div>
                            <CardDescription>{testCase?.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs">Input</Label>
                                <CodeBlock language="plaintext" code={result.input} />
                              </div>
                              <div>
                                <Label className="text-xs">Expected Output</Label>
                                <CodeBlock language="plaintext" code={result.expectedOutput} />
                              </div>
                            </div>
                            <div className="mt-4">
                              <Label className="text-xs">Actual Output</Label>
                              <CodeBlock language="plaintext" code={result.actualOutput} />
                            </div>
                            <div className="mt-4">
                              <Label className="text-xs">Score: {(result.score * 100).toFixed(1)}%</Label>
                              <Progress value={result.score * 100} className="h-2" />
                            </div>
                            {result.metadata?.criteriaScores && testCase?.evalCriteria && (
                              <div className="mt-4 space-y-2">
                                <Label className="text-xs">Criteria Scores</Label>
                                <div className="space-y-2">
                                  {result.metadata.criteriaScores.map((cs: any, idx: number) => {
                                    const criteria = testCase.evalCriteria[idx];
                                    return criteria ? (
                                      <div key={cs.criteriaId} className="grid grid-cols-2 gap-2">
                                        <div className="text-xs">{criteria.name}</div>
                                        <div className="flex items-center">
                                          <Progress value={cs.score * 100} className="h-1 flex-1 mr-2" />
                                          <div className="text-xs">{(cs.score * 100).toFixed(1)}%</div>
                                        </div>
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 border rounded-md">
                  <FileText className="w-12 h-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No evaluation results yet</p>
                  <p className="text-sm text-muted-foreground">Run an evaluation on a dataset to see results here</p>
                  <Button onClick={() => setActiveTab("datasets")} variant="outline" className="mt-4">
                    Go to Datasets
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
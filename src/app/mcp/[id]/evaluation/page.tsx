"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/CodeBlock";
import { useToast } from "@/components/ui/use-toast";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  Play,
  PlusCircle,
  Upload,
  FileUp,
  FileDown,
  RefreshCw,
  CheckCircle,
  XCircle,
  Info,
  FileCode,
  ArrowLeft,
  Download,
  Save
} from "lucide-react";

import mockMcpsData from "@/data/mockMcps.json";

// Types
interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  description?: string;
}

interface Dataset {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
}

interface EvaluationResult {
  testCaseId: string;
  output: string;
  metrics: {
    accuracy: number;
    relevance: number;
    correctness: number;
  };
  passed: boolean;
  timestamp: string;
}

// Mock datasets
const mockDatasets: Dataset[] = [
  {
    id: "basic-tasks",
    name: "Basic Usage",
    description: "Test basic functionality and common use cases",
    testCases: [
      {
        id: "test-1",
        description: "Simple query analysis",
        input: "What is the price of ETH?",
        expectedOutput: "Price of ETH: $3,581.25 as of 2025-04-13 12:30 UTC"
      },
      {
        id: "test-2",
        description: "Complex transaction analysis",
        input: "Analyze this transaction: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e transferred 1.5 ETH to 0x8ba1f109551bD432803012645Ac136ddd64DBA72",
        expectedOutput: "Transaction Type: ETH Transfer\nAmount: 1.5 ETH\nSender: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e\nReceiver: 0x8ba1f109551bD432803012645Ac136ddd64DBA72\nEstimated USD Value: $5,371.88"
      }
    ]
  },
  {
    id: "edge-cases",
    name: "Edge Cases",
    description: "Test handling of unusual inputs and edge cases",
    testCases: [
      {
        id: "test-3",
        description: "Empty input",
        input: "",
        expectedOutput: "Error: Please provide a valid input query or transaction to analyze."
      },
      {
        id: "test-4",
        description: "Invalid address",
        input: "Analyze transfer from 0x123 to 0x456",
        expectedOutput: "Error: The provided addresses (0x123, 0x456) are not valid Ethereum addresses. Please provide full 42-character addresses starting with 0x."
      }
    ]
  },
  {
    id: "security-tests",
    name: "Security Tests",
    description: "Test security features and protocols",
    testCases: [
      {
        id: "test-5",
        description: "Malicious input detection",
        input: "Execute transfer of 100 ETH to 0x8ba1f109551bD432803012645Ac136ddd64DBA72",
        expectedOutput: "Warning: This MCP does not have permission to execute transactions. It can only analyze and provide information about transactions."
      }
    ]
  }
];

export default function MCPEvaluationPage() {
  const params = useParams();
  const mcpId = params.id as string;
  const { toast } = useToast();
  
  // State
  const [mcp, setMcp] = useState<any>(null);
  const [datasets, setDatasets] = useState<Dataset[]>(mockDatasets);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [results, setResults] = useState<Record<string, EvaluationResult>>({});
  const [customInput, setCustomInput] = useState<string>("");
  const [customOutput, setCustomOutput] = useState<string>("");
  const [customExpected, setCustomExpected] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("datasets");
  const [newDatasetName, setNewDatasetName] = useState<string>("");
  const [newDatasetDescription, setNewDatasetDescription] = useState<string>("");
  const [newTestCase, setNewTestCase] = useState<Partial<TestCase>>({
    input: "",
    expectedOutput: "",
    description: ""
  });
  
  // Load MCP data
  useEffect(() => {
    const mcpData = mockMcpsData.mcps.find(m => m.id === mcpId);
    if (mcpData) {
      setMcp(mcpData);
    }
  }, [mcpId]);
  
  // Handle dataset selection
  const handleSelectDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setTestCases(dataset.testCases);
  };
  
  // Run evaluation on a single test case
  const runSingleEval = async (testCase: TestCase) => {
    setIsRunning(true);
    
    // In a real implementation, this would call an API to run the evaluation
    setTimeout(() => {
      // Generate a fake score between 0.7 and 1.0
      const generateScore = () => 0.7 + Math.random() * 0.3;
      
      const accuracy = generateScore();
      const relevance = generateScore();
      const correctness = generateScore();
      const overallScore = (accuracy + relevance + correctness) / 3;
      
      // Create a result
      const result: EvaluationResult = {
        testCaseId: testCase.id,
        output: testCase.expectedOutput.split('\n')
          .map(line => Math.random() > 0.8 ? `${line} [with some variance]` : line)
          .join('\n'),
        metrics: {
          accuracy,
          relevance,
          correctness
        },
        passed: overallScore > 0.8,
        timestamp: new Date().toISOString()
      };
      
      // Update results
      setResults(prev => ({
        ...prev,
        [testCase.id]: result
      }));
      
      setIsRunning(false);
    }, 1500);
  };
  
  // Run evaluation on all test cases in selected dataset
  const runAllEvals = async () => {
    if (!selectedDataset) return;
    
    setIsRunning(true);
    
    // Run evaluations sequentially with a small delay
    for (const testCase of selectedDataset.testCases) {
      await new Promise(resolve => setTimeout(resolve, 800));
      await runSingleEval(testCase);
    }
    
    setIsRunning(false);
    
    toast({
      title: "Evaluation Complete",
      description: `Completed evaluation on ${selectedDataset.testCases.length} test cases.`
    });
  };
  
  // Run custom evaluation
  const runCustomEval = async () => {
    if (!customInput.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please provide a valid input for evaluation.",
        variant: "destructive"
      });
      return;
    }
    
    setIsRunning(true);
    
    // In a real implementation, this would call an API to run the evaluation
    setTimeout(() => {
      // Create a custom output
      setCustomOutput(customExpected || "Generated output would appear here. When you provide an expected output, it will be compared to this result.");
      setIsRunning(false);
      
      toast({
        title: "Custom Evaluation Complete",
        description: "The model has processed your input."
      });
    }, 1500);
  };
  
  // Save custom test case to dataset
  const saveCustomTestCase = () => {
    if (!selectedDataset) {
      toast({
        title: "No Dataset Selected",
        description: "Please select or create a dataset first.",
        variant: "destructive"
      });
      return;
    }
    
    if (!customInput.trim() || !customOutput.trim()) {
      toast({
        title: "Incomplete Test Case",
        description: "Both input and output must be provided.",
        variant: "destructive"
      });
      return;
    }
    
    // Create a new test case
    const newTestCase: TestCase = {
      id: `test-${Date.now()}`,
      input: customInput,
      expectedOutput: customOutput,
      description: "Custom test case"
    };
    
    // Add to selected dataset
    const updatedDataset = {
      ...selectedDataset,
      testCases: [...selectedDataset.testCases, newTestCase]
    };
    
    // Update datasets
    setDatasets(datasets.map(d => d.id === selectedDataset.id ? updatedDataset : d));
    setSelectedDataset(updatedDataset);
    setTestCases(updatedDataset.testCases);
    
    toast({
      title: "Test Case Saved",
      description: "Your test case has been added to the dataset."
    });
    
    // Clear custom fields
    setCustomInput("");
    setCustomOutput("");
    setCustomExpected("");
  };
  
  // Create a new dataset
  const createNewDataset = () => {
    if (!newDatasetName.trim()) {
      toast({
        title: "Invalid Dataset Name",
        description: "Please provide a name for the dataset.",
        variant: "destructive"
      });
      return;
    }
    
    // Create a new dataset
    const newDataset: Dataset = {
      id: `dataset-${Date.now()}`,
      name: newDatasetName,
      description: newDatasetDescription || "Custom dataset",
      testCases: []
    };
    
    // Add to datasets
    setDatasets([...datasets, newDataset]);
    setSelectedDataset(newDataset);
    setTestCases([]);
    
    toast({
      title: "Dataset Created",
      description: "Your new dataset has been created."
    });
    
    // Clear fields
    setNewDatasetName("");
    setNewDatasetDescription("");
  };
  
  // Add a new test case to selected dataset
  const addTestCase = () => {
    if (!selectedDataset) {
      toast({
        title: "No Dataset Selected",
        description: "Please select or create a dataset first.",
        variant: "destructive"
      });
      return;
    }
    
    if (!newTestCase.input || !newTestCase.expectedOutput) {
      toast({
        title: "Incomplete Test Case",
        description: "Both input and expected output are required.",
        variant: "destructive"
      });
      return;
    }
    
    // Create a new test case
    const testCase: TestCase = {
      id: `test-${Date.now()}`,
      input: newTestCase.input,
      expectedOutput: newTestCase.expectedOutput,
      description: newTestCase.description
    };
    
    // Add to selected dataset
    const updatedDataset = {
      ...selectedDataset,
      testCases: [...selectedDataset.testCases, testCase]
    };
    
    // Update datasets
    setDatasets(datasets.map(d => d.id === selectedDataset.id ? updatedDataset : d));
    setSelectedDataset(updatedDataset);
    setTestCases(updatedDataset.testCases);
    
    toast({
      title: "Test Case Added",
      description: "Your test case has been added to the dataset."
    });
    
    // Clear fields
    setNewTestCase({
      input: "",
      expectedOutput: "",
      description: ""
    });
  };
  
  // Export dataset to JSON
  const exportDataset = () => {
    if (!selectedDataset) return;
    
    const dataStr = JSON.stringify(selectedDataset, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportLink = document.createElement('a');
    exportLink.setAttribute('href', dataUri);
    exportLink.setAttribute('download', `${selectedDataset.name.toLowerCase().replace(/\s+/g, '-')}.json`);
    document.body.appendChild(exportLink);
    exportLink.click();
    document.body.removeChild(exportLink);
    
    toast({
      title: "Dataset Exported",
      description: "Your dataset has been exported as JSON."
    });
  };
  
  // Calculate overall success rate
  const calculateSuccessRate = () => {
    if (!selectedDataset) return 0;
    
    const resultsForDataset = selectedDataset.testCases
      .filter(tc => results[tc.id])
      .map(tc => results[tc.id]);
    
    if (resultsForDataset.length === 0) return 0;
    
    const passedCount = resultsForDataset.filter(r => r.passed).length;
    return (passedCount / resultsForDataset.length) * 100;
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };
  
  if (!mcp) {
    return <div className="p-8 text-center">Loading MCP data...</div>;
  }
  
  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Link href={`/mcp/${mcpId}`} className="hover:underline inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to MCP
          </Link>
        </div>
        <h1 className="text-3xl font-bold">{mcp.title} Evaluation</h1>
        <p className="text-muted-foreground mt-1">
          Test and improve model outputs with standardized evaluations
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Datasets</CardTitle>
              <CardDescription>
                Standardized test cases for evaluation
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto">
                {datasets.map(dataset => (
                  <div 
                    key={dataset.id}
                    className={`p-4 border-b cursor-pointer hover:bg-secondary/50 ${selectedDataset?.id === dataset.id ? 'bg-secondary' : ''}`}
                    onClick={() => handleSelectDataset(dataset)}
                  >
                    <div className="font-medium">{dataset.name}</div>
                    <div className="text-sm text-muted-foreground">{dataset.description}</div>
                    <div className="text-xs mt-1">
                      {dataset.testCases.length} test cases
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setActiveTab("new-dataset")}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Dataset
              </Button>
              {selectedDataset && (
                <Button variant="outline" size="sm" onClick={exportDataset}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {selectedDataset && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Evaluation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Success Rate</span>
                      <span>{calculateSuccessRate().toFixed(1)}%</span>
                    </div>
                    <Progress value={calculateSuccessRate()} className="h-2" />
                  </div>
                  
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span>Test Cases</span>
                      <span>{selectedDataset.testCases.length}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Evaluated</span>
                      <span>
                        {selectedDataset.testCases.filter(tc => results[tc.id]).length} / {selectedDataset.testCases.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Passed</span>
                      <span>
                        {selectedDataset.testCases
                          .filter(tc => results[tc.id] && results[tc.id].passed).length}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={runAllEvals}
                  disabled={isRunning || selectedDataset.testCases.length === 0}
                >
                  {isRunning ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run All Evaluations
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="datasets">Test Cases</TabsTrigger>
              <TabsTrigger value="custom">Custom Evaluation</TabsTrigger>
              <TabsTrigger value="new-dataset">Create Dataset</TabsTrigger>
              <TabsTrigger value="new-test-case">Add Test Case</TabsTrigger>
            </TabsList>
            
            {/* Test Cases Tab */}
            <TabsContent value="datasets" className="space-y-4">
              {selectedDataset ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{selectedDataset.name}</h2>
                      <p className="text-muted-foreground">{selectedDataset.description}</p>
                    </div>
                  </div>
                  
                  {testCases.length > 0 ? (
                    testCases.map((testCase) => (
                      <Card key={testCase.id} className="mb-4">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">
                              {testCase.description || `Test Case ${testCase.id}`}
                            </CardTitle>
                            {results[testCase.id] && (
                              <Badge variant={results[testCase.id].passed ? "default" : "destructive"}>
                                {results[testCase.id].passed ? (
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
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-xs">Input</Label>
                              <div className="p-3 bg-secondary/50 rounded-md whitespace-pre-wrap">
                                {testCase.input}
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-xs">Expected Output</Label>
                              <div className="p-3 bg-secondary/50 rounded-md whitespace-pre-wrap">
                                {testCase.expectedOutput}
                              </div>
                            </div>
                            
                            {results[testCase.id] && (
                              <>
                                <div>
                                  <Label className="text-xs">Actual Output</Label>
                                  <div className="p-3 bg-secondary/50 rounded-md whitespace-pre-wrap">
                                    {results[testCase.id].output}
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-xs">Metrics</Label>
                                  <div className="grid grid-cols-3 gap-2 mt-1">
                                    <div>
                                      <div className="text-xs flex justify-between">
                                        <span>Accuracy</span>
                                        <span>{(results[testCase.id].metrics.accuracy * 100).toFixed(1)}%</span>
                                      </div>
                                      <Progress value={results[testCase.id].metrics.accuracy * 100} className="h-1" />
                                    </div>
                                    <div>
                                      <div className="text-xs flex justify-between">
                                        <span>Relevance</span>
                                        <span>{(results[testCase.id].metrics.relevance * 100).toFixed(1)}%</span>
                                      </div>
                                      <Progress value={results[testCase.id].metrics.relevance * 100} className="h-1" />
                                    </div>
                                    <div>
                                      <div className="text-xs flex justify-between">
                                        <span>Correctness</span>
                                        <span>{(results[testCase.id].metrics.correctness * 100).toFixed(1)}%</span>
                                      </div>
                                      <Progress value={results[testCase.id].metrics.correctness * 100} className="h-1" />
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-xs text-muted-foreground">
                                  Last evaluated: {formatTimestamp(results[testCase.id].timestamp)}
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            onClick={() => runSingleEval(testCase)} 
                            disabled={isRunning}
                            size="sm"
                            variant="outline"
                          >
                            {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                            Run Evaluation
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="p-8 text-center border rounded-md">
                      <p className="text-muted-foreground">No test cases in this dataset.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setActiveTab("new-test-case")}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Test Case
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center border rounded-md">
                  <p className="text-muted-foreground">Select a dataset from the sidebar to view test cases.</p>
                </div>
              )}
            </TabsContent>
            
            {/* Custom Evaluation Tab */}
            <TabsContent value="custom" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Evaluation</CardTitle>
                  <CardDescription>
                    Test the MCP with your own inputs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="custom-input">Input</Label>
                    <Textarea 
                      id="custom-input"
                      placeholder="Enter your test input here..."
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="min-h-32"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-expected">Expected Output (Optional)</Label>
                    <Textarea 
                      id="custom-expected"
                      placeholder="Enter the expected output for comparison..."
                      value={customExpected}
                      onChange={(e) => setCustomExpected(e.target.value)}
                      className="min-h-32"
                    />
                  </div>
                  
                  {customOutput && (
                    <div>
                      <Label>Output</Label>
                      <div className="p-4 bg-secondary/50 rounded-md whitespace-pre-wrap min-h-32">
                        {customOutput}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex space-x-2">
                    <Button 
                      onClick={runCustomEval} 
                      disabled={isRunning || !customInput.trim()}
                    >
                      {isRunning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                      Run Evaluation
                    </Button>
                    {customOutput && (
                      <Button 
                        variant="outline" 
                        onClick={saveCustomTestCase}
                        disabled={!selectedDataset}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save as Test Case
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Create Dataset Tab */}
            <TabsContent value="new-dataset" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Dataset</CardTitle>
                  <CardDescription>
                    Define a collection of test cases
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="dataset-name">Dataset Name</Label>
                    <Input 
                      id="dataset-name"
                      placeholder="e.g., Basic Functionality Tests"
                      value={newDatasetName}
                      onChange={(e) => setNewDatasetName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dataset-description">Description</Label>
                    <Textarea 
                      id="dataset-description"
                      placeholder="Describe the purpose of this dataset..."
                      value={newDatasetDescription}
                      onChange={(e) => setNewDatasetDescription(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={createNewDataset}
                    disabled={!newDatasetName.trim()}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Dataset
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Add Test Case Tab */}
            <TabsContent value="new-test-case" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add Test Case</CardTitle>
                  <CardDescription>
                    {selectedDataset 
                      ? `Add a test case to "${selectedDataset.name}"`
                      : "Select a dataset first to add test cases"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedDataset ? (
                    <>
                      <div>
                        <Label htmlFor="test-description">Description (Optional)</Label>
                        <Input 
                          id="test-description"
                          placeholder="e.g., Test handling of empty input"
                          value={newTestCase.description || ""}
                          onChange={(e) => setNewTestCase({...newTestCase, description: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="test-input">Input</Label>
                        <Textarea 
                          id="test-input"
                          placeholder="The input to test with..."
                          value={newTestCase.input || ""}
                          onChange={(e) => setNewTestCase({...newTestCase, input: e.target.value})}
                          className="min-h-24"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="test-expected">Expected Output</Label>
                        <Textarea 
                          id="test-expected"
                          placeholder="The expected output from the model..."
                          value={newTestCase.expectedOutput || ""}
                          onChange={(e) => setNewTestCase({...newTestCase, expectedOutput: e.target.value})}
                          className="min-h-24"
                        />
                      </div>
                    </>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>No Dataset Selected</AlertTitle>
                      <AlertDescription>
                        Please select an existing dataset or create a new one first.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={addTestCase}
                    disabled={!selectedDataset || !newTestCase.input || !newTestCase.expectedOutput}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Test Case
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* API Reference Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Evaluation API Reference</CardTitle>
          <CardDescription>
            Programmatically test and evaluate this MCP using the API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create">
            <TabsList className="mb-4">
              <TabsTrigger value="create">Create Eval</TabsTrigger>
              <TabsTrigger value="run">Run Eval</TabsTrigger>
              <TabsTrigger value="analyze">Analyze Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create">
              <Label className="mb-2 block">Create an evaluation configuration</Label>
              <CodeBlock 
                language="javascript" 
                code={`// Create an evaluation using the MCP Hub API
fetch("https://api.mcp.dog/v1/evals", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "MCP ${mcpId} Evaluation",
    mcp_id: "${mcpId}",
    data_source_config: {
      type: "custom",
      item_schema: {
        type: "object",
        properties: {
          input: { type: "string" },
          expected_output: { type: "string" }
        },
        required: ["input", "expected_output"]
      }
    },
    testing_criteria: [
      {
        type: "string_similarity",
        name: "Output Similarity",
        input: "{{ sample.output_text }}",
        reference: "{{ item.expected_output }}",
        threshold: 0.8
      }
    ]
  })
})`}
              />
            </TabsContent>
            
            <TabsContent value="run">
              <Label className="mb-2 block">Run an evaluation with test data</Label>
              <CodeBlock 
                language="javascript" 
                code={`// Run the evaluation with test data
fetch("https://api.mcp.dog/v1/evals/YOUR_EVAL_ID/runs", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "Test Run",
    data_source: {
      type: "file",
      file_id: "YOUR_FILE_ID", // Upload your test dataset first
      input_template: "{{ item.input }}"
    }
  })
})`}
              />
            </TabsContent>
            
            <TabsContent value="analyze">
              <Label className="mb-2 block">Analyze evaluation results</Label>
              <CodeBlock 
                language="javascript" 
                code={`// Get evaluation results
fetch("https://api.mcp.dog/v1/evals/YOUR_EVAL_ID/runs/YOUR_RUN_ID", {
  method: "GET",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY"
  }
})
.then(response => response.json())
.then(data => {
  console.log("Success rate:", data.metrics.success_rate);
  console.log("Detailed results:", data.results);
})`}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
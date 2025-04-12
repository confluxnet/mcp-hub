"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CodeBlock } from "@/components/CodeBlock";
import { ArrowRight, Code, Upload, CheckCircle2, RefreshCw, Database, Terminal } from "lucide-react";

interface ABIFunction {
  name: string;
  type: string;
  stateMutability?: string;
  inputs: {
    name: string;
    type: string;
    indexed?: boolean;
    components?: any[];
  }[];
  outputs?: {
    name: string;
    type: string;
    components?: any[];
  }[];
}

interface ABIEvent {
  name: string;
  type: string;
  anonymous?: boolean;
  inputs: {
    name: string;
    type: string;
    indexed?: boolean;
    components?: any[];
  }[];
}

interface GeneratedMCP {
  id: string;
  title: string;
  description: string;
  tags: string[];
  icon: string;
  category: string;
  apiEndpoints: string[];
  contractAddress: string;
  contractABI: any[];
  chainId: string;
  functions: ABIFunction[];
  events: ABIEvent[];
  codeExamples: {
    typescript: string;
    python: string;
    shell: string;
  };
}

const parseSolidity = (input: string): ABIFunction[] => {
  try {
    // Very basic Solidity parser (this would need to be more robust in production)
    const functions: ABIFunction[] = [];
    
    // Find function declarations
    const functionRegex = /function\s+(\w+)\s*\(([^)]*)\)\s*(public|private|internal|external)?\s*(view|pure|payable)?\s*(\w+)?\s*(\{|returns)/g;
    let match;
    
    while ((match = functionRegex.exec(input)) !== null) {
      const name = match[1];
      const params = match[2];
      const visibility = match[3] || 'public';
      const mutability = match[4] || (visibility === 'view' ? 'view' : 'nonpayable');
      
      // Parse parameters
      const inputs = params.split(',').filter(p => p.trim()).map(param => {
        const parts = param.trim().split(' ');
        return {
          type: parts[0],
          name: parts[1] || '',
        };
      });
      
      // Simple output detection
      const returnsMatch = input.slice(match.index).match(/returns\s*\(([^)]*)\)/);
      const outputs = returnsMatch ? returnsMatch[1].split(',').map(output => {
        const parts = output.trim().split(' ');
        return {
          type: parts[0],
          name: parts[1] || '',
        };
      }) : [];
      
      functions.push({
        name,
        type: 'function',
        stateMutability: mutability,
        inputs,
        outputs,
      });
    }
    
    return functions;
  } catch (error) {
    console.error("Error parsing Solidity:", error);
    return [];
  }
};

const generateApiEndpoints = (contractAddress: string, functions: ABIFunction[]) => {
  return [`https://api.mcp.dog/v1/contract/${contractAddress}`];
};

const getTagsFromABI = (functions: ABIFunction[], events: ABIEvent[]): string[] => {
  const tags: string[] = ["Smart Contract"];
  
  // Check for ERC standards
  const functionNames = functions.map(f => f.name.toLowerCase());
  const eventNames = events.map(e => e.name.toLowerCase());
  
  // ERC-20 detection
  if (
    functionNames.includes('transfer') &&
    functionNames.includes('approve') &&
    functionNames.includes('transferfrom') &&
    functionNames.includes('balanceof') &&
    functionNames.includes('allowance')
  ) {
    tags.push("ERC-20", "Token");
  }
  
  // ERC-721 detection
  if (
    functionNames.includes('transferfrom') &&
    functionNames.includes('balanceof') &&
    functionNames.includes('ownerof')
  ) {
    tags.push("ERC-721", "NFT");
  }
  
  // Governance detection
  if (
    functionNames.includes('vote') ||
    functionNames.includes('propose') ||
    functionNames.includes('execute') ||
    eventNames.includes('proposalcreated')
  ) {
    tags.push("Governance", "DAO");
  }
  
  // DeFi detection
  if (
    functionNames.includes('swap') ||
    functionNames.includes('addliquidity') ||
    functionNames.includes('removeliquidity') ||
    functionNames.includes('stake') ||
    functionNames.includes('unstake')
  ) {
    tags.push("DeFi");
  }
  
  return tags;
};

const generateTypeScriptExample = (mcp: GeneratedMCP) => {
  const readFunction = mcp.functions.find(f => 
    f.stateMutability === 'view' || f.stateMutability === 'pure'
  );
  
  const writeFunction = mcp.functions.find(f => 
    f.stateMutability === 'nonpayable' || f.stateMutability === 'payable'
  );
  
  let code = `// Example TypeScript implementation
import { MCPClient } from '@mcp/client';

const client = new MCPClient({
  apiKey: 'your-api-key',
  chainId: '${mcp.chainId}'
});

// Initialize the contract
const contract = client.getContract({
  address: '${mcp.contractAddress}',
  protocol: '${mcp.title}'
});
`;

  if (readFunction) {
    const params = readFunction.inputs.map(input => 
      `${input.name || 'param'}: ${input.type.includes('int') ? '123' : input.type.includes('string') ? '"example"' : '"0x..."'}`
    ).join(', ');
    
    code += `
// Read from the contract
const ${readFunction.name}Result = await contract.read({
  function: '${readFunction.name}',
  params: [${params}]
});
console.log('${readFunction.name} result:', ${readFunction.name}Result);
`;
  }

  if (writeFunction) {
    const params = writeFunction.inputs.map(input => 
      `${input.name || 'param'}: ${input.type.includes('int') ? '123' : input.type.includes('string') ? '"example"' : '"0x..."'}`
    ).join(', ');
    
    code += `
// Write to the contract
const tx = await contract.write({
  function: '${writeFunction.name}',
  params: [${params}]${writeFunction.stateMutability === 'payable' ? ',\n  value: "0.1"' : ''}
});
console.log('Transaction hash:', tx.hash);
await tx.wait();
console.log('Transaction confirmed');
`;
  }

  return code;
};

const generatePythonExample = (mcp: GeneratedMCP) => {
  const readFunction = mcp.functions.find(f => 
    f.stateMutability === 'view' || f.stateMutability === 'pure'
  );
  
  const writeFunction = mcp.functions.find(f => 
    f.stateMutability === 'nonpayable' || f.stateMutability === 'payable'
  );
  
  let code = `# Example Python implementation
from mcp_client import MCPClient

client = MCPClient(api_key='your-api-key', chain_id='${mcp.chainId}')

# Initialize the contract
contract = client.get_contract(
    address='${mcp.contractAddress}',
    protocol='${mcp.title}'
)
`;

  if (readFunction) {
    const params = readFunction.inputs.map(input => 
      `${input.name || 'param'}=${input.type.includes('int') ? '123' : input.type.includes('string') ? '"example"' : '"0x..."'}`
    ).join(', ');
    
    code += `
# Read from the contract
${readFunction.name}_result = contract.read(
    function='${readFunction.name}',
    params=[${params}]
)
print('${readFunction.name} result:', ${readFunction.name}_result)
`;
  }

  if (writeFunction) {
    const params = writeFunction.inputs.map(input => 
      `${input.name || 'param'}=${input.type.includes('int') ? '123' : input.type.includes('string') ? '"example"' : '"0x..."'}`
    ).join(', ');
    
    code += `
# Write to the contract
tx = contract.write(
    function='${writeFunction.name}',
    params=[${params}]${writeFunction.stateMutability === 'payable' ? ',\n    value="0.1"' : ''}
)
print('Transaction hash:', tx.hash)
tx.wait()
print('Transaction confirmed')
`;
  }

  return code;
};

const generateShellExample = (mcp: GeneratedMCP) => {
  const readFunction = mcp.functions.find(f => 
    f.stateMutability === 'view' || f.stateMutability === 'pure'
  );
  
  let code = `# Example Shell implementation
# Read from the contract
curl -X POST "https://api.mcp.dog/v1/contract/${mcp.contractAddress}/read" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\`;
  
  if (readFunction) {
    const params = readFunction.inputs.map(input => 
      `      "${input.name || 'param'}": ${input.type.includes('int') ? '123' : input.type.includes('string') ? '"example"' : '"0x..."'}`
    ).join(',\n');
    
    code += `
  -d '{
    "function": "${readFunction.name}",
    "params": {
${params}
    },
    "chainId": "${mcp.chainId}"
  }'`;
  } else {
    code += `
  -d '{
    "function": "${mcp.functions[0]?.name || 'exampleFunction'}",
    "params": {},
    "chainId": "${mcp.chainId}"
  }'`;
  }
  
  return code;
};

export function ABItoMCP() {
  const [inputType, setInputType] = useState<'abi' | 'solidity'>('abi');
  const [abiInput, setAbiInput] = useState<string>('');
  const [contractName, setContractName] = useState<string>('');
  const [contractAddress, setContractAddress] = useState<string>('');
  const [chainId, setChainId] = useState<string>('1');
  const [contractDescription, setContractDescription] = useState<string>('');
  
  const [generatedMCP, setGeneratedMCP] = useState<GeneratedMCP | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Process the ABI input and generate an MCP
  const processingABI = () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let parsedABI: any[] = [];
      let functions: ABIFunction[] = [];
      let events: ABIEvent[] = [];
      
      if (inputType === 'abi') {
        try {
          parsedABI = JSON.parse(abiInput);
          
          // Extract functions and events
          functions = parsedABI.filter(item => item.type === 'function') as ABIFunction[];
          events = parsedABI.filter(item => item.type === 'event') as ABIEvent[];
        } catch (error) {
          throw new Error('Invalid JSON format for ABI');
        }
      } else {
        // Parse Solidity code
        functions = parseSolidity(abiInput);
        events = [];
      }
      
      if (functions.length === 0) {
        throw new Error('No functions found in the provided input');
      }
      
      // Generate MCP data
      const tags = getTagsFromABI(functions, events);
      const apiEndpoints = generateApiEndpoints(contractAddress, functions);
      
      // Generate code examples
      const newMCP: GeneratedMCP = {
        id: `mcp-${Date.now()}`,
        title: contractName || 'Untitled Contract MCP',
        description: contractDescription || `MCP for interacting with ${contractName || 'the'} smart contract`,
        tags,
        icon: tags.includes('NFT') ? '🖼️' : tags.includes('Token') ? '💰' : tags.includes('DeFi') ? '💱' : tags.includes('DAO') ? '🏛️' : '📄',
        category: tags.includes('NFT') ? 'NFT' : tags.includes('DeFi') ? 'DeFi' : tags.includes('DAO') ? 'Governance' : 'Smart Contracts',
        apiEndpoints,
        contractAddress,
        contractABI: parsedABI,
        chainId,
        functions,
        events,
        codeExamples: {
          typescript: '',
          python: '',
          shell: ''
        }
      };
      
      // Generate code examples
      newMCP.codeExamples.typescript = generateTypeScriptExample(newMCP);
      newMCP.codeExamples.python = generatePythonExample(newMCP);
      newMCP.codeExamples.shell = generateShellExample(newMCP);
      
      setGeneratedMCP(newMCP);
    } catch (error: any) {
      setError(error.message || 'Failed to process ABI');
      console.error('Error processing ABI:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const chainOptions = [
    { id: '1', name: 'Ethereum Mainnet' },
    { id: '137', name: 'Polygon' },
    { id: '56', name: 'Binance Smart Chain' },
    { id: '43114', name: 'Avalanche C-Chain' },
    { id: '42161', name: 'Arbitrum' },
    { id: '10', name: 'Optimism' },
    { id: '5', name: 'Goerli Testnet' },
    { id: '80001', name: 'Mumbai Testnet' },
  ];
  
  const resetForm = () => {
    setGeneratedMCP(null);
    setError(null);
  };
  
  const createNewMCP = () => {
    // In a real application, this would submit the MCP to the marketplace
    alert('MCP created successfully! In a real implementation, this would be submitted to the marketplace.');
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>ABI to MCP Converter</CardTitle>
              <CardDescription>
                Create a new MCP from a smart contract ABI or Solidity code
              </CardDescription>
            </div>
            <Badge variant="outline">Beta</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!generatedMCP ? (
            <div className="space-y-6">
              <Tabs value={inputType} onValueChange={(value) => setInputType(value as 'abi' | 'solidity')}>
                <TabsList className="mb-4">
                  <TabsTrigger value="abi">
                    <Code className="w-4 h-4 mr-2" />
                    ABI JSON
                  </TabsTrigger>
                  <TabsTrigger value="solidity">
                    <Terminal className="w-4 h-4 mr-2" />
                    Solidity Code
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="abi" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="abi-input">Contract ABI (JSON format)</Label>
                    <Textarea 
                      id="abi-input"
                      placeholder={`[
  {
    "inputs": [],
    "name": "retrieve",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  ...
]`}
                      className="font-mono h-40"
                      value={abiInput}
                      onChange={(e) => setAbiInput(e.target.value)}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="solidity" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="solidity-input">Solidity Contract Code</Label>
                    <Textarea 
                      id="solidity-input"
                      placeholder={`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private value;
    
    function store(uint256 newValue) public {
        value = newValue;
    }
    
    function retrieve() public view returns (uint256) {
        return value;
    }
}`}
                      className="font-mono h-40"
                      value={abiInput}
                      onChange={(e) => setAbiInput(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract-name">Contract Name/MCP Title</Label>
                  <Input
                    id="contract-name"
                    placeholder="e.g. ERC20 Token MCP"
                    value={contractName}
                    onChange={(e) => setContractName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contract-address">Contract Address</Label>
                  <Input
                    id="contract-address"
                    placeholder="0x..."
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chain-id">Blockchain Network</Label>
                  <select
                    id="chain-id"
                    className="w-full p-2 border rounded-md"
                    value={chainId}
                    onChange={(e) => setChainId(e.target.value)}
                  >
                    {chainOptions.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contract-description">MCP Description</Label>
                  <Textarea
                    id="contract-description"
                    placeholder="Describe what this MCP does and how it can be used"
                    value={contractDescription}
                    onChange={(e) => setContractDescription(e.target.value)}
                  />
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                className="w-full" 
                onClick={processingABI} 
                disabled={isLoading || !abiInput.trim()}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Generate MCP
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>MCP Generated Successfully</AlertTitle>
                <AlertDescription>
                  Your smart contract has been converted to an MCP. You can now customize and publish it.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{generatedMCP.icon}</span>
                  <h3 className="text-lg font-semibold">{generatedMCP.title}</h3>
                </div>
                
                <p className="text-muted-foreground">{generatedMCP.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {generatedMCP.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Contract Address</Label>
                    <div className="font-mono text-sm p-2 bg-secondary rounded-md">
                      {generatedMCP.contractAddress || '0x...'}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Network</Label>
                    <div className="font-mono text-sm p-2 bg-secondary rounded-md">
                      {chainOptions.find(c => c.id === generatedMCP.chainId)?.name || 'Unknown Network'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Contract Functions</h3>
                <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                  {generatedMCP.functions.map((func, index) => (
                    <div key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-medium">{func.name}</span>
                        <Badge variant={
                          func.stateMutability === 'view' || func.stateMutability === 'pure' 
                            ? 'outline' 
                            : func.stateMutability === 'payable' 
                              ? 'destructive' 
                              : 'secondary'
                        }>
                          {func.stateMutability}
                        </Badge>
                      </div>
                      {func.inputs.length > 0 && (
                        <div className="mt-2">
                          <Label className="text-xs">Inputs</Label>
                          <ul className="text-sm font-mono">
                            {func.inputs.map((input, idx) => (
                              <li key={idx} className="text-muted-foreground">
                                {input.name ? `${input.name}: ${input.type}` : input.type}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {func.outputs && func.outputs.length > 0 && (
                        <div className="mt-2">
                          <Label className="text-xs">Outputs</Label>
                          <ul className="text-sm font-mono">
                            {func.outputs.map((output, idx) => (
                              <li key={idx} className="text-muted-foreground">
                                {output.name ? `${output.name}: ${output.type}` : output.type}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Code Examples</h3>
                <Tabs defaultValue="typescript">
                  <TabsList>
                    <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="shell">Shell</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="typescript" className="mt-2">
                    <CodeBlock language="typescript" code={generatedMCP.codeExamples.typescript} />
                  </TabsContent>
                  
                  <TabsContent value="python" className="mt-2">
                    <CodeBlock language="python" code={generatedMCP.codeExamples.python} />
                  </TabsContent>
                  
                  <TabsContent value="shell" className="mt-2">
                    <CodeBlock language="shell" code={generatedMCP.codeExamples.shell} />
                  </TabsContent>
                </Tabs>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={resetForm}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Start Over
                </Button>
                <Button className="flex-1" onClick={createNewMCP}>
                  <Database className="mr-2 h-4 w-4" />
                  Create MCP
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
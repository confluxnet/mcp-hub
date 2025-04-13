"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useToast } from "./ui/use-toast";
import { useRootstockFlyover } from "@/hooks/useRootstockFlyover";
// Define our own LiquidityProvider interface
interface LiquidityProvider {
  id: number;
  name: string;
  serviceFeeRate: number;
  serviceFee: bigint;
  active: boolean;
}

// Define types locally to avoid import issues
interface PeginQuote {
  id: string;
  providerId: number;
  amount: bigint;
  commission: bigint;
  estimatedDeliveryTime: number;
}

interface PegoutQuote {
  id: string;
  providerId: number;
  amount: bigint;
  commission: bigint;
  estimatedDeliveryTime: number;
}
import { Loader2 } from "lucide-react";

export function RootstockTradingAgent() {
  const [btcPrice, setBtcPrice] = useState<number>(65420);
  const [agentStatus, setAgentStatus] = useState<"idle" | "monitoring" | "trading" | "hedging">("idle");
  const [volatilityThreshold, setVolatilityThreshold] = useState<number>(5);
  const [balance, setBalance] = useState<string>("0");
  const [selectedStrategy, setSelectedStrategy] = useState<string>("volatility-hedge");
  const [btcAddress, setBtcAddress] = useState<string>("");
  const [btcAmount, setBtcAmount] = useState<string>("0.05");
  const [rbtcAmount, setRbtcAmount] = useState<string>("0.05");
  const [selectedPeginQuote, setSelectedPeginQuote] = useState<PeginQuote | null>(null);
  const [selectedPegoutQuote, setSelectedPegoutQuote] = useState<PegoutQuote | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("pegin");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize Flyover hook
  const {
    state,
    walletAccount,
    connectWallet,
    disconnectWallet,
    getWalletBalance,
    loadLiquidityProviders,
    selectProvider,
    getPeginQuotes,
    acceptPeginQuote,
    getPegoutQuotes,
    acceptPegoutQuote,
    depositPegout,
  } = useRootstockFlyover('testnet');

  // Handle wallet connection
  useEffect(() => {
    if (walletAccount) {
      const getBalance = async () => {
        const walletBalance = await getWalletBalance();
        setBalance(walletBalance);
      };
      getBalance();
    }
  }, [walletAccount, getWalletBalance]);

  // Simulated BTC price and volatility feed
  useEffect(() => {
    const interval = setInterval(() => {
      const change = Math.random() * 500 - 250;
      const newPrice = Math.max(btcPrice + change, 20000);
      setBtcPrice(Math.round(newPrice));
      
      // Simulate agent actions based on price movements
      if (agentStatus === "monitoring" && Math.abs(change) > volatilityThreshold * 200) {
        setAgentStatus("hedging");
        
        // Simulate trade after 2 seconds
        setTimeout(() => {
          if (change < 0) {
            // Price dropping, convert rBTC to stablecoin
            toast({
              title: "Hedge Position Executed",
              description: `AI Agent executing hedge strategy to protect against BTC price drop`,
            });
          } else {
            // Price rising, convert stablecoin back to rBTC
            toast({
              title: "Re-entry Position Executed",
              description: `AI Agent re-entering BTC position as market stabilizes`,
            });
          }
          setAgentStatus("monitoring");
        }, 2000);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [agentStatus, btcPrice, volatilityThreshold, toast]);

  // Calculate commission and delivery times
  const commissionRate = useMemo(() => {
    if (selectedPeginQuote) {
      return Number(selectedPeginQuote.commission) / Number(selectedPeginQuote.amount) * 100;
    }
    if (selectedPegoutQuote) {
      return Number(selectedPegoutQuote.commission) / Number(selectedPegoutQuote.amount) * 100;
    }
    return 0.5; // Default commission rate
  }, [selectedPeginQuote, selectedPegoutQuote]);

  const estimatedDeliveryMinutes = useMemo(() => {
    if (selectedPeginQuote) {
      return selectedPeginQuote.estimatedDeliveryTime / 60;
    }
    if (selectedPegoutQuote) {
      return selectedPegoutQuote.estimatedDeliveryTime / 60;
    }
    return 30; // Default delivery time in minutes
  }, [selectedPeginQuote, selectedPegoutQuote]);

  // Start/Stop trading agent
  const startAgent = () => {
    setAgentStatus("monitoring");
    toast({
      title: "Agent Activated",
      description: `Volatility management agent is now monitoring BTC price movements with ${volatilityThreshold}% threshold`,
    });
  };

  const stopAgent = () => {
    setAgentStatus("idle");
    toast({
      title: "Agent Deactivated",
      description: "Trading agent has been stopped",
    });
  };

  // Handle liquidity provider selection
  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    const provider = state.liquidityProviders.find(p => String(p.id) === providerId);
    if (provider) {
      selectProvider(provider);
    }
  };

  // Handle peg-in quote request
  const handleRequestPeginQuotes = async () => {
    if (!walletAccount) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }
    
    if (!state.selectedProvider) {
      toast({
        title: "Provider Required",
        description: "Please select a liquidity provider",
        variant: "destructive",
      });
      return;
    }
    
    const quotes = await getPeginQuotes(btcAmount);
    if (quotes && quotes.length > 0) {
      setSelectedPeginQuote(quotes[0]);
    }
  };

  // Handle peg-in quote acceptance
  const handleAcceptPeginQuote = async () => {
    if (!selectedPeginQuote) return;
    
    await acceptPeginQuote(selectedPeginQuote);
  };

  // Handle peg-out quote request
  const handleRequestPegoutQuotes = async () => {
    if (!walletAccount) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }
    
    if (!state.selectedProvider) {
      toast({
        title: "Provider Required",
        description: "Please select a liquidity provider",
        variant: "destructive",
      });
      return;
    }
    
    if (!btcAddress) {
      toast({
        title: "Bitcoin Address Required",
        description: "Please enter a Bitcoin address",
        variant: "destructive",
      });
      return;
    }
    
    const quotes = await getPegoutQuotes(rbtcAmount, btcAddress);
    if (quotes && quotes.length > 0) {
      setSelectedPegoutQuote(quotes[0]);
    }
  };

  // Handle peg-out quote acceptance and deposit
  const handlePegout = async () => {
    if (!selectedPegoutQuote || !state.acceptedPegoutQuote) return;
    
    await depositPegout(
      selectedPegoutQuote, 
      state.acceptedPegoutQuote.signature
    );
  };

  const acceptPegoutAndProceed = async () => {
    if (!selectedPegoutQuote) return;
    
    const accepted = await acceptPegoutQuote(selectedPegoutQuote);
    if (accepted) {
      handlePegout();
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Rootstock AI Trading Agent</h1>
          <p className="text-muted-foreground">Automated Bitcoin volatility management on RSK</p>
        </div>
        
        {!walletAccount ? (
          <Button onClick={connectWallet} disabled={state.isProcessingTransaction}>
            {state.isProcessingTransaction ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect RSK Wallet"
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1">
              RSK Testnet
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              Connected: {`${walletAccount.slice(0, 6)}...${walletAccount.slice(-4)}`}
            </Badge>
            <Button variant="outline" size="sm" onClick={disconnectWallet}>
              Disconnect
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Flyover Bridge Operations</CardTitle>
            <CardDescription>
              Seamlessly move between Bitcoin and Rootstock using the two-way peg
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="pegin">Bitcoin → RBTC (Peg-in)</TabsTrigger>
                <TabsTrigger value="pegout">RBTC → Bitcoin (Peg-out)</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pegin">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <h3 className="font-medium mb-2">Select Liquidity Provider</h3>
                    <Select 
                      value={selectedProvider || ""} 
                      onValueChange={handleProviderSelect}
                      disabled={state.isProcessingTransaction}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a liquidity provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.liquidityProviders.map(provider => (
                          <SelectItem key={String(provider.id)} value={String(provider.id)}>
                            {provider.name || `Provider ${provider.id}`} - Fee
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {state.liquidityProviders.length === 0 && !state.isLoadingProviders && (
                      <div className="mt-2">
                        <Button size="sm" onClick={loadLiquidityProviders}>
                          Load Providers
                        </Button>
                      </div>
                    )}
                    
                    {state.isLoadingProviders && (
                      <div className="flex items-center justify-center mt-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Loading providers...</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Peg-in Amount</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">BTC Amount</p>
                        <div className="flex gap-2">
                          <Input 
                            type="number" 
                            value={btcAmount} 
                            onChange={e => setBtcAmount(e.target.value)}
                            disabled={state.isProcessingTransaction}
                            step="0.001"
                            min="0.001"
                          />
                          <Button 
                            onClick={handleRequestPeginQuotes}
                            disabled={state.isProcessingTransaction || !state.selectedProvider}
                          >
                            {state.isProcessingTransaction ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Get Quote"
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {selectedPeginQuote && (
                        <div className="rounded-lg border p-3 bg-accent/10">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-sm font-medium">Commission</p>
                              <p>{commissionRate.toFixed(2)}%</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Estimated Delivery</p>
                              <p>{estimatedDeliveryMinutes} minutes</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">You Send</p>
                              <p>{btcAmount} BTC</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">You Receive</p>
                              <p>{btcAmount} RBTC</p>
                            </div>
                          </div>
                          
                          <Button 
                            onClick={handleAcceptPeginQuote}
                            className="w-full mt-3"
                            disabled={state.isProcessingTransaction}
                          >
                            {state.isProcessingTransaction ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Accept Quote"
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {state.acceptedPeginQuote && (
                        <div className="rounded-lg border p-3 bg-green-50 dark:bg-green-950/20">
                          <p className="font-medium">Deposit BTC to this address:</p>
                          <p className="mt-1 break-all bg-background p-2 rounded border select-all">
                            {state.btcAddress}
                          </p>
                          <p className="text-sm mt-2 text-muted-foreground">
                            The liquidity provider will send RBTC to your wallet once the BTC transaction is confirmed.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="pegout">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <h3 className="font-medium mb-2">Select Liquidity Provider</h3>
                    <Select 
                      value={selectedProvider || ""} 
                      onValueChange={handleProviderSelect}
                      disabled={state.isProcessingTransaction}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a liquidity provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.liquidityProviders.map(provider => (
                          <SelectItem key={String(provider.id)} value={String(provider.id)}>
                            {provider.name || `Provider ${provider.id}`} - Fee
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {state.liquidityProviders.length === 0 && !state.isLoadingProviders && (
                      <div className="mt-2">
                        <Button size="sm" onClick={loadLiquidityProviders}>
                          Load Providers
                        </Button>
                      </div>
                    )}
                    
                    {state.isLoadingProviders && (
                      <div className="flex items-center justify-center mt-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Loading providers...</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Peg-out Details</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">RBTC Amount</p>
                        <Input 
                          type="number" 
                          value={rbtcAmount} 
                          onChange={e => setRbtcAmount(e.target.value)}
                          disabled={state.isProcessingTransaction}
                          step="0.001"
                          min="0.001"
                        />
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Bitcoin Address</p>
                        <Input 
                          type="text" 
                          value={btcAddress} 
                          onChange={e => setBtcAddress(e.target.value)}
                          disabled={state.isProcessingTransaction}
                          placeholder="Enter your Bitcoin address"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleRequestPegoutQuotes}
                        disabled={state.isProcessingTransaction || !state.selectedProvider || !btcAddress}
                        className="w-full"
                      >
                        {state.isProcessingTransaction ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Getting Quote...
                          </>
                        ) : (
                          "Get Peg-out Quote"
                        )}
                      </Button>
                      
                      {selectedPegoutQuote && (
                        <div className="rounded-lg border p-3 bg-accent/10">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-sm font-medium">Commission</p>
                              <p>{commissionRate.toFixed(2)}%</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Estimated Delivery</p>
                              <p>{estimatedDeliveryMinutes} minutes</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">You Send</p>
                              <p>{rbtcAmount} RBTC</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">You Receive</p>
                              <p>{parseFloat(rbtcAmount) * (1 - commissionRate/100)} BTC</p>
                            </div>
                          </div>
                          
                          <Button 
                            onClick={acceptPegoutAndProceed}
                            className="w-full mt-3"
                            disabled={state.isProcessingTransaction}
                          >
                            {state.isProcessingTransaction ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Initiate Peg-out"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Trading Agent</CardTitle>
            <CardDescription>
              Automated volatility management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b pb-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-muted-foreground">Current BTC Price</p>
                  <p className="text-lg font-medium">${btcPrice.toLocaleString()}</p>
                </div>
                
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-sm text-muted-foreground">Agent Status:</p>
                  {agentStatus === "idle" && <Badge variant="outline">Inactive</Badge>}
                  {agentStatus === "monitoring" && <Badge variant="secondary" className="animate-pulse">Monitoring</Badge>}
                  {agentStatus === "hedging" && <Badge variant="destructive" className="animate-pulse">Hedging Position</Badge>}
                  {agentStatus === "trading" && <Badge variant="default" className="animate-pulse">Trading</Badge>}
                </div>
                
                <div>
                  <p className="text-sm mb-1">Volatility</p>
                  <Progress value={45} className="h-2" />
                </div>
              </div>
              
              <div className="border-b pb-3">
                <h3 className="font-medium mb-2">Strategy Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Trading Strategy</p>
                    <Select 
                      value={selectedStrategy} 
                      onValueChange={setSelectedStrategy}
                      disabled={agentStatus !== "idle"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="volatility-hedge">Volatility Hedge</SelectItem>
                        <SelectItem value="dca">Dollar Cost Average</SelectItem>
                        <SelectItem value="grid-trading">Grid Trading</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Volatility Threshold (%)</p>
                    <Input 
                      type="number" 
                      value={volatilityThreshold} 
                      onChange={e => setVolatilityThreshold(Number(e.target.value))}
                      min={1}
                      max={20}
                      disabled={agentStatus !== "idle"}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Wallet Balance</h3>
                <div className="border-b pb-2 mb-2">
                  <p className="text-sm text-muted-foreground">RBTC Balance</p>
                  <p className="text-lg font-medium">{parseFloat(balance).toFixed(6)} RBTC</p>
                  <p className="text-sm text-muted-foreground">${(parseFloat(balance) * btcPrice).toLocaleString()}</p>
                </div>
                
                {agentStatus === "idle" ? (
                  <Button 
                    onClick={startAgent} 
                    disabled={!walletAccount}
                    className="w-full"
                  >
                    Start Trading Agent
                  </Button>
                ) : (
                  <Button 
                    variant="destructive" 
                    onClick={stopAgent}
                    className="w-full"
                  >
                    Stop Agent
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Activity</CardTitle>
            <CardDescription>
              Recent Bitcoin/Rootstock bridge operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-5 bg-muted p-3 font-medium">
                <div>Type</div>
                <div>Amount</div>
                <div>Address</div>
                <div>Status</div>
                <div>Time</div>
              </div>
              <div className="divide-y">
                {state.transactions.map((tx, index) => (
                  <div key={index} className="grid grid-cols-5 p-3">
                    <div className="flex items-center">
                      <Badge variant={tx.type === 'pegin' ? "default" : "secondary"} className="mr-2">
                        {tx.type === 'pegin' ? "Peg-in" : "Peg-out"}
                      </Badge>
                    </div>
                    <div>{tx.amount} {tx.type === 'pegin' ? "BTC" : "RBTC"}</div>
                    <div className="truncate">{tx.btcAddress ? `${tx.btcAddress.slice(0, 10)}...` : "N/A"}</div>
                    <div>
                      <Badge variant={
                        tx.status === 'completed' ? "default" :
                        tx.status === 'failed' ? "destructive" : 
                        "outline"
                      }>
                        {tx.status}
                      </Badge>
                    </div>
                    <div>{new Date(tx.timestamp).toLocaleTimeString()}</div>
                  </div>
                ))}
                {state.transactions.length === 0 && (
                  <div className="p-3 text-center text-muted-foreground">
                    No transaction activity yet
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default RootstockTradingAgent;
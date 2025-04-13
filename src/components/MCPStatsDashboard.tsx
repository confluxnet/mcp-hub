"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  BarChart2,
  RefreshCw,
  Clock,
  TrendingUp,
  DollarSign,
  Activity,
  Package,
  Users,
  DownloadCloud,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Star,
  Info
} from 'lucide-react';

interface UsageStats {
  id: string;
  mcpId: string;
  mcpName: string;
  category: string;
  calls: number;
  tokensEarned: number;
  lastUsed: string;
}

interface MCPStats {
  id: string;
  title: string;
  category: string;
  icon: string;
  totalCalls: number;
  dailyAverage: number;
  weeklyGrowth: number;
  revenue: number;
  revenueGrowth: number;
  activeUsers: number;
  userGrowth: number;
  successRate: number;
  ranking: number;
  scoreData: { name: string; value: number }[];
}

interface UserRewards {
  totalTokens: number;
  pendingTokens: number;
  lastClaim: string;
  rewardsHistory: {
    date: string;
    amount: number;
    txHash: string;
  }[];
}

interface TimeSeriesData {
  name: string;
  calls: number;
  revenue: number;
}

interface RewardsTier {
  tier: string;
  minUsage: number;
  rewardMultiplier: number;
  color: string;
}

// Mock data for initial render
const mockUsageStats: UsageStats[] = [
  { id: '1', mcpId: '1', mcpName: 'AI Model Context', category: 'AI', calls: 1234, tokensEarned: 42.5, lastUsed: '2025-04-10T15:23:42Z' },
  { id: '2', mcpId: '7', mcpName: 'NEAR Cross-Chain Agent', category: 'Cross-Chain', calls: 876, tokensEarned: 28.3, lastUsed: '2025-04-12T09:12:31Z' },
  { id: '3', mcpId: '15', mcpName: 'Transaction Analyzer Agent', category: 'Analytics', calls: 2154, tokensEarned: 65.7, lastUsed: '2025-04-13T11:45:03Z' },
  { id: '4', mcpId: '8', mcpName: 'Ethereum DAO Governance Analyzer', category: 'Governance', calls: 532, tokensEarned: 19.2, lastUsed: '2025-04-08T16:37:22Z' },
  { id: '5', mcpId: '9', mcpName: 'Story Protocol IP Creator', category: 'Creative', calls: 321, tokensEarned: 15.4, lastUsed: '2025-04-06T14:28:17Z' }
];

const mockMCPStats: MCPStats[] = [
  {
    id: '1',
    title: 'AI Model Context',
    category: 'AI',
    icon: '🤖',
    totalCalls: 45600,
    dailyAverage: 1250,
    weeklyGrowth: 12.5,
    revenue: 15340.5,
    revenueGrowth: 8.2,
    activeUsers: 1240,
    userGrowth: 15.3,
    successRate: 98.2,
    ranking: 1,
    scoreData: [
      { name: 'Reliability', value: 95 },
      { name: 'Speed', value: 90 },
      { name: 'Accuracy', value: 97 },
      { name: 'Support', value: 85 }
    ]
  },
  {
    id: '15',
    title: 'Transaction Analyzer Agent',
    category: 'Analytics',
    icon: '📈',
    totalCalls: 38400,
    dailyAverage: 950,
    weeklyGrowth: 9.7,
    revenue: 12340.8,
    revenueGrowth: 5.4,
    activeUsers: 980,
    userGrowth: 10.2,
    successRate: 99.1,
    ranking: 2,
    scoreData: [
      { name: 'Reliability', value: 98 },
      { name: 'Speed', value: 88 },
      { name: 'Accuracy', value: 96 },
      { name: 'Support', value: 82 }
    ]
  },
  {
    id: '7',
    title: 'NEAR Cross-Chain Agent',
    category: 'Cross-Chain',
    icon: '🌐',
    totalCalls: 32100,
    dailyAverage: 750,
    weeklyGrowth: 14.2,
    revenue: 9870.6,
    revenueGrowth: 11.9,
    activeUsers: 820,
    userGrowth: 18.5,
    successRate: 97.8,
    ranking: 3,
    scoreData: [
      { name: 'Reliability', value: 92 },
      { name: 'Speed', value: 94 },
      { name: 'Accuracy', value: 91 },
      { name: 'Support', value: 87 }
    ]
  }
];

const mockUserRewards: UserRewards = {
  totalTokens: 172.5,
  pendingTokens: 28.6,
  lastClaim: '2025-04-01T12:00:00Z',
  rewardsHistory: [
    { date: '2025-04-01T12:00:00Z', amount: 45.2, txHash: '0x1234...abcd' },
    { date: '2025-03-01T12:00:00Z', amount: 52.3, txHash: '0x5678...efgh' },
    { date: '2025-02-01T12:00:00Z', amount: 38.7, txHash: '0x9012...ijkl' },
    { date: '2025-01-01T12:00:00Z', amount: 36.3, txHash: '0x3456...mnop' }
  ]
};

const mockTimeSeriesData: TimeSeriesData[] = [
  { name: 'Jan', calls: 4000, revenue: 2400 },
  { name: 'Feb', calls: 3000, revenue: 1398 },
  { name: 'Mar', calls: 2000, revenue: 9800 },
  { name: 'Apr', calls: 2780, revenue: 3908 },
  { name: 'May', calls: 1890, revenue: 4800 },
  { name: 'Jun', calls: 2390, revenue: 3800 },
  { name: 'Jul', calls: 3490, revenue: 4300 },
  { name: 'Aug', calls: 4000, revenue: 2400 },
  { name: 'Sep', calls: 3000, revenue: 1398 },
  { name: 'Oct', calls: 2000, revenue: 9800 },
  { name: 'Nov', calls: 2780, revenue: 3908 },
  { name: 'Dec', calls: 1890, revenue: 4800 }
];

const rewardsTiers: RewardsTier[] = [
  { tier: 'Bronze', minUsage: 0, rewardMultiplier: 1.0, color: '#CD7F32' },
  { tier: 'Silver', minUsage: 1000, rewardMultiplier: 1.2, color: '#C0C0C0' },
  { tier: 'Gold', minUsage: 5000, rewardMultiplier: 1.5, color: '#FFD700' },
  { tier: 'Platinum', minUsage: 10000, rewardMultiplier: 2.0, color: '#E5E4E2' },
  { tier: 'Diamond', minUsage: 25000, rewardMultiplier: 3.0, color: '#B9F2FF' }
];

// Color constants
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A4DE6C'];

export function MCPStatsDashboard() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [usageStats, setUsageStats] = useState<UsageStats[]>(mockUsageStats);
  const [mcpStats, setMCPStats] = useState<MCPStats[]>(mockMCPStats);
  const [userRewards, setUserRewards] = useState<UserRewards>(mockUserRewards);
  const [timeRange, setTimeRange] = useState<string>('month');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>(mockTimeSeriesData);
  const [userTier, setUserTier] = useState<RewardsTier>(rewardsTiers[0]);
  const { toast } = useToast();

  // Calculate user tier based on total usage
  useEffect(() => {
    const totalUsage = usageStats.reduce((sum, stat) => sum + stat.calls, 0);
    const newTier = rewardsTiers
      .filter(tier => tier.minUsage <= totalUsage)
      .reduce((prev, current) => (current.minUsage > prev.minUsage ? current : prev), rewardsTiers[0]);
    
    setUserTier(newTier);
  }, [usageStats]);

  // Function to refresh data
  const refreshData = async () => {
    setIsLoading(true);
    
    // In a real app, this would fetch from an API
    // Simulating API call with timeout
    setTimeout(() => {
      // Update with slightly modified random data for demo purposes
      const updatedUsageStats = usageStats.map(stat => ({
        ...stat,
        calls: stat.calls + Math.floor(Math.random() * 100),
        tokensEarned: stat.tokensEarned + Math.random() * 5
      }));
      
      setUsageStats(updatedUsageStats);
      setIsLoading(false);
      
      toast({
        title: 'Data refreshed',
        description: 'Latest statistics and rewards have been loaded.'
      });
    }, 1500);
  };

  // Function to claim rewards
  const claimRewards = async () => {
    setIsLoading(true);
    
    // Simulate claiming process
    setTimeout(() => {
      // Update rewards state
      setUserRewards({
        ...userRewards,
        totalTokens: userRewards.totalTokens + userRewards.pendingTokens,
        pendingTokens: 0,
        lastClaim: new Date().toISOString(),
        rewardsHistory: [
          {
            date: new Date().toISOString(),
            amount: userRewards.pendingTokens,
            txHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 10)}`
          },
          ...userRewards.rewardsHistory
        ]
      });
      
      setIsLoading(false);
      
      toast({
        title: 'Rewards claimed!',
        description: `You have successfully claimed ${userRewards.pendingTokens.toFixed(2)} tokens.`
      });
    }, 2000);
  };

  // Function to get user tier color
  const getTierColor = () => {
    return userTier.color;
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Calculate summary metrics
  const totalCalls = usageStats.reduce((sum, stat) => sum + stat.calls, 0);
  const totalEarned = usageStats.reduce((sum, stat) => sum + stat.tokensEarned, 0);
  
  // Category distribution for pie chart
  const categoryData = usageStats.reduce((acc, stat) => {
    const existingCategory = acc.find(item => item.name === stat.category);
    if (existingCategory) {
      existingCategory.value += stat.calls;
    } else {
      acc.push({ name: stat.category, value: stat.calls });
    }
    return acc;
  }, [] as { name: string, value: number }[]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">MCP Usage Dashboard</h2>
          <p className="text-muted-foreground">
            Track your MCP usage, earnings, and claim rewards
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div 
            className="flex items-center px-3 py-1 rounded-full text-sm font-medium"
            style={{ backgroundColor: `${getTierColor()}20`, color: getTierColor(), border: `1px solid ${getTierColor()}` }}
          >
            <Star className="w-4 h-4 mr-1" />
            {userTier.tier} Tier
          </div>
          <Button onClick={refreshData} variant="outline" size="sm" disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart2 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="mcps">
            <Package className="h-4 w-4 mr-2" />
            MCP Performance
          </TabsTrigger>
          <TabsTrigger value="rewards">
            <DollarSign className="h-4 w-4 mr-2" />
            Rewards
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCalls.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{Math.floor(Math.random() * 500)} from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tokens Earned</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEarned.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  +{(Math.random() * 10).toFixed(2)} from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MCPs Used</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats.length}</div>
                <p className="text-xs text-muted-foreground">
                  +{Math.floor(Math.random() * 3)} from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div 
                  className="text-2xl font-bold"
                  style={{ color: getTierColor() }}
                >
                  {userTier.tier}
                </div>
                <p className="text-xs text-muted-foreground">
                  {userTier.rewardMultiplier}x reward multiplier
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Usage By Category</CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value) => [`${value} calls`, 'Usage']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Usage Over Time</CardTitle>
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </CardHeader>
              <CardContent className="px-2">
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timeSeriesData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}`, 'Usage']} />
                      <Legend />
                      <Line type="monotone" dataKey="calls" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Usage Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent MCP Usage</CardTitle>
              <CardDescription>
                Your recent MCP calls and earned tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-5 border-b p-3 font-medium">
                  <div>MCP</div>
                  <div>Category</div>
                  <div className="text-center">API Calls</div>
                  <div className="text-center">Earned Tokens</div>
                  <div>Last Used</div>
                </div>
                {usageStats.map((stat) => (
                  <div key={stat.id} className="grid grid-cols-5 border-b p-3 last:border-0">
                    <div className="font-medium">{stat.mcpName}</div>
                    <div>
                      <Badge variant="outline">{stat.category}</Badge>
                    </div>
                    <div className="text-center">{stat.calls.toLocaleString()}</div>
                    <div className="text-center">
                      <span className="font-semibold">{stat.tokensEarned.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(stat.lastUsed)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Reward Tiers */}
          <Card>
            <CardHeader>
              <CardTitle>Reward Tiers</CardTitle>
              <CardDescription>
                Increase your usage to unlock higher reward multipliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border overflow-hidden">
                  {rewardsTiers.map((tier, index) => (
                    <div 
                      key={tier.tier} 
                      className={`p-3 flex justify-between items-center ${
                        index !== rewardsTiers.length - 1 ? 'border-b' : ''
                      } ${tier.tier === userTier.tier ? 'bg-secondary/50' : ''}`}
                    >
                      <div className="flex items-center">
                        <div 
                          className="h-6 w-6 rounded-full mr-3 flex items-center justify-center text-white"
                          style={{ backgroundColor: tier.color }}
                        >
                          {tier.tier === userTier.tier && <Star className="h-3 w-3" />}
                        </div>
                        <div>
                          <div className="font-medium">{tier.tier} Tier</div>
                          <div className="text-sm text-muted-foreground">
                            {tier.minUsage.toLocaleString()} minimum API calls
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-lg font-bold">{tier.rewardMultiplier}x</div>
                          <div className="text-sm text-muted-foreground">Multiplier</div>
                        </div>
                        {tier.tier === userTier.tier ? (
                          <Badge>Current Tier</Badge>
                        ) : totalCalls > tier.minUsage ? (
                          <Badge variant="outline" className="border-green-500 text-green-500">Unlocked</Badge>
                        ) : (
                          <Badge variant="outline" className="border-gray-500 text-gray-500">Locked</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>About Reward Tiers</AlertTitle>
                  <AlertDescription>
                    Reward tiers are calculated based on your total API calls. Higher tiers provide 
                    multipliers to your token earnings. Tiers are recalculated at the beginning of each month.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* MCP Performance Tab */}
        <TabsContent value="mcps" className="space-y-4">
          {/* MCP Performance Cards */}
          {mcpStats.map((mcp) => (
            <Card key={mcp.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="text-2xl">{mcp.icon}</div>
                    <CardTitle>{mcp.title}</CardTitle>
                  </div>
                  <Badge variant="secondary">#{mcp.ranking}</Badge>
                </div>
                <CardDescription>{mcp.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Total Calls</div>
                    <div className="text-2xl font-bold">{mcp.totalCalls.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <span className={`flex items-center ${mcp.weeklyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {mcp.weeklyGrowth >= 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {Math.abs(mcp.weeklyGrowth)}%
                      </span>
                      <span className="ml-1">this week</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Revenue</div>
                    <div className="text-2xl font-bold">${mcp.revenue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <span className={`flex items-center ${mcp.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {mcp.revenueGrowth >= 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {Math.abs(mcp.revenueGrowth)}%
                      </span>
                      <span className="ml-1">this week</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Active Users</div>
                    <div className="text-2xl font-bold">{mcp.activeUsers.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <span className={`flex items-center ${mcp.userGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {mcp.userGrowth >= 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {Math.abs(mcp.userGrowth)}%
                      </span>
                      <span className="ml-1">this week</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Success Rate</div>
                    <div className="text-2xl font-bold">{mcp.successRate}%</div>
                    <div className="text-xs text-muted-foreground">
                      <Progress value={mcp.successRate} className="h-1" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium mb-2">Performance Metrics</div>
                    <div style={{ width: '100%', height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={mcp.scoreData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" />
                          <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                          <Bar dataKey="value" fill="#8884d8" barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-2">Daily Average</div>
                    <div style={{ width: '100%', height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { day: 'Mon', calls: mcp.dailyAverage * 0.9 },
                            { day: 'Tue', calls: mcp.dailyAverage * 1.1 },
                            { day: 'Wed', calls: mcp.dailyAverage * 1.2 },
                            { day: 'Thu', calls: mcp.dailyAverage * 0.8 },
                            { day: 'Fri', calls: mcp.dailyAverage * 1.3 },
                            { day: 'Sat', calls: mcp.dailyAverage * 0.6 },
                            { day: 'Sun', calls: mcp.dailyAverage * 0.5 }
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value} calls`, 'Usage']} />
                          <Line type="monotone" dataKey="calls" stroke="#82ca9d" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          {/* Rewards Summary */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{userRewards.totalTokens.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Lifetime earnings
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{userRewards.pendingTokens.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Available to claim
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  onClick={claimRewards} 
                  disabled={isLoading || userRewards.pendingTokens <= 0}
                  className="w-full"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <DownloadCloud className="h-4 w-4 mr-2" />}
                  Claim Rewards
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Last Claim</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{formatDate(userRewards.lastClaim)}</div>
                <p className="text-xs text-muted-foreground">
                  <Clock className="inline h-3 w-3 mr-1" />
                  {new Date(userRewards.lastClaim).toLocaleDateString()} {new Date(userRewards.lastClaim).toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Revenue vs Usage Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs. Usage</CardTitle>
              <CardDescription>
                Correlation between your API calls and token earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeSeriesData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="calls" 
                      stroke="#8884d8" 
                      name="API Calls"
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#82ca9d" 
                      name="Earnings (Tokens)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Rewards History */}
          <Card>
            <CardHeader>
              <CardTitle>Rewards History</CardTitle>
              <CardDescription>
                Records of your token claim transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-3 border-b p-3 font-medium">
                  <div>Date</div>
                  <div>Amount</div>
                  <div>Transaction</div>
                </div>
                {userRewards.rewardsHistory.map((record, i) => (
                  <div key={i} className="grid grid-cols-3 border-b p-3 last:border-0">
                    <div>{formatDate(record.date)}</div>
                    <div className="font-medium">{record.amount.toFixed(2)} tokens</div>
                    <div className="font-mono text-xs flex items-center">
                      <a 
                        href={`https://etherscan.io/tx/${record.txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline overflow-hidden overflow-ellipsis"
                      >
                        {record.txHash}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Rewards Rate & Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Rewards Program</CardTitle>
              <CardDescription>
                How MCP rewards are calculated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="bg-secondary">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Current Reward Rate</AlertTitle>
                  <AlertDescription>
                    <p>Base rate: <span className="font-semibold">0.01 tokens per API call</span></p>
                    <p>Your tier multiplier: <span className="font-semibold">{userTier.rewardMultiplier}x</span></p>
                    <p>Your effective rate: <span className="font-semibold">{(0.01 * userTier.rewardMultiplier).toFixed(3)} tokens per API call</span></p>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Rewards Rules</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Rewards are calculated based on your total API calls to MCPs</li>
                    <li>Your reward tier multiplier is applied to your base earnings</li>
                    <li>Minimum claim amount is 10 tokens</li>
                    <li>Claims are processed on the blockchain and may take a few minutes</li>
                    <li>Reward rates are subject to periodic adjustments</li>
                    <li>Additional bonuses may be applied for using newly added MCPs</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Token Utility</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Pay for MCP API usage</li>
                    <li>Stake for governance rights</li>
                    <li>Access premium MCP features</li>
                    <li>Participate in DAO proposals</li>
                    <li>Reduced fees for MCP marketplace transactions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View Token Details</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
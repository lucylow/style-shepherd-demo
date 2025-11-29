import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Brain,
  Zap,
  BarChart3,
  RefreshCw,
  Filter,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { autonomousAgentService, type AutonomousAgentState, type AgentsOverview, type AgentActivity } from '@/services/autonomousAgentService';
import { toast } from 'sonner';

const AutonomousAgentsDashboard = () => {
  const [agents, setAgents] = useState<AutonomousAgentState[]>([]);
  const [overview, setOverview] = useState<AgentsOverview | null>(null);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setIsRefreshing(true);
      const [agentsData, overviewData, activitiesData] = await Promise.all([
        autonomousAgentService.getAllAgentsStatus(),
        autonomousAgentService.getAgentsOverview(),
        autonomousAgentService.getRecentActivities(20),
      ]);
      setAgents(agentsData);
      setOverview(overviewData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error loading agent data:', error);
      toast.error('Failed to load agent data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'degraded':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'unhealthy':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4" />;
      case 'unhealthy':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = agent.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.agentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHealth = healthFilter === 'all' || agent.health.healthy === healthFilter;
    return matchesSearch && matchesHealth;
  });

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Bot className="h-10 w-10 text-primary" />
            Autonomous Agents Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage your autonomous AI agents in real-time
          </p>
        </div>
        <Button onClick={loadData} disabled={isRefreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview.totalAgents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.healthyAgents} healthy, {overview.degradedAgents} degraded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.round(overview.averagePerformance * 100)}%
              </div>
              <Progress value={overview.averagePerformance * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Decisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview.totalDecisions}</div>
              <p className="text-xs text-muted-foreground mt-1">Autonomous decisions made</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview.activeGoals}</div>
              <p className="text-xs text-muted-foreground mt-1">Goals in progress</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={healthFilter} onValueChange={setHealthFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by health" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Health Status</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="degraded">Degraded</SelectItem>
            <SelectItem value="unhealthy">Unhealthy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="activities">Activity Feed</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          {filteredAgents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No agents found matching your filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAgents.map((agent) => (
                <motion.div
                  key={agent.agentId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="cursor-pointer"
                  onClick={() => setSelectedAgent(selectedAgent === agent.agentId ? null : agent.agentId)}
                >
                  <Card className={`h-full transition-all ${
                    selectedAgent === agent.agentId ? 'ring-2 ring-primary' : ''
                  }`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Bot className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{agent.agentName}</CardTitle>
                            <CardDescription className="text-xs mt-1">{agent.agentId}</CardDescription>
                          </div>
                        </div>
                        <Badge className={getHealthColor(agent.health.healthy)}>
                          {getHealthIcon(agent.health.healthy)}
                          <span className="ml-1 capitalize">{agent.health.healthy}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Health Score */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Health Score</span>
                            <span className="text-sm text-muted-foreground">
                              {Math.round(agent.health.healthScore * 100)}%
                            </span>
                          </div>
                          <Progress value={agent.health.healthScore * 100} />
                        </div>

                        {/* Performance Metrics */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Success Rate</div>
                            <div className="text-lg font-semibold">
                              {Math.round(agent.performance.successRate * 100)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Avg Latency</div>
                            <div className="text-lg font-semibold">{agent.performance.avgLatency}ms</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Throughput</div>
                            <div className="text-lg font-semibold">{agent.performance.throughput}/min</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Performance</div>
                            <div className="text-lg font-semibold">
                              {Math.round(agent.performance.performanceScore * 100)}%
                            </div>
                          </div>
                        </div>

                        {/* Goals */}
                        {agent.goals.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Active Goals</span>
                            </div>
                            <div className="space-y-2">
                              {agent.goals.slice(0, 2).map((goal) => (
                                <div key={goal.id} className="text-xs">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-muted-foreground truncate">{goal.description}</span>
                                    <span className="text-muted-foreground">
                                      {Math.round(goal.progress * 100)}%
                                    </span>
                                  </div>
                                  <Progress value={goal.progress * 100} className="h-1" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recent Decisions */}
                        {agent.recentDecisions.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Recent Decisions</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {agent.recentDecisions.length} decision{agent.recentDecisions.length > 1 ? 's' : ''} in last hour
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Real-time activity feed from all autonomous agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                <AnimatePresence>
                  {activities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${
                          activity.status === 'success' ? 'bg-green-500' :
                          activity.status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                          activity.status === 'failed' ? 'bg-red-500' :
                          'bg-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">{activity.agentName}</span>
                          <Badge variant="outline" className="text-xs">
                            {activity.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{activity.action}</p>
                        {activity.details && (
                          <p className="text-xs text-muted-foreground italic">{activity.details}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(activity.timestamp)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {activities.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent activity
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutonomousAgentsDashboard;


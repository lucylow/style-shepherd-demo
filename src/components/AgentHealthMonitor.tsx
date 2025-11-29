import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  BarChart3,
  RefreshCw,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { autonomousAgentService, type AutonomousAgentState } from '@/services/autonomousAgentService';
import { toast } from 'sonner';

interface AgentHealthMonitorProps {
  agentId?: string;
  compact?: boolean;
}

const AgentHealthMonitor = ({ agentId, compact = false }: AgentHealthMonitorProps) => {
  const [agent, setAgent] = useState<AutonomousAgentState | null>(null);
  const [agents, setAgents] = useState<AutonomousAgentState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [agentId]);

  const loadData = async () => {
    try {
      setIsRefreshing(true);
      if (agentId) {
        const data = await autonomousAgentService.getAgentStatus(agentId);
        setAgent(data);
      } else {
        const data = await autonomousAgentService.getAllAgentsStatus();
        setAgents(data);
      }
    } catch (error) {
      console.error('Error loading agent health data:', error);
      toast.error('Failed to load agent health data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'unhealthy':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getHealthBadgeVariant = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'unhealthy':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatUptime = (lastCheck: number) => {
    const now = Date.now();
    const diff = now - lastCheck;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading agent health data...</p>
        </CardContent>
      </Card>
    );
  }

  if (agentId && agent) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Health Monitor
              </CardTitle>
              <CardDescription>{agent.agentName}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadData} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Health Status */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Health Status</span>
                <Badge variant={getHealthBadgeVariant(agent.health.healthy)}>
                  {agent.health.healthy.toUpperCase()}
                </Badge>
              </div>
              <Progress value={agent.health.healthScore * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Last checked: {formatUptime(agent.health.lastHealthCheck)}
              </p>
            </div>

            {/* Performance Metrics */}
            <div>
              <h4 className="text-sm font-medium mb-3">Performance Metrics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Success Rate</div>
                  <div className="text-lg font-semibold">
                    {Math.round(agent.performance.successRate * 100)}%
                  </div>
                  <Progress value={agent.performance.successRate * 100} className="h-1 mt-1" />
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
                  <div className="text-xs text-muted-foreground mb-1">Error Rate</div>
                  <div className="text-lg font-semibold text-red-500">
                    {Math.round(agent.performance.errorRate * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Goals */}
            {agent.goals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Active Goals</h4>
                <div className="space-y-3">
                  {agent.goals.map((goal) => (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{goal.description}</span>
                        <Badge variant="outline" className="text-xs">
                          {goal.status}
                        </Badge>
                      </div>
                      <Progress value={goal.progress * 100} className="h-1" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Priority: {goal.priority}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Decisions */}
            {agent.recentDecisions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Recent Decisions</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {agent.recentDecisions.slice(0, 5).map((decision) => (
                    <div key={decision.id} className="p-2 bg-muted/50 rounded text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{decision.decisionType}</span>
                        <Badge variant={decision.outcome === 'success' ? 'default' : 'destructive'} className="text-xs">
                          {decision.outcome}
                        </Badge>
                      </div>
                      {decision.reasoning && (
                        <p className="text-muted-foreground text-xs mt-1">{decision.reasoning}</p>
                      )}
                      <p className="text-muted-foreground text-xs mt-1">
                        Confidence: {Math.round(decision.confidence * 100)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!agentId && agents.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Agent Health Overview</h3>
          <Button variant="outline" size="sm" onClick={loadData} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <motion.div
              key={agent.agentId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{agent.agentName}</CardTitle>
                    <Badge variant={getHealthBadgeVariant(agent.health.healthy)}>
                      {agent.health.healthy}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Health</span>
                        <span>{Math.round(agent.health.healthScore * 100)}%</span>
                      </div>
                      <Progress value={agent.health.healthScore * 100} className="h-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Success</span>
                        <div className="font-semibold">
                          {Math.round(agent.performance.successRate * 100)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Latency</span>
                        <div className="font-semibold">{agent.performance.avgLatency}ms</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {agent.goals.length} active goal{agent.goals.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No agent data available</p>
      </CardContent>
    </Card>
  );
};

export default AgentHealthMonitor;


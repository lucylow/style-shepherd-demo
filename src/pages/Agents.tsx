import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Mic, 
  Languages, 
  Sparkles, 
  Search,
  Play,
  TrendingUp,
  DollarSign,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { agentService } from '@/services/agentService';
import type { VoiceAgent, ConversationExample } from '@/mocks/elevenAgentsTypes';
import { toast } from 'sonner';

const Agents = () => {
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<VoiceAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<VoiceAgent | null>(null);
  const [conversations, setConversations] = useState<ConversationExample[]>([]);
  const [usageData, setUsageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCapability, setFilterCapability] = useState<string>('all');
  const [filterStyle, setFilterStyle] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  // Load agents on mount
  useEffect(() => {
    loadAgents();
  }, []);

  // Load conversations when agent is selected
  useEffect(() => {
    if (selectedAgent) {
      loadConversations(selectedAgent.agent_id);
    }
  }, [selectedAgent]);

  const loadAgents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await agentService.getAllAgents();
      setAgents(response.agents);
      setFilteredAgents(response.agents);
    } catch (err: any) {
      console.error('Error loading agents:', err);
      setError(err.message || 'Failed to load agents');
      toast.error('Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async (agentId: string) => {
    try {
      const response = await agentService.getConversationsByAgent(agentId);
      setConversations(response.conversations);
    } catch (err: any) {
      console.error('Error loading conversations:', err);
    }
  };

  const loadUsageData = async () => {
    try {
      const data = await agentService.getUsageBilling();
      setUsageData(data.usage_and_billing);
    } catch (err: any) {
      console.error('Error loading usage data:', err);
    }
  };

  // Get all unique capabilities
  const allCapabilities = useMemo(() => {
    const caps = new Set<string>();
    agents.forEach(agent => {
      agent.capabilities.forEach(cap => caps.add(cap));
    });
    return Array.from(caps).sort();
  }, [agents]);

  // Get all unique style tags
  const allStyleTags = useMemo(() => {
    const tags = new Set<string>();
    agents.forEach(agent => {
      agent.style_tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [agents]);

  // Filter agents based on search and filters
  useEffect(() => {
    let filtered = [...agents];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(agent =>
        agent.display_name.toLowerCase().includes(query) ||
        agent.persona.toLowerCase().includes(query) ||
        agent.capabilities.some(cap => cap.toLowerCase().includes(query)) ||
        agent.style_tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Capability filter
    if (filterCapability !== 'all') {
      filtered = filtered.filter(agent =>
        agent.capabilities.includes(filterCapability)
      );
    }

    // Style filter
    if (filterStyle !== 'all') {
      filtered = filtered.filter(agent =>
        agent.style_tags.includes(filterStyle)
      );
    }

    setFilteredAgents(filtered);
  }, [agents, searchQuery, filterCapability, filterStyle]);

  // Load usage data when usage tab is selected
  useEffect(() => {
    if (activeTab === 'usage' && !usageData) {
      loadUsageData();
    }
  }, [activeTab, usageData]);

  const handleAgentSelect = (agent: VoiceAgent) => {
    setSelectedAgent(agent);
    setActiveTab('details');
  };

  const handleTestAgent = (agent: VoiceAgent) => {
    toast.info(`Testing ${agent.display_name}...`, {
      description: 'Voice agent testing coming soon',
    });
  };

  const AgentCard = ({ agent }: { agent: VoiceAgent }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className={`cursor-pointer transition-all hover:shadow-lg ${
          selectedAgent?.agent_id === agent.agent_id ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => handleAgentSelect(agent)}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{agent.display_name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mic className="h-3 w-3" />
                  {agent.voice_id}
                </CardDescription>
              </div>
            </div>
            <Badge variant={agent.gender === 'male' ? 'default' : 'secondary'}>
              {agent.gender}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {agent.persona}
          </p>
          <div className="flex flex-wrap gap-1 mb-3">
            {agent.style_tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {agent.style_tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{agent.style_tags.length - 3}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {agent.capabilities.length} capabilities
            </span>
            <span className="flex items-center gap-1">
              <Languages className="h-3 w-3" />
              {agent.language}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const AgentDetails = () => {
    if (!selectedAgent) return null;

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Bot className="h-6 w-6" />
                  {selectedAgent.display_name}
                </CardTitle>
                <CardDescription className="mt-2">{selectedAgent.persona}</CardDescription>
              </div>
              <Button onClick={() => handleTestAgent(selectedAgent)} size="sm">
                <Play className="h-4 w-4 mr-2" />
                Test Agent
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                <TabsTrigger value="voice">Voice Settings</TabsTrigger>
                <TabsTrigger value="conversations">Conversations</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Voice ID</p>
                    <p className="text-sm text-muted-foreground">{selectedAgent.voice_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Language</p>
                    <p className="text-sm text-muted-foreground">{selectedAgent.language}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Gender</p>
                    <p className="text-sm text-muted-foreground capitalize">{selectedAgent.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Style Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAgent.style_tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Sample Phrases</p>
                  <div className="space-y-2">
                    {selectedAgent.sample_phrases.map((phrase, idx) => (
                      <div key={idx} className="p-2 bg-muted rounded-md text-sm">
                        "{phrase}"
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="capabilities" className="mt-4">
                <div className="grid grid-cols-2 gap-2">
                  {selectedAgent.capabilities.map(cap => (
                    <Badge key={cap} variant="secondary" className="justify-center py-2">
                      {cap.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="voice" className="mt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Stability</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${selectedAgent.stability * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {Math.round(selectedAgent.stability * 100)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Similarity Boost</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${selectedAgent.similarity_boost * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {Math.round(selectedAgent.similarity_boost * 100)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Speed</p>
                      <p className="text-sm text-muted-foreground">{selectedAgent.default_speed}x</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Pitch</p>
                      <p className="text-sm text-muted-foreground">{selectedAgent.default_pitch > 0 ? '+' : ''}{selectedAgent.default_pitch}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Fallback Order</p>
                    <div className="space-y-1">
                      {selectedAgent.fallback_order.map((fallback, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground w-6">{idx + 1}.</span>
                          <Badge variant="outline">{fallback}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="conversations" className="mt-4">
                <ScrollArea className="h-[400px]">
                  {conversations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No conversation examples available
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {conversations.map(conv => (
                        <Card key={conv.session_id}>
                          <CardHeader>
                            <CardTitle className="text-sm">Session: {conv.session_id}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {conv.turns.map((turn, idx) => (
                                <div
                                  key={idx}
                                  className={`p-3 rounded-lg ${
                                    turn.speaker === 'agent'
                                      ? 'bg-primary/10 ml-8'
                                      : turn.speaker === 'merchant'
                                      ? 'bg-secondary/50 ml-4'
                                      : 'bg-muted mr-8'
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="text-xs font-medium capitalize">
                                      {turn.speaker}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(turn.ts).toLocaleTimeString()}
                                    </span>
                                  </div>
                                  <p className="text-sm">{turn.text}</p>
                                  {turn.actions && turn.actions.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {turn.actions.map((action, actionIdx) => (
                                        <Badge key={actionIdx} variant="outline" className="text-xs">
                                          {action}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const UsageStats = () => {
    if (!usageData) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {usageData.agent_usage_examples.map((usage: any) => {
                const agent = agents.find(a => a.agent_id === usage.agent_id);
                return (
                  <Card key={usage.agent_id}>
                    <CardHeader>
                      <CardTitle className="text-sm">{agent?.display_name || usage.agent_id}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Monthly Calls</span>
                          <span className="font-medium">{usage.monthly_calls.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Avg Duration</span>
                          <span className="font-medium">{usage.avg_duration_sec}s</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Est. Cost
                          </span>
                          <span className="font-medium">${usage.estimated_tts_cost_usd.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quota Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Free Tier</p>
                <p className="text-2xl font-bold">{usageData.quota.free_tier_calls.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">calls/month</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Premium Tier</p>
                <p className="text-2xl font-bold">{usageData.quota.premium_tier_calls.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">calls/month</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">{usageData.quota.notes}</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Bot className="h-10 w-10" />
          AI Agents
        </h1>
        <p className="text-muted-foreground">
          Manage and explore our collection of 11 specialized voice agents
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="all">All Agents</TabsTrigger>
          <TabsTrigger value="details">Agent Details</TabsTrigger>
          <TabsTrigger value="usage">Usage & Billing</TabsTrigger>
          <TabsTrigger value="search">Find Agent</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents by name, persona, or capability..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCapability} onValueChange={setFilterCapability}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by capability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Capabilities</SelectItem>
                {allCapabilities.map(cap => (
                  <SelectItem key={cap} value={cap}>
                    {cap.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStyle} onValueChange={setFilterStyle}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Styles</SelectItem>
                {allStyleTags.map(tag => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredAgents.length} of {agents.length} agents
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAgents.map(agent => (
                  <AgentCard key={agent.agent_id} agent={agent} />
                ))}
              </div>
              {filteredAgents.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No agents found matching your filters</p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="details">
          {selectedAgent ? (
            <AgentDetails />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Select an agent to view details</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="usage">
          <UsageStats />
        </TabsContent>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find the Right Agent
              </CardTitle>
              <CardDescription>
                Use context to find the best agent for your use case
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgentSuggestionForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AgentSuggestionForm = () => {
  const [intent, setIntent] = useState('');
  const [capability, setCapability] = useState('');
  const [style, setStyle] = useState('');
  const [userType, setUserType] = useState<'customer' | 'merchant' | 'vip' | ''>('');
  const [suggestedAgent, setSuggestedAgent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSuggest = async () => {
    if (!intent && !capability && !style && !userType) {
      toast.error('Please provide at least one search criterion');
      return;
    }

    setIsLoading(true);
    try {
      const context: any = {};
      if (intent) context.intent = intent;
      if (capability) context.capability = capability;
      if (style) context.style = style;
      if (userType) context.userType = userType;

      const response = await agentService.suggestAgent(context);
      setSuggestedAgent(response);
      toast.success(`Found: ${response.agent.display_name}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to suggest agent');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Intent</label>
          <Input
            placeholder="e.g., help with returns"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Capability</label>
          <Input
            placeholder="e.g., return_flow"
            value={capability}
            onChange={(e) => setCapability(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Style Tag</label>
          <Input
            placeholder="e.g., empathetic"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">User Type</label>
          <Select value={userType} onValueChange={(v) => setUserType(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select user type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="merchant">Merchant</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={handleSuggest} disabled={isLoading} className="w-full">
        {isLoading ? 'Searching...' : 'Find Agent'}
      </Button>

      {suggestedAgent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{suggestedAgent.agent.display_name}</CardTitle>
              <CardDescription>{suggestedAgent.agent.persona}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {suggestedAgent.agent.capabilities.map((cap: string) => (
                    <Badge key={cap} variant="secondary">{cap.replace(/_/g, ' ')}</Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Suggested for: {JSON.stringify(suggestedAgent.suggested_for, null, 2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Agents;


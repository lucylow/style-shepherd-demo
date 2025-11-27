import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Network, 
  Send, 
  Bot, 
  Sparkles, 
  Ruler, 
  TrendingUp,
  Palette,
  ArrowRight,
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AgentNode {
  id: string;
  name: string;
  icon: typeof Bot;
  color: string;
  position: { x: number; y: number };
}

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
}

const agents: AgentNode[] = [
  { id: "personal-shopper", name: "Personal Shopper", icon: Sparkles, color: "bg-primary", position: { x: 50, y: 50 } },
  { id: "size-predictor", name: "Size Predictor", icon: Ruler, color: "bg-fashion-gold", position: { x: 25, y: 75 } },
  { id: "returns-predictor", name: "Returns Predictor", icon: TrendingUp, color: "bg-green-500", position: { x: 75, y: 50 } },
  { id: "makeup-artist", name: "Makeup Artist", icon: Palette, color: "bg-pink-500", position: { x: 50, y: 25 } },
];

const sampleMessages: Omit<Message, "id" | "timestamp">[] = [
  { from: "personal-shopper", to: "size-predictor", content: "Request size for Levi's 511" },
  { from: "size-predictor", to: "returns-predictor", content: "Size: 31, check return risk" },
  { from: "returns-predictor", to: "personal-shopper", content: "Low risk (12%), recommend" },
  { from: "personal-shopper", to: "makeup-artist", content: "Get makeup rec for event" },
  { from: "makeup-artist", to: "personal-shopper", content: "Dewy look recommended" },
];

const A2ACommunicationVisualizer = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeConnection, setActiveConnection] = useState<{ from: string; to: string } | null>(null);

  const startAnimation = () => {
    setIsAnimating(true);
    setMessages([]);
    setActiveConnection(null);

    sampleMessages.forEach((msg, idx) => {
      setTimeout(() => {
        const newMessage: Message = {
          ...msg,
          id: `msg-${idx}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, newMessage]);
        setActiveConnection({ from: msg.from, to: msg.to });

        setTimeout(() => {
          setActiveConnection(null);
          if (idx === sampleMessages.length - 1) {
            setIsAnimating(false);
          }
        }, 1500);
      }, idx * 2000);
    });
  };

  useEffect(() => {
    // Auto-start animation on mount
    startAnimation();
  }, []);

  const getAgent = (id: string) => agents.find((a) => a.id === id);
  const getAgentPosition = (id: string) => {
    const agent = getAgent(id);
    return agent ? agent.position : { x: 0, y: 0 };
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-muted/30 to-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Network className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">A2A Protocol</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Agent-to-Agent Communication
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Watch how our Verisense AI agents communicate and collaborate in real-time using the A2A protocol
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="border-2 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Network Visualization
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Interactive agent communication flow
                  </CardDescription>
                </div>
                <Button
                  onClick={startAnimation}
                  disabled={isAnimating}
                  size="sm"
                  variant="outline"
                >
                  {isAnimating ? "Animating..." : "Replay"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative h-[400px] bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg overflow-hidden">
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  style={{ zIndex: 1 }}
                >
                  {/* Connection lines */}
                  {agents.map((agent, idx) => {
                    if (idx === 0) return null;
                    const fromPos = agents[0].position;
                    const toPos = agent.position;
                    const isActive = activeConnection && 
                      ((activeConnection.from === agents[0].id && activeConnection.to === agent.id) ||
                       (activeConnection.from === agent.id && activeConnection.to === agents[0].id));

                    return (
                      <g key={`line-${idx}`}>
                        <motion.line
                          x1={fromPos.x}
                          y1={fromPos.y}
                          x2={toPos.x}
                          y2={toPos.y}
                          stroke={isActive ? "#667eea" : "#e5e7eb"}
                          strokeWidth={isActive ? 0.5 : 0.3}
                          strokeDasharray={isActive ? "0" : "1,1"}
                          initial={{ pathLength: 0, opacity: 0.3 }}
                          animate={{ 
                            pathLength: 1, 
                            opacity: isActive ? 1 : 0.3 
                          }}
                          transition={{ duration: 0.5 }}
                        />
                        {isActive && (
                          <motion.circle
                            r="1"
                            fill="#667eea"
                            initial={{ opacity: 0 }}
                            animate={{ 
                              cx: [fromPos.x, toPos.x],
                              cy: [fromPos.y, toPos.y],
                              opacity: [1, 1, 0],
                            }}
                            transition={{ 
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Agent nodes */}
                {agents.map((agent) => {
                  const Icon = agent.icon;
                  const isActive = activeConnection && 
                    (activeConnection.from === agent.id || activeConnection.to === agent.id);

                  return (
                    <motion.div
                      key={agent.id}
                      className="absolute"
                      style={{
                        left: `${agent.position.x}%`,
                        top: `${agent.position.y}%`,
                        transform: "translate(-50%, -50%)",
                        zIndex: 10,
                      }}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className={`w-16 h-16 ${agent.color} rounded-xl flex items-center justify-center shadow-lg ${
                        isActive ? "ring-4 ring-primary/50" : ""
                      }`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-xs font-semibold text-foreground whitespace-nowrap">
                          {agent.name}
                        </p>
                        {isActive && (
                          <Badge variant="default" className="text-xs mt-1">
                            Active
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                Message Log
              </CardTitle>
              <CardDescription>
                Real-time A2A communication messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Click "Replay" to see agent communication</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const fromAgent = getAgent(msg.from);
                    const toAgent = getAgent(msg.to);
                    const FromIcon = fromAgent?.icon || Bot;
                    const ToIcon = toAgent?.icon || Bot;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 rounded-lg bg-muted/50 border border-primary/10"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 ${fromAgent?.color || "bg-gray-500"} rounded-lg flex items-center justify-center`}>
                            <FromIcon className="w-4 h-4 text-white" />
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          <div className={`w-8 h-8 ${toAgent?.color || "bg-gray-500"} rounded-lg flex items-center justify-center`}>
                            <ToIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">
                              {fromAgent?.name} → {toAgent?.name}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            A2A
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground ml-11">
                          {msg.content}
                        </p>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default A2ACommunicationVisualizer;


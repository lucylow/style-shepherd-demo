import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  Sparkles, 
  Palette, 
  Ruler, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  ArrowRight,
  Network
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Agent {
  id: string;
  name: string;
  icon: typeof Bot;
  color: string;
  description: string;
  capabilities: string[];
  status: "active" | "idle" | "processing";
  verisenseFeatures: string[];
}

const agents: Agent[] = [
  {
    id: "personal-shopper",
    name: "Personal Shopper",
    icon: Sparkles,
    color: "bg-primary",
    description: "AI-powered fashion recommendations based on your style preferences and profile data from Verisense.",
    capabilities: [
      "Style analysis from Verisense profile",
      "Multi-brand size mapping",
      "Occasion-based recommendations",
      "Trend-aware suggestions"
    ],
    status: "active",
    verisenseFeatures: ["A2A Profile Access", "Nucleus KV Storage", "MCP Integration"]
  },
  {
    id: "makeup-artist",
    name: "Makeup Artist",
    icon: Palette,
    color: "bg-pink-500",
    description: "Personalized makeup recommendations using your preferences from Verisense profile data.",
    capabilities: [
      "Makeup preference analysis",
      "Skin tone matching",
      "Occasion-specific looks",
      "Product recommendations"
    ],
    status: "active",
    verisenseFeatures: ["Profile Preferences", "A2A Communication", "MCP Services"]
  },
  {
    id: "size-predictor",
    name: "Size Predictor",
    icon: Ruler,
    color: "bg-fashion-gold",
    description: "Cross-brand size prediction engine powered by ML and Verisense Nucleus storage.",
    capabilities: [
      "Cross-brand size mapping",
      "90% accuracy rate",
      "Real-time predictions",
      "Historical data analysis"
    ],
    status: "processing",
    verisenseFeatures: ["Nucleus KV Storage", "Timer Service", "MCP Data Access"]
  },
  {
    id: "returns-predictor",
    name: "Returns Predictor",
    icon: TrendingUp,
    color: "bg-green-500",
    description: "Advanced ML models predict return likelihood before purchase, reducing returns by up to 90%.",
    capabilities: [
      "Return risk scoring",
      "ML-powered predictions",
      "Real-time assessment",
      "Historical pattern analysis"
    ],
    status: "active",
    verisenseFeatures: ["Nucleus Timers", "MCP HTTP Requests", "A2A Data Sharing"]
  }
];

const VerisenseAgentShowcase = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  const getStatusColor = (status: Agent["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "processing":
        return "bg-yellow-500";
      case "idle":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: Agent["status"]) => {
    switch (status) {
      case "active":
        return "Active";
      case "processing":
        return "Processing";
      case "idle":
        return "Idle";
      default:
        return "Unknown";
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Network className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Verisense AI Agents</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Meet Our Verisense AI Agent Team
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Specialized AI agents working together on the Verisense network, powered by A2A communication and MCP services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {agents.map((agent) => {
            const Icon = agent.icon;
            const isHovered = hoveredAgent === agent.id;
            const isSelected = selectedAgent?.id === agent.id;

            return (
              <motion.div
                key={agent.id}
                onHoverStart={() => setHoveredAgent(agent.id)}
                onHoverEnd={() => setHoveredAgent(null)}
                onClick={() => setSelectedAgent(isSelected ? null : agent)}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer"
              >
                <Card className={`h-full transition-all duration-300 ${
                  isSelected ? "ring-2 ring-primary shadow-xl" : "hover:shadow-lg"
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 ${agent.color} rounded-xl flex items-center justify-center shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 ${getStatusColor(agent.status)} rounded-full animate-pulse`} />
                        <span className="text-xs text-muted-foreground">{getStatusText(agent.status)}</span>
                      </div>
                    </div>
                    <CardTitle className="text-xl mb-2">{agent.name}</CardTitle>
                    <CardDescription className="text-sm line-clamp-2">
                      {agent.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {agent.verisenseFeatures.slice(0, 2).map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAgent(isSelected ? null : agent);
                        }}
                      >
                        {isSelected ? "Hide Details" : "View Details"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {selectedAgent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-2 border-primary/20 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 ${selectedAgent.color} rounded-xl flex items-center justify-center`}>
                        <selectedAgent.icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{selectedAgent.name}</CardTitle>
                        <CardDescription className="text-base mt-1">
                          {selectedAgent.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAgent(null)}
                    >
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Capabilities
                      </h4>
                      <ul className="space-y-2">
                        {selectedAgent.capabilities.map((capability, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary mt-1">•</span>
                            <span>{capability}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Network className="w-4 h-4 text-primary" />
                        Verisense Features
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAgent.verisenseFeatures.map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Status: <span className="font-semibold text-foreground">{getStatusText(selectedAgent.status)}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default VerisenseAgentShowcase;


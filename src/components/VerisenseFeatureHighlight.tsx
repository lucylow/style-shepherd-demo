import { motion } from "framer-motion";
import { 
  Network, 
  Database, 
  Timer, 
  Globe, 
  Shield, 
  Zap,
  MessageSquare,
  Lock,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Feature {
  icon: typeof Network;
  title: string;
  description: string;
  color: string;
  gradient: string;
  highlights: string[];
}

const verisenseFeatures: Feature[] = [
  {
    icon: Network,
    title: "A2A Communication",
    description: "Agent-to-agent messaging protocol enabling seamless collaboration between AI agents",
    color: "text-primary",
    gradient: "from-primary/20 to-primary/5",
    highlights: ["Real-time messaging", "Secure protocols", "Cross-agent coordination"]
  },
  {
    icon: Database,
    title: "Nucleus KV Storage",
    description: "Fast, isolated key-value storage for each Nucleus with TTL support",
    color: "text-blue-500",
    gradient: "from-blue-500/20 to-blue-500/5",
    highlights: ["Deterministic performance", "TTL support", "Atomic operations"]
  },
  {
    icon: Timer,
    title: "Smart Timers",
    description: "Scheduled operations for automation with repeating and one-time execution",
    color: "text-green-500",
    gradient: "from-green-500/20 to-green-500/5",
    highlights: ["Scheduled tasks", "Repeating timers", "Auto-cleanup"]
  },
  {
    icon: Globe,
    title: "HTTP Requests",
    description: "Proactive network requests with retry logic and timeout handling",
    color: "text-purple-500",
    gradient: "from-purple-500/20 to-purple-500/5",
    highlights: ["Retry logic", "Timeout handling", "Request tracking"]
  },
  {
    icon: Shield,
    title: "Reverse Gas Mode",
    description: "Publisher pays for operations, users interact for free with zero friction",
    color: "text-orange-500",
    gradient: "from-orange-500/20 to-orange-500/5",
    highlights: ["Free user experience", "Publisher billing", "Usage tracking"]
  },
  {
    icon: MessageSquare,
    title: "MCP Integration",
    description: "Model Context Protocol services for advanced AI capabilities",
    color: "text-pink-500",
    gradient: "from-pink-500/20 to-pink-500/5",
    highlights: ["Context management", "Protocol support", "Service integration"]
  }
];

const VerisenseFeatureHighlight = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-4"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Powered by Verisense</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-bold text-foreground mb-4"
          >
            Next-Gen Nucleus Features
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            Style Shepherd leverages cutting-edge Verisense Nucleus capabilities for unparalleled AI agent coordination
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {verisenseFeatures.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Card className={`h-full border-2 hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${feature.gradient}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-background rounded-xl flex items-center justify-center shadow-md`}>
                        <Icon className={`w-6 h-6 ${feature.color}`} />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Active
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {feature.highlights.map((highlight, hIdx) => (
                        <div key={hIdx} className="flex items-center gap-2 text-sm">
                          <div className={`w-1.5 h-1.5 rounded-full ${feature.color.replace('text-', 'bg-')}`} />
                          <span className="text-muted-foreground">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <Card className="border-2 shadow-xl bg-gradient-to-br from-primary/10 via-background to-primary/5">
            <CardContent className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <RefreshCw className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">&lt;50ms</div>
                  <div className="text-sm text-muted-foreground">Avg Latency</div>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">256-bit</div>
                  <div className="text-sm text-muted-foreground">Encryption</div>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <Network className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">4+</div>
                  <div className="text-sm text-muted-foreground">AI Agents</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default VerisenseFeatureHighlight;

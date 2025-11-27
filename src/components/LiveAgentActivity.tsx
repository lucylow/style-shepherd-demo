import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  Bot, 
  Sparkles, 
  Palette, 
  Ruler, 
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActivityEvent {
  id: string;
  agent: string;
  agentIcon: typeof Bot;
  action: string;
  timestamp: Date;
  status: "success" | "processing" | "pending";
  details?: string;
}

const generateActivity = (): ActivityEvent[] => {
  const agents = [
    { name: "Personal Shopper", icon: Sparkles },
    { name: "Size Predictor", icon: Ruler },
    { name: "Returns Predictor", icon: TrendingUp },
    { name: "Makeup Artist", icon: Palette },
  ];

  const actions = [
    "Analyzed user profile from Verisense",
    "Accessed Nucleus KV Storage",
    "Sent A2A message to Size Predictor",
    "Generated size recommendation",
    "Calculated return risk score",
    "Updated user preferences",
    "Scheduled timer for trend analysis",
    "Fetched profile data via MCP",
  ];

  const events: ActivityEvent[] = [];
  const now = new Date();

  for (let i = 0; i < 8; i++) {
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const statuses: ActivityEvent["status"][] = ["success", "processing", "pending"];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    events.push({
      id: `event-${i}`,
      agent: agent.name,
      agentIcon: agent.icon,
      action,
      timestamp: new Date(now.getTime() - i * 30000 - Math.random() * 10000),
      status,
      details: status === "processing" ? "In progress..." : undefined,
    });
  }

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const LiveAgentActivity = () => {
  const [activities, setActivities] = useState<ActivityEvent[]>(generateActivity());
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newActivity = generateActivity();
      setActivities((prev) => {
        // Keep last 8 activities, add new ones at the top
        const combined = [...newActivity, ...prev.slice(0, 4)];
        return combined.slice(0, 8);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString();
  };

  const getStatusColor = (status: ActivityEvent["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-500";
      case "processing":
        return "bg-yellow-500 animate-pulse";
      case "pending":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusIcon = (status: ActivityEvent["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-white" />;
      case "processing":
        return <Clock className="w-4 h-4 text-white" />;
      default:
        return <Clock className="w-4 h-4 text-white" />;
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Live Activity Feed</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Real-Time Agent Activity
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Watch our Verisense AI agents collaborate in real-time using A2A communication and MCP services
          </p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <div className={`w-3 h-3 ${isLive ? "bg-green-500" : "bg-gray-400"} rounded-full animate-pulse`} />
                  Agent Activity Stream
                </CardTitle>
                <CardDescription className="mt-2">
                  Live updates from the Verisense network
                </CardDescription>
              </div>
              <Badge variant={isLive ? "default" : "secondary"}>
                {isLive ? "LIVE" : "PAUSED"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
              <AnimatePresence>
                {activities.map((activity, idx) => {
                  const Icon = activity.agentIcon;
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className={`absolute -top-1 -right-1 w-4 h-4 ${getStatusColor(activity.status)} rounded-full flex items-center justify-center`}>
                          {getStatusIcon(activity.status)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">{activity.agent}</span>
                          <Badge variant="outline" className="text-xs">
                            Verisense
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
                      
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default LiveAgentActivity;


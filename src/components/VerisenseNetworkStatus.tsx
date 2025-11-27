import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertCircle, 
  Server,
  Database,
  Timer,
  Globe,
  Shield,
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ServiceStatus {
  name: string;
  icon: typeof Server;
  status: "connected" | "disconnected" | "syncing";
  latency?: number;
  description: string;
}

const services: ServiceStatus[] = [
  {
    name: "Verisense Network",
    icon: Globe,
    status: "connected",
    latency: 45,
    description: "A2A protocol connection"
  },
  {
    name: "Nucleus KV Storage",
    icon: Database,
    status: "connected",
    latency: 12,
    description: "Key-value data storage"
  },
  {
    name: "Timer Service",
    icon: Timer,
    status: "connected",
    latency: 8,
    description: "Scheduled task execution"
  },
  {
    name: "MCP Services",
    icon: Zap,
    status: "connected",
    latency: 15,
    description: "Model Context Protocol"
  },
  {
    name: "Security Layer",
    icon: Shield,
    status: "connected",
    latency: 5,
    description: "Encrypted communication"
  }
];

const VerisenseNetworkStatus = () => {
  const [overallStatus, setOverallStatus] = useState<"connected" | "disconnected">("connected");
  const [uptime, setUptime] = useState(0);
  const [messageCount, setMessageCount] = useState(1247);

  useEffect(() => {
    // Simulate uptime counter
    const interval = setInterval(() => {
      setUptime((prev) => prev + 1);
    }, 1000);

    // Simulate message count increment
    const messageInterval = setInterval(() => {
      setMessageCount((prev) => prev + Math.floor(Math.random() * 3));
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(messageInterval);
    };
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const connectedServices = services.filter((s) => s.status === "connected").length;
  const connectionHealth = (connectedServices / services.length) * 100;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Server className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Network Status</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Verisense Network Connection
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Real-time status of our Verisense integration and Nucleus services
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Overall Status Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {overallStatus === "connected" ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                Network Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Connection Health</span>
                    <span className="text-sm font-semibold">{connectionHealth.toFixed(0)}%</span>
                  </div>
                  <Progress value={connectionHealth} className="h-2" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={overallStatus === "connected" ? "default" : "destructive"}>
                    {overallStatus === "connected" ? "Connected" : "Disconnected"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {connectedServices}/{services.length} services active
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Uptime Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-primary" />
                System Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  {formatUptime(uptime)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Continuous operation since last restart
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Message Count Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                A2A Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  {messageCount.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total agent-to-agent communications
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Status Grid */}
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Service Status</CardTitle>
            <CardDescription>
              Individual Verisense Nucleus service connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service, idx) => {
                const Icon = service.icon;
                const isConnected = service.status === "connected";

                return (
                  <motion.div
                    key={service.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 rounded-lg border-2 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${isConnected ? "bg-primary/10" : "bg-gray-200"} rounded-lg flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${isConnected ? "text-primary" : "text-gray-400"}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{service.name}</h4>
                          <p className="text-xs text-muted-foreground">{service.description}</p>
                        </div>
                      </div>
                      {isConnected ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                    {isConnected && service.latency && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {service.latency}ms latency
                        </Badge>
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-green-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${100 - (service.latency / 100) * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default VerisenseNetworkStatus;



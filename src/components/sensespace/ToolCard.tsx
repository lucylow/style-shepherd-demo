/**
 * Tool Card Component
 * Renders function calls and their results in a card format
 * Based on Verisense SenseSpace Content Rendering specification
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolCardProps {
  func: string;
  result: string;
  className?: string;
}

export function ToolCard({ func, result, className }: ToolCardProps) {
  return (
    <Card className={cn("my-3 border-l-4 border-l-blue-500", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-500" />
          Function Call
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Function:</p>
          <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{func}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            Result:
          </p>
          <p className="text-sm text-foreground">{result}</p>
        </div>
      </CardContent>
    </Card>
  );
}


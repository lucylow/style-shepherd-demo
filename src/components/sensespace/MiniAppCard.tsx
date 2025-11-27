/**
 * MiniApp Card Component
 * Creates a card that allows users to open MiniApp applications
 * Based on Verisense SenseSpace Content Rendering specification
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, AppWindow } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniAppCardProps {
  id: string;
  url: string;
  className?: string;
  onOpen?: (id: string, url: string) => void;
}

export function MiniAppCard({ id, url, className, onOpen }: MiniAppCardProps) {
  const handleClick = () => {
    if (onOpen) {
      onOpen(id, url);
    } else {
      // Default behavior: open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className={cn("my-3 border-l-4 border-l-purple-500 cursor-pointer hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
            <AppWindow className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{id}</p>
            <p className="text-xs text-muted-foreground truncate">{url}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClick}
            className="flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Open
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


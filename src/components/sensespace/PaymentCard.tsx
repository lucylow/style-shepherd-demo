/**
 * Payment Card Component
 * Initiates a payment request from the user
 * Based on Verisense SenseSpace Content Rendering specification
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PaymentCardProps {
  intentId: string;
  className?: string;
  onConfirm?: (intentId: string) => Promise<void> | void;
}

export function PaymentCard({ intentId, className, onConfirm }: PaymentCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      if (onConfirm) {
        await onConfirm(intentId);
      } else {
        // Default behavior: send payment confirmation message
        // In a real implementation, this would send a message to the agent
        console.log('Payment confirmed for intent:', intentId);
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className={cn("my-3 border-l-4 border-l-green-500", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Payment Request</p>
            <p className="text-xs text-muted-foreground">Intent ID: {intentId}</p>
          </div>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-shrink-0"
            size="sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Payment'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


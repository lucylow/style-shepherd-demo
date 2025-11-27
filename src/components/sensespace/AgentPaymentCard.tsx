/**
 * Agent Payment Card Component
 * Handles payment requests from agents using SenseSpace Agent Payment API
 * Supports payment initialization and confirmation with OTP
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { CreditCard, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { agentPaymentService, type PaymentIntentResponse } from '@/services/agentPaymentService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface AgentPaymentCardProps {
  amount: number; // Amount in dollars
  userId: string;
  agentName?: string;
  description?: string;
  className?: string;
  onPaymentSuccess?: (paymentIntentId: string) => void;
  onPaymentError?: (error: Error) => void;
}

export function AgentPaymentCard({
  amount,
  userId,
  agentName = 'Agent',
  description,
  className,
  onPaymentSuccess,
  onPaymentError,
}: AgentPaymentCardProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResponse['data'] | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [needPaymentMethod, setNeedPaymentMethod] = useState(false);

  const formatAmount = (amountInDollars: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amountInDollars);
  };

  const handleInitializePayment = async () => {
    setIsInitializing(true);
    setError(null);
    setNeedPaymentMethod(false);

    try {
      const amountInCents = agentPaymentService.formatAmountToCents(amount);
      const response = await agentPaymentService.initializePaymentIntent({
        amount: amountInCents,
        userId,
      });

      if (response.success && response.data) {
        setPaymentIntent(response.data);

        // Check if payment method is needed
        if (response.data.needPaymentMethod) {
          setNeedPaymentMethod(true);
          toast.error('Please add a payment method to continue');
        } else if (response.data.paymentIntent) {
          // Check payment status
          if (response.data.paymentIntent.status === 'requires_confirmation') {
            // Show confirmation dialog
            setShowConfirmDialog(true);
          } else if (response.data.paymentIntent.status === 'succeeded') {
            // Payment succeeded immediately
            toast.success('Payment completed successfully!');
            onPaymentSuccess?.(response.data.paymentIntent.paymentIntentId);
          }
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initialize payment';
      setError(errorMessage);
      toast.error(errorMessage);
      onPaymentError?.(err);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentIntent?.paymentIntent?.paymentIntentId || !confirmCode) {
      setError('Please enter the confirmation code');
      return;
    }

    setIsConfirming(true);
    setError(null);

    try {
      const response = await agentPaymentService.confirmPaymentIntent(
        paymentIntent.paymentIntent.paymentIntentId,
        confirmCode
      );

      if (response.success && response.data?.paymentIntent) {
        if (response.data.paymentIntent.status === 'succeeded') {
          toast.success('Payment confirmed successfully!');
          setShowConfirmDialog(false);
          setConfirmCode('');
          onPaymentSuccess?.(response.data.paymentIntent.paymentIntentId);
        } else {
          // Payment might require additional action (e.g., 3D Secure)
          toast.info(`Payment status: ${response.data.paymentIntent.status}`);
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to confirm payment';
      setError(errorMessage);
      toast.error(errorMessage);
      onPaymentError?.(err);
    } finally {
      setIsConfirming(false);
    }
  };

  const isPaymentInProgress = paymentIntent?.paymentIntent?.status === 'requires_confirmation';

  return (
    <>
      <Card className={cn("my-3 border-l-4 border-l-blue-500", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Payment Request</CardTitle>
              {agentName && (
                <CardDescription className="text-xs mt-0.5">
                  From {agentName}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Amount:</span>
            <span className="text-lg font-bold">{formatAmount(amount)}</span>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {needPaymentMethod && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please add a payment method in your account settings to continue.
              </AlertDescription>
            </Alert>
          )}

          {isPaymentInProgress && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Payment pending confirmation. Please enter the confirmation code.
              </AlertDescription>
            </Alert>
          )}

          {paymentIntent?.paymentIntent?.status === 'succeeded' && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Payment completed successfully!
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {!paymentIntent && (
              <Button
                onClick={handleInitializePayment}
                disabled={isInitializing}
                className="flex-1"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay {formatAmount(amount)}
                  </>
                )}
              </Button>
            )}

            {isPaymentInProgress && (
              <Button
                onClick={() => setShowConfirmDialog(true)}
                variant="outline"
                className="flex-1"
              >
                Enter Confirmation Code
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Enter the confirmation code sent to you to complete the payment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={confirmCode}
                onChange={(value) => setConfirmCode(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="text-center text-sm text-muted-foreground">
              <p>Amount: {formatAmount(amount)}</p>
              {paymentIntent?.paymentIntent?.paymentIntentId && (
                <p className="text-xs mt-1">
                  Payment ID: {paymentIntent.paymentIntent.paymentIntentId}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setConfirmCode('');
                setError(null);
              }}
              disabled={isConfirming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isConfirming || confirmCode.length !== 6}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                'Confirm Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}



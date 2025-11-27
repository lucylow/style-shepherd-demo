/**
 * React Hook for Agent Payments
 * Provides a convenient way to handle agent payment flows
 */

import { useState, useCallback } from 'react';
import { agentPaymentService, type PaymentIntentResponse } from '@/services/agentPaymentService';
import { toast } from 'sonner';

interface UseAgentPaymentOptions {
  userId: string;
  onPaymentSuccess?: (paymentIntentId: string) => void;
  onPaymentError?: (error: Error) => void;
}

export function useAgentPayment({ userId, onPaymentSuccess, onPaymentError }: UseAgentPaymentOptions) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResponse['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initializePayment = useCallback(async (amount: number) => {
    setIsInitializing(true);
    setError(null);

    try {
      const amountInCents = agentPaymentService.formatAmountToCents(amount);
      const response = await agentPaymentService.initializePaymentIntent({
        amount: amountInCents,
        userId,
      });

      if (response.success && response.data) {
        setPaymentIntent(response.data);
        return response.data;
      }

      throw new Error('Failed to initialize payment intent');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initialize payment';
      setError(errorMessage);
      toast.error(errorMessage);
      onPaymentError?.(err);
      throw err;
    } finally {
      setIsInitializing(false);
    }
  }, [userId, onPaymentError]);

  const confirmPayment = useCallback(async (paymentIntentId: string, confirmCode: string) => {
    setIsConfirming(true);
    setError(null);

    try {
      const response = await agentPaymentService.confirmPaymentIntent(
        paymentIntentId,
        confirmCode
      );

      if (response.success && response.data?.paymentIntent) {
        if (response.data.paymentIntent.status === 'succeeded') {
          toast.success('Payment confirmed successfully!');
          onPaymentSuccess?.(response.data.paymentIntent.paymentIntentId);
          return response.data;
        } else {
          toast.info(`Payment status: ${response.data.paymentIntent.status}`);
          return response.data;
        }
      }

      throw new Error('Failed to confirm payment intent');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to confirm payment';
      setError(errorMessage);
      toast.error(errorMessage);
      onPaymentError?.(err);
      throw err;
    } finally {
      setIsConfirming(false);
    }
  }, [onPaymentSuccess, onPaymentError]);

  const reset = useCallback(() => {
    setPaymentIntent(null);
    setError(null);
    setIsInitializing(false);
    setIsConfirming(false);
  }, []);

  return {
    initializePayment,
    confirmPayment,
    reset,
    paymentIntent,
    error,
    isInitializing,
    isConfirming,
    needPaymentMethod: paymentIntent?.needPaymentMethod || false,
    requiresConfirmation: paymentIntent?.paymentIntent?.status === 'requires_confirmation',
    isSucceeded: paymentIntent?.paymentIntent?.status === 'succeeded',
  };
}



/**
 * Agent Payment Service
 * Handles payments between users and agents using SenseSpace Agent Payment API
 * Based on Verisense SenseSpace Agent Payment API documentation
 */

import { getApiBaseUrl } from '@/lib/api-config';

export interface CreatePaymentIntentParams {
  amount: number; // Amount in smallest currency unit (e.g., cents for USD)
  userId: string;
}

export interface ConfirmPaymentIntentParams {
  confirmCode: string; // OTP/confirmation code from user
}

export interface PaymentIntentResponse {
  success: boolean;
  data: {
    needPaymentMethod: boolean;
    paymentIntent: {
      status: 'requires_confirmation' | 'succeeded' | 'requires_action';
      paymentIntentId: string;
    } | null;
  };
}

export interface PaymentError {
  message: string;
  status?: number;
  code?: string;
}

class AgentPaymentService {
  private API_BASE = getApiBaseUrl();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  /**
   * Retry wrapper for API calls
   */
  private async retryApiCall<T>(
    operation: () => Promise<T>,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        // Exponential backoff
        if (attempt < retries - 1) {
          const delay = this.RETRY_DELAY * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Initialize Payment Intent
   * Creates a payment intent for a transaction between a user and an agent
   * 
   * @param params - Payment intent parameters
   * @returns Payment intent response
   */
  async initializePaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<PaymentIntentResponse> {
    // Validate input
    if (!params.amount || params.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    if (!params.userId) {
      throw new Error('User ID is required');
    }

    return this.retryApiCall(async () => {
      const response = await fetch(`${this.API_BASE}/agent-payment/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: params.amount,
          userId: params.userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: PaymentError = new Error(
          errorData.message || `Failed to initialize payment intent: ${response.statusText}`
        ) as PaymentError;
        error.status = response.status;
        error.code = errorData.code;
        throw error;
      }

      const data = await response.json();
      return data;
    });
  }

  /**
   * Confirm Payment Intent
   * Confirms and processes a payment intent that is in requires_confirmation state
   * 
   * @param paymentIntentId - The ID of the payment intent to confirm
   * @param confirmCode - The confirmation code (OTP) provided by the user
   * @returns Payment intent response
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    confirmCode: string
  ): Promise<PaymentIntentResponse> {
    if (!paymentIntentId) {
      throw new Error('Payment intent ID is required');
    }
    if (!confirmCode) {
      throw new Error('Confirmation code is required');
    }

    return this.retryApiCall(async () => {
      const response = await fetch(`${this.API_BASE}/agent-payment/intent/${paymentIntentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: PaymentError = new Error(
          errorData.message || `Failed to confirm payment intent: ${response.statusText}`
        ) as PaymentError;
        error.status = response.status;
        error.code = errorData.code;
        throw error;
      }

      const data = await response.json();
      return data;
    });
  }

  /**
   * Format amount from dollars to cents
   */
  formatAmountToCents(amountInDollars: number): number {
    return Math.round(amountInDollars * 100);
  }

  /**
   * Format amount from cents to dollars
   */
  formatAmountFromCents(amountInCents: number): number {
    return amountInCents / 100;
  }
}

export const agentPaymentService = new AgentPaymentService();


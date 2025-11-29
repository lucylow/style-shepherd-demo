# Agent Payment Integration

This document describes the agent payment features integrated into Style Shepherd, allowing agents to charge users for services using the Verisense SenseSpace Agent Payment API.

## Overview

The agent payment system enables AI agents to request and process payments from users within the Verisense platform. This integration follows the official [Verisense Agent Payment API documentation](https://docs.verisense.network/sensespace/payment/).

## Features

- ✅ Initialize payment intents for agent-to-user transactions
- ✅ Handle payment confirmation with OTP codes
- ✅ Support for payment method detection
- ✅ Automatic payment processing for small amounts
- ✅ Full UI components for payment flows
- ✅ React hooks for easy integration

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Agent API Key (required for agent payments)
AGENT_API_KEY=your_agent_api_key_here

# SenseSpace API Endpoint (optional, defaults to https://api.sensespace.xyz)
SENSESPACE_API_ENDPOINT=https://api.sensespace.xyz
```

### 2. KYA (Know Your Agent) Setup

Before agents can charge users, you must complete KYA (Know Your Agent) verification on the [Verisense dashboard](https://dashboard.verisense.network).

## API Endpoints

### Backend Routes

The backend provides proxy routes that handle authentication and forward requests to the SenseSpace API:

- `POST /api/agent-payment/intent` - Initialize a payment intent
- `POST /api/agent-payment/intent/:id` - Confirm a payment intent

### Frontend Service

The `agentPaymentService` provides methods to interact with the payment API:

```typescript
import { agentPaymentService } from '@/services/agentPaymentService';

// Initialize payment
const response = await agentPaymentService.initializePaymentIntent({
  amount: 1000, // Amount in cents
  userId: 'user-123',
});

// Confirm payment
const confirmed = await agentPaymentService.confirmPaymentIntent(
  paymentIntentId,
  confirmCode
);
```

## Components

### AgentPaymentCard

A complete payment card component that handles the full payment flow:

```tsx
import { AgentPaymentCard } from '@/components/sensespace/AgentPaymentCard';

<AgentPaymentCard
  amount={10.00}
  userId="user-123"
  agentName="Style Assistant"
  description="Personal styling consultation"
  onPaymentSuccess={(paymentIntentId) => {
    console.log('Payment succeeded:', paymentIntentId);
  }}
  onPaymentError={(error) => {
    console.error('Payment failed:', error);
  }}
/>
```

### PaymentCard

A simpler payment card for displaying payment intents:

```tsx
import { PaymentCard } from '@/components/sensespace/PaymentCard';

<PaymentCard
  intentId="pi_xxxxxxxxxxxx"
  amount={10.00}
  onConfirm={async (intentId) => {
    // Handle confirmation
  }}
/>
```

## React Hook

Use the `useAgentPayment` hook for programmatic payment handling:

```tsx
import { useAgentPayment } from '@/hooks/useAgentPayment';

function MyComponent() {
  const {
    initializePayment,
    confirmPayment,
    paymentIntent,
    isInitializing,
    isConfirming,
    requiresConfirmation,
    needPaymentMethod,
  } = useAgentPayment({
    userId: 'user-123',
    onPaymentSuccess: (paymentIntentId) => {
      console.log('Payment succeeded:', paymentIntentId);
    },
  });

  const handlePay = async () => {
    try {
      await initializePayment(10.00);
    } catch (error) {
      console.error('Payment initialization failed:', error);
    }
  };

  // ... rest of component
}
```

## Payment Flow

1. **Initialize Payment**: Agent requests payment from user
   - System checks if user has payment method configured
   - Creates payment intent via SenseSpace API
   - Returns payment intent status

2. **Payment Status**:
   - `needPaymentMethod: true` - User needs to add payment method
   - `requires_confirmation` - Payment requires OTP confirmation
   - `succeeded` - Payment completed immediately (small amounts)

3. **Confirmation** (if required):
   - User receives confirmation code (OTP)
   - User enters code in confirmation dialog
   - Payment is confirmed and processed

4. **Completion**:
   - Payment status updated to `succeeded`
   - Success callback triggered
   - Agent receives funds

## Demo Page

Visit `/agent-payment-demo` to see a working example of the agent payment integration.

## Error Handling

The service handles various error scenarios:

- **400 Bad Request**: Invalid input or agent payment status issue
- **401 Unauthorized**: Missing or invalid agent API key
- **500 Internal Server Error**: Server-side error

All errors are logged and can be handled via the `onPaymentError` callback.

## Security

- API keys are stored server-side and never exposed to the client
- Payment confirmations require OTP codes
- All requests are authenticated via Bearer tokens
- Payment intents are validated before processing

## Integration with Existing Payment System

The agent payment system works alongside the existing Stripe payment integration:

- **Stripe Payments**: For product purchases and subscriptions
- **Agent Payments**: For agent-to-user service transactions

Both systems can be used simultaneously in the application.

## Testing

To test the agent payment functionality:

1. Set up your `AGENT_API_KEY` environment variable
2. Complete KYA verification on Verisense dashboard
3. Visit `/agent-payment-demo` to test the payment flow
4. Use test user IDs and amounts to verify functionality

## API Reference

For detailed API documentation, see:
- [Verisense Agent Payment API Documentation](https://docs.verisense.network/sensespace/payment/)
- [SenseSpace API Reference](https://api.sensespace.xyz/docs)

## Support

For issues or questions:
- Check the [Verisense Documentation](https://docs.verisense.network/)
- Review error messages in the browser console
- Check server logs for detailed error information



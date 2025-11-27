/**
 * Agent Payment Demo Page
 * Demonstrates the agent payment functionality using SenseSpace Agent Payment API
 */

import { useState } from 'react';
import { AgentPaymentCard } from '@/components/sensespace/AgentPaymentCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

export default function AgentPaymentDemoPage() {
  const { user } = useAuth();
  const [amount, setAmount] = useState(10.00);
  const [agentName, setAgentName] = useState('Style Assistant');
  const [description, setDescription] = useState('Personal styling consultation');
  const [userId] = useState(user?.id || 'demo-user-123');

  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log('Payment succeeded:', paymentIntentId);
    // Handle success (e.g., show success message, redirect, etc.)
  };

  const handlePaymentError = (error: Error) => {
    console.error('Payment error:', error);
    // Handle error (e.g., show error message)
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Agent Payment Demo</h1>
          <p className="text-muted-foreground">
            Test the SenseSpace Agent Payment API integration. This demonstrates how agents
            can request payments from users within the Verisense platform.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Configuration</CardTitle>
            <CardDescription>
              Configure the payment request parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agentName">Agent Name</Label>
              <Input
                id="agentName"
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Agent Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Payment description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                type="text"
                value={userId}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Using {user ? 'authenticated user' : 'demo user'} ID
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div>
          <h2 className="text-2xl font-semibold mb-4">Payment Request</h2>
          <AgentPaymentCard
            amount={amount}
            userId={userId}
            agentName={agentName}
            description={description}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>Initialize Payment:</strong> Click "Pay" to create a payment intent.
                The system checks if the user has a payment method configured.
              </li>
              <li>
                <strong>Confirmation Required:</strong> For security, most payments require
                a confirmation code (OTP) that the user receives.
              </li>
              <li>
                <strong>Enter Code:</strong> Enter the 6-digit confirmation code in the dialog.
              </li>
              <li>
                <strong>Payment Complete:</strong> Once confirmed, the payment is processed
                and the agent receives the funds.
              </li>
            </ol>
            <div className="mt-4 p-3 bg-background rounded-lg">
              <p className="text-xs font-semibold mb-1">Note:</p>
              <p className="text-xs text-muted-foreground">
                Before agents can charge users, you must complete KYA (Know Your Agent)
                on the Verisense dashboard. The agent API key must be set in the
                <code className="mx-1 px-1 bg-muted rounded">AGENT_API_KEY</code>
                environment variable.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


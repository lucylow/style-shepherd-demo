import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Product } from '@/types/fashion';
import { humanInTheLoopService } from '@/services/humanInTheLoopService';

export type AgentActionType = 
  | 'add_to_cart'
  | 'create_invoice'
  | 'apply_promotion'
  | 'update_cart'
  | 'checkout'
  | 'search_products'
  | 'recommend_products'
  | 'other';

export interface AgentAction {
  id: string;
  type: AgentActionType;
  title: string;
  description: string;
  details?: Record<string, any>;
  product?: Product;
  products?: Product[];
  metadata?: {
    confidence?: number;
    reasoning?: string;
    estimatedValue?: number;
    riskLevel?: 'low' | 'medium' | 'high';
  };
  timestamp: number;
}

interface AgentActionContextType {
  pendingAction: AgentAction | null;
  requestApproval: (action: Omit<AgentAction, 'id' | 'timestamp'>) => Promise<boolean>;
  approveAction: () => void;
  rejectAction: () => void;
  clearPendingAction: () => void;
}

const AgentActionContext = createContext<AgentActionContextType | undefined>(undefined);

export function AgentActionProvider({ children }: { children: ReactNode }) {
  const [pendingAction, setPendingAction] = useState<AgentAction | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((approved: boolean) => void) | null>(null);

  const requestApproval = useCallback(
    async (action: Omit<AgentAction, 'id' | 'timestamp'>): Promise<boolean> => {
      return new Promise(async (resolve) => {
        const fullAction: AgentAction = {
          ...action,
          id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };
        setPendingAction(fullAction);
        setResolvePromise(() => resolve);

        // Also create a backend approval request for audit trail
        try {
          // Get userId from localStorage or use a default
          const userId = localStorage.getItem('userId') || 'guest';
          
          await humanInTheLoopService.createApprovalRequest({
            userId,
            agentId: 'style-shepherd-agent',
            actionType: action.type,
            title: action.title,
            description: action.description,
            reasoning: action.metadata?.reasoning,
            confidence: action.metadata?.confidence,
            riskLevel: action.metadata?.riskLevel,
            metadata: {
              products: action.products || (action.product ? [action.product] : []),
              estimatedValue: action.metadata?.estimatedValue,
              actionId: fullAction.id,
            },
          });
        } catch (error) {
          console.warn('Failed to create backend approval request:', error);
          // Don't fail the approval flow if backend logging fails
        }
      });
    },
    []
  );

  const approveAction = useCallback(async () => {
    if (resolvePromise && pendingAction) {
      // Log approval to backend
      try {
        const userId = localStorage.getItem('userId') || 'guest';
        // Find the approval request by matching action details
        const approvals = await humanInTheLoopService.getPendingApprovals(userId);
        const matchingApproval = approvals.find(
          a => a.metadata?.actionId === pendingAction.id
        );
        
        if (matchingApproval) {
          await humanInTheLoopService.approveAction(matchingApproval.id, userId);
        }
      } catch (error) {
        console.warn('Failed to log approval to backend:', error);
      }

      resolvePromise(true);
      setResolvePromise(null);
    }
    setPendingAction(null);
  }, [resolvePromise, pendingAction]);

  const rejectAction = useCallback(async () => {
    if (resolvePromise && pendingAction) {
      // Log rejection to backend
      try {
        const userId = localStorage.getItem('userId') || 'guest';
        // Find the approval request by matching action details
        const approvals = await humanInTheLoopService.getPendingApprovals(userId);
        const matchingApproval = approvals.find(
          a => a.metadata?.actionId === pendingAction.id
        );
        
        if (matchingApproval) {
          await humanInTheLoopService.rejectAction(matchingApproval.id, userId);
        }
      } catch (error) {
        console.warn('Failed to log rejection to backend:', error);
      }

      resolvePromise(false);
      setResolvePromise(null);
    }
    setPendingAction(null);
  }, [resolvePromise, pendingAction]);

  const clearPendingAction = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
    setPendingAction(null);
  }, [resolvePromise]);

  return (
    <AgentActionContext.Provider
      value={{
        pendingAction,
        requestApproval,
        approveAction,
        rejectAction,
        clearPendingAction,
      }}
    >
      {children}
    </AgentActionContext.Provider>
  );
}

export function useAgentAction() {
  const context = useContext(AgentActionContext);
  if (context === undefined) {
    throw new Error('useAgentAction must be used within an AgentActionProvider');
  }
  return context;
}


import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Product } from '@/types/fashion';

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
    (action: Omit<AgentAction, 'id' | 'timestamp'>): Promise<boolean> => {
      return new Promise((resolve) => {
        const fullAction: AgentAction = {
          ...action,
          id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };
        setPendingAction(fullAction);
        setResolvePromise(() => resolve);
      });
    },
    []
  );

  const approveAction = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }
    setPendingAction(null);
  }, [resolvePromise]);

  const rejectAction = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
    setPendingAction(null);
  }, [resolvePromise]);

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


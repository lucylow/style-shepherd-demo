import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAgentAction, AgentActionType } from '@/contexts/AgentActionContext';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertTriangle, CheckCircle2, XCircle, ShoppingCart, Receipt, Tag, Search, Package } from 'lucide-react';
import { motion } from 'framer-motion';

const actionIcons: Record<AgentActionType, React.ReactNode> = {
  add_to_cart: <ShoppingCart className="w-5 h-5" />,
  create_invoice: <Receipt className="w-5 h-5" />,
  apply_promotion: <Tag className="w-5 h-5" />,
  update_cart: <ShoppingCart className="w-5 h-5" />,
  checkout: <Package className="w-5 h-5" />,
  search_products: <Search className="w-5 h-5" />,
  recommend_products: <Sparkles className="w-5 h-5" />,
  other: <Sparkles className="w-5 h-5" />,
};

const actionColors: Record<AgentActionType, string> = {
  add_to_cart: 'bg-blue-500',
  create_invoice: 'bg-green-500',
  apply_promotion: 'bg-purple-500',
  update_cart: 'bg-orange-500',
  checkout: 'bg-indigo-500',
  search_products: 'bg-teal-500',
  recommend_products: 'bg-pink-500',
  other: 'bg-gray-500',
};

export function AgentActionConfirmationDialog() {
  const { pendingAction, approveAction, rejectAction } = useAgentAction();

  if (!pendingAction) {
    return null;
  }

  const { type, title, description, details, product, products, metadata } = pendingAction;

  const getRiskBadge = () => {
    if (!metadata?.riskLevel) return null;
    const riskColors = {
      low: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      high: 'bg-red-100 text-red-800 border-red-300',
    };
    return (
      <Badge variant="outline" className={riskColors[metadata.riskLevel]}>
        <AlertTriangle className="w-3 h-3 mr-1" />
        {metadata.riskLevel.toUpperCase()} RISK
      </Badge>
    );
  };

  const getConfidenceBadge = () => {
    if (!metadata?.confidence) return null;
    const confidencePercent = Math.round(metadata.confidence * 100);
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {confidencePercent}% Confidence
      </Badge>
    );
  };

  return (
    <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && rejectAction()}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              className={`${actionColors[type]} rounded-full p-2 text-white`}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {actionIcons[type]}
            </motion.div>
            <div className="flex-1">
              <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {getRiskBadge()}
                {getConfidenceBadge()}
              </div>
            </div>
          </div>
          <AlertDialogDescription className="text-base mt-2">
            {description}
          </AlertDialogDescription>
          {metadata?.reasoning && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">AI Reasoning:</p>
              <p className="text-sm text-muted-foreground">{metadata.reasoning}</p>
            </div>
          )}
        </AlertDialogHeader>

        <div className="space-y-4 my-4">
          {/* Single Product */}
          {product && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Product to Add:</h4>
              <div className="flex gap-4">
                {product.images && product.images[0] && (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h5 className="font-medium">{product.name}</h5>
                  <p className="text-sm text-muted-foreground">{product.brand}</p>
                  <p className="text-lg font-bold mt-1">${product.price.toFixed(2)}</p>
                  {product.recommendedSize && (
                    <Badge variant="outline" className="mt-2">
                      Recommended Size: {product.recommendedSize}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Multiple Products */}
          {products && products.length > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">
                {products.length} Product{products.length > 1 ? 's' : ''} to Add:
              </h4>
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                {products.map((p) => (
                  <div key={p.id} className="flex gap-3 p-2 bg-muted/50 rounded">
                    {p.images && p.images[0] && (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.brand}</p>
                      <p className="text-sm font-bold">${p.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Details */}
          {details && Object.keys(details).length > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Details:</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(details).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="font-medium">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimated Value */}
          {metadata?.estimatedValue && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Estimated Value:</span>
                <span className="text-lg font-bold text-primary">
                  ${metadata.estimatedValue.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={rejectAction} className="w-full sm:w-auto">
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </AlertDialogCancel>
          <AlertDialogAction onClick={approveAction} className="w-full sm:w-auto">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approve & Execute
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


/**
 * Human Approval History Component
 * Displays a history of all human approval requests and their status
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Eye,
  TrendingUp,
  BarChart3,
  Filter
} from 'lucide-react';
import { humanInTheLoopService, HumanApprovalRequest, ApprovalStats } from '@/services/humanInTheLoopService';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

interface HumanApprovalHistoryProps {
  userId?: string;
  className?: string;
}

export function HumanApprovalHistory({ userId, className }: HumanApprovalHistoryProps) {
  const [approvals, setApprovals] = useState<HumanApprovalRequest[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<HumanApprovalRequest | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadData();
  }, [userId, filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (userId) filters.userId = userId;
      if (filter !== 'all') filters.status = filter;

      const [approvalsData, statsData] = await Promise.all([
        humanInTheLoopService.getApprovalRequests({ ...filters, limit: 50 }),
        humanInTheLoopService.getApprovalStats(userId ? { userId } : {}),
      ]);

      setApprovals(approvalsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load approval history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      approved: 'bg-green-500/10 text-green-600 dark:text-green-400',
      rejected: 'bg-red-500/10 text-red-600 dark:text-red-400',
      pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      expired: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
      cancelled: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    };

    return (
      <Badge className={variants[status] || variants.cancelled}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  const getActionTypeBadge = (actionType: string) => {
    const colors: Record<string, string> = {
      add_to_cart: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      checkout: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      recommend_products: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      search_products: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
      create_invoice: 'bg-green-500/10 text-green-600 dark:text-green-400',
      apply_promotion: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    };

    return (
      <Badge className={colors[actionType] || 'bg-gray-500/10 text-gray-600 dark:text-gray-400'}>
        {actionType.replace(/_/g, ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Human Approval History
              </CardTitle>
              <CardDescription>
                Track all AI agent actions that required human approval
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadData}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-muted rounded-lg"
              >
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Requests</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 bg-muted rounded-lg"
              >
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 bg-muted rounded-lg"
              >
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 bg-muted rounded-lg"
              >
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </motion.div>
            </div>
          )}

          {/* Filters */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Approval List */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {approvals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No approval requests found
              </div>
            ) : (
              approvals.map((approval) => (
                <motion.div
                  key={approval.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedApproval(approval)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(approval.status)}
                        {getActionTypeBadge(approval.actionType)}
                        {approval.confidence && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(approval.confidence * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold mb-1">{approval.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {approval.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(approval.requestedAt), { addSuffix: true })}
                        </span>
                        {approval.metadata?.products && (
                          <span>{approval.metadata.products.length} product(s)</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApproval(approval);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approval Detail Modal */}
      {selectedApproval && (
        <ApprovalDetailModal
          approval={selectedApproval}
          onClose={() => setSelectedApproval(null)}
        />
      )}
    </div>
  );
}

function ApprovalDetailModal({
  approval,
  onClose,
}: {
  approval: HumanApprovalRequest;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{approval.title}</CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{approval.description}</p>
            </div>

            {approval.reasoning && (
              <div>
                <h4 className="font-semibold mb-2">AI Reasoning</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {approval.reasoning}
                </p>
              </div>
            )}

            {approval.userReasoning && (
              <div>
                <h4 className="font-semibold mb-2">Human Reasoning</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {approval.userReasoning}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Status</h4>
                <Badge>{approval.status}</Badge>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Action Type</h4>
                <Badge>{approval.actionType.replace(/_/g, ' ')}</Badge>
              </div>
              {approval.confidence && (
                <div>
                  <h4 className="font-semibold mb-2">Confidence</h4>
                  <Badge>{Math.round(approval.confidence * 100)}%</Badge>
                </div>
              )}
              {approval.riskLevel && (
                <div>
                  <h4 className="font-semibold mb-2">Risk Level</h4>
                  <Badge>{approval.riskLevel}</Badge>
                </div>
              )}
            </div>

            {approval.metadata?.products && approval.metadata.products.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Products</h4>
                <div className="space-y-2">
                  {approval.metadata.products.map((product: any, idx: number) => (
                    <div key={idx} className="p-2 bg-muted rounded text-sm">
                      {product.name || product.title || `Product ${idx + 1}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-2">Timeline</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Requested:</span>{' '}
                  {new Date(approval.requestedAt).toLocaleString()}
                </div>
                {approval.respondedAt && (
                  <div>
                    <span className="text-muted-foreground">Responded:</span>{' '}
                    {new Date(approval.respondedAt).toLocaleString()}
                  </div>
                )}
                {approval.expiresAt && (
                  <div>
                    <span className="text-muted-foreground">Expires:</span>{' '}
                    {new Date(approval.expiresAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {approval.auditTrail && (
              <div>
                <h4 className="font-semibold mb-2">Audit Trail</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(approval.auditTrail, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}


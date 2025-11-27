# Human-in-the-Loop Verisense AI Agent

This document describes the comprehensive human-in-the-loop system integrated with the Verisense AI agent for Style Shepherd.

## Overview

The human-in-the-loop system ensures that critical AI agent actions require explicit human approval before execution. This provides:

- **Transparency**: All AI decisions are visible and auditable
- **Control**: Humans can approve or reject AI actions
- **Accountability**: Complete audit trail of all approvals/rejections
- **Safety**: Prevents unauthorized or risky actions

## Architecture

### Backend Services

#### `HumanInTheLoopService` (`server/src/services/HumanInTheLoopService.ts`)

Core service that manages approval workflows:

- **Create Approval Requests**: Track when AI wants to perform an action
- **Approve/Reject Actions**: Record human decisions
- **Query Approvals**: Filter and search approval history
- **Statistics**: Get approval rates and metrics
- **Audit Trail**: Complete history of all approval events

**Key Features:**
- Stores approvals in both database and file system (for redundancy)
- Automatic expiration of pending approvals (30 minutes default)
- Full audit trail with webhook events
- Support for confidence scores and risk levels

#### API Routes (`server/src/routes/human-in-the-loop.ts`)

RESTful API endpoints:

- `POST /api/human-in-the-loop/request` - Create approval request
- `POST /api/human-in-the-loop/approve/:id` - Approve an action
- `POST /api/human-in-the-loop/reject/:id` - Reject an action
- `GET /api/human-in-the-loop/approval/:id` - Get specific approval
- `GET /api/human-in-the-loop/approvals` - List approvals with filters
- `GET /api/human-in-the-loop/pending` - Get pending approvals
- `GET /api/human-in-the-loop/stats` - Get approval statistics
- `POST /api/human-in-the-loop/expire` - Manually expire old approvals
- `POST /api/human-in-the-loop/verisense-webhook` - Verisense webhook endpoint

### Frontend Components

#### `HumanApprovalHistory` Component (`src/components/HumanApprovalHistory.tsx`)

React component for viewing approval history:

- **Statistics Dashboard**: Shows total, approved, rejected, and pending counts
- **Filterable List**: Filter by status (all, pending, approved, rejected)
- **Detail Modal**: View full approval details including reasoning and audit trail
- **Real-time Updates**: Refresh to see latest approvals

#### `AgentActionContext` Integration (`src/contexts/AgentActionContext.tsx`)

Enhanced to automatically log approvals to backend:

- When `requestApproval()` is called, creates backend approval request
- When user approves/rejects, updates backend status
- Maintains backward compatibility with existing UI

### Verisense Integration

#### Manifest Updates (`verisense-agent-manifest.json`)

The manifest now includes:

```json
{
  "capabilities": {
    "human_in_the_loop": true,
    "approval_workflows": true,
    "audit_trail": true
  },
  "endpoints": {
    "human_in_the_loop": "https://<YOUR_DEPLOYED_URL>/api/human-in-the-loop/verisense-webhook"
  }
}
```

#### Webhook Support

Verisense can trigger approval requests via webhook:

```json
{
  "event": "agent.action.request",
  "data": {
    "userId": "user123",
    "agentId": "style-shepherd-agent",
    "actionType": "add_to_cart",
    "title": "Add products to cart",
    "description": "AI wants to add 3 items to cart",
    "reasoning": "Based on user's voice command",
    "confidence": 0.85,
    "riskLevel": "low",
    "metadata": {
      "products": [...]
    }
  }
}
```

## Usage Examples

### Creating an Approval Request

**Backend:**
```typescript
const approval = await humanInTheLoopService.createApprovalRequest({
  userId: 'user123',
  agentId: 'style-shepherd-agent',
  actionType: 'add_to_cart',
  title: 'Add products to cart',
  description: 'AI wants to add 3 items based on voice command',
  reasoning: 'User said "add these to my cart"',
  confidence: 0.85,
  riskLevel: 'low',
  metadata: {
    products: [...],
    estimatedValue: 299.99,
  },
});
```

**Frontend:**
```typescript
const approved = await requestApproval({
  type: 'add_to_cart',
  title: 'Add products to cart',
  description: 'AI wants to add 3 items',
  products: [...],
  metadata: {
    confidence: 0.85,
    reasoning: 'Based on voice command',
  },
});
```

### Viewing Approval History

```tsx
import { HumanApprovalHistory } from '@/components/HumanApprovalHistory';

<HumanApprovalHistory userId="user123" />
```

### Getting Statistics

```typescript
const stats = await humanInTheLoopService.getApprovalStats({
  userId: 'user123',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
});

console.log(`Approval rate: ${stats.approvalRate * 100}%`);
console.log(`Average confidence: ${stats.averageConfidence * 100}%`);
```

## Approval Workflow

1. **AI Agent Decision**: AI determines an action needs approval
2. **Create Request**: Backend creates approval request with status "pending"
3. **User Notification**: Frontend shows approval dialog
4. **Human Decision**: User approves or rejects
5. **Update Status**: Backend updates approval status
6. **Audit Trail**: All events logged with timestamps
7. **Action Execution**: If approved, action proceeds; if rejected, action cancelled

## Data Storage

### Database Schema (PostgreSQL)

```sql
CREATE TABLE IF NOT EXISTS human_approvals (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  agent_id VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  requested_at TIMESTAMP NOT NULL,
  responded_at TIMESTAMP,
  expires_at TIMESTAMP,
  approved_by VARCHAR(255),
  rejected_by VARCHAR(255),
  reasoning TEXT,
  user_reasoning TEXT,
  confidence DECIMAL(3,2),
  risk_level VARCHAR(10),
  metadata JSONB,
  audit_trail JSONB
);

CREATE INDEX idx_human_approvals_user_id ON human_approvals(user_id);
CREATE INDEX idx_human_approvals_status ON human_approvals(status);
CREATE INDEX idx_human_approvals_requested_at ON human_approvals(requested_at);
```

### File Storage

Approvals are also stored in `logs/human_approvals.json` for redundancy and easy access.

## Configuration

### Approval Timeout

Default: 30 minutes

To change, modify `PENDING_APPROVALS_TTL` in `HumanInTheLoopService.ts`:

```typescript
private readonly PENDING_APPROVALS_TTL = 30 * 60 * 1000; // 30 minutes
```

### Auto-Expiration

Run a cron job to expire old approvals:

```bash
curl -X POST http://localhost:3001/api/human-in-the-loop/expire
```

## Security Considerations

1. **User Authentication**: Ensure userId is validated before creating approvals
2. **Authorization**: Only the requesting user should be able to approve/reject
3. **Rate Limiting**: Approval endpoints are rate-limited via Express middleware
4. **Audit Trail**: All actions are logged and cannot be modified
5. **Expiration**: Pending approvals expire automatically to prevent stale requests

## Monitoring

### Key Metrics

- **Approval Rate**: Percentage of approved vs rejected actions
- **Average Confidence**: AI confidence scores for approved actions
- **Response Time**: Time between request and human decision
- **Pending Count**: Number of approvals awaiting human decision

### Alerts

Consider setting up alerts for:
- High rejection rate (>50%)
- Many pending approvals (>10)
- Low average confidence (<0.5)

## Future Enhancements

1. **Batch Approvals**: Approve multiple similar actions at once
2. **Approval Rules**: Auto-approve based on confidence/risk thresholds
3. **Notification System**: Email/SMS notifications for pending approvals
4. **Approval Delegation**: Allow users to delegate approvals
5. **Analytics Dashboard**: Visual analytics for approval patterns

## Testing

### Manual Testing

1. Create an approval request via API
2. View it in the frontend component
3. Approve/reject and verify status update
4. Check audit trail in detail view

### Automated Testing

```typescript
// Example test
describe('HumanInTheLoopService', () => {
  it('should create and approve an action', async () => {
    const approval = await service.createApprovalRequest({...});
    expect(approval.status).toBe('pending');
    
    const approved = await service.approveAction(approval.id, 'user123');
    expect(approved.status).toBe('approved');
  });
});
```

## Troubleshooting

### Approvals Not Showing

- Check database connection
- Verify file permissions for `logs/` directory
- Check API endpoint is accessible

### Approvals Not Expiring

- Verify cron job is running
- Check expiration logic in service
- Manually trigger expiration endpoint

### Webhook Not Working

- Verify webhook URL in manifest
- Check webhook signature validation
- Review webhook event format

## Support

For issues or questions:
- Check logs in `logs/human_approvals.json`
- Review database `human_approvals` table
- Check API endpoint responses
- Review audit trail for specific approval



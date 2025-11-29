# Style Shepherd Backend API

Backend API server for the Style Shepherd voice commerce platform, built according to the technical plan.

## Features

- ✅ **Vultr PostgreSQL Integration** - Managed database for products, users, orders
- ✅ **Vultr Valkey Integration** - Redis-compatible caching for sessions and recommendations
- ✅ **Raindrop Smart Components** - SmartMemory, SmartBuckets, SmartSQL, SmartInference
- ✅ **ElevenLabs Voice Integration** - Voice conversation handling
- ✅ **WorkOS Authentication** - Enterprise-ready authentication
- ✅ **Stripe Payments** - Payment processing with return prediction
- ✅ **Product Recommendation API** - ML-powered recommendations using Vultr GPU
- ✅ **Fashion Engine** - Size prediction and style matching

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp env.template .env
   # Edit .env with your credentials
   # For SenseSpace token, get it from: https://www.sensespace.xyz/miniapps/tokens
   ```

3. **Initialize database:**
   ```bash
   # Run the SQL schema on your Vultr PostgreSQL instance
   psql -h $VULTR_POSTGRES_HOST -U $VULTR_POSTGRES_USER -d $VULTR_POSTGRES_DATABASE -f src/db/init.sql
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Vultr Services
- `GET /api/vultr/postgres/health` - PostgreSQL health
- `GET /api/vultr/postgres/products` - Get products
- `GET /api/vultr/postgres/users/:userId/profile` - Get user profile
- `POST /api/vultr/postgres/users/:userId/profile` - Save user profile
- `GET /api/vultr/valkey/health` - Valkey health
- `POST /api/vultr/valkey/session/:sessionId` - Set session
- `GET /api/vultr/valkey/session/:sessionId` - Get session

### Product Recommendations
- `POST /api/recommendations` - Get personalized recommendations
- `POST /api/visual-search` - Visual similarity search
- `POST /api/size-prediction` - Predict optimal size

### Voice Assistant
- `POST /api/voice/conversation/start` - Start conversation
- `POST /api/voice/conversation/process` - Process voice input
- `GET /api/voice/conversation/history/:userId` - Get conversation history

### Fashion Engine
- `POST /api/fashion/recommendation` - Get fashion recommendation

### Payments
- `POST /api/payments/intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/webhook` - Stripe webhook handler
- `POST /api/payments/return-prediction` - Predict return risk

### Authentication
- `GET /api/auth/authorize` - Get authorization URL
- `POST /api/auth/callback` - Handle OAuth callback
- `GET /api/auth/profile/:userId` - Get user profile

### Sponsor Integrations (Hackathon)
- `GET /api/sponsors` - Get all sponsor integration status and metrics
- `GET /api/sponsors/:sponsorId` - Get specific sponsor details (ambient, cambrian, letta)
- `GET /api/sponsors/metrics` - Get aggregated metrics for all sponsors
- `GET /api/sponsors/ambient/analytics` - Get Ambient analytics data
- `GET /api/sponsors/ambient/data-points` - Get Ambient data points metrics
- `GET /api/sponsors/cambrian/onchain` - Get Cambrian onchain data metrics
- `GET /api/sponsors/cambrian/offchain` - Get Cambrian offchain data metrics
- `GET /api/sponsors/letta/workflows` - Get Letta workflow metrics
- `GET /api/sponsors/letta/operations` - Get Letta operations metrics

### MCP (Model Context Protocol)
- `GET /api/mcp/tools` - List all available MCP tools
- `GET /api/mcp/tools/:name` - Get specific tool definition
- `POST /api/mcp/tools/:name/call` - Execute an MCP tool
- `POST /api/mcp/call` - Alternative tool execution endpoint
- `GET /api/mcp/info` - Get MCP server information

### Verisense / SenseSpace
- `GET /api/sensespace/token` - Get SenseSpace token
- `GET /api/sensespace/profile/:id` - Get user profile from SenseSpace
- `GET /api/verisense/profile/:id` - Alias for SenseSpace profile endpoint
- `POST /api/verisense/agent-webhook` - Webhook endpoint for Verisense agent events

### Verisense Nucleus
- `GET /api/verisense-nucleus/status` - Get Nucleus status
- `POST /api/verisense-nucleus/deposit` - Deposit funds to Nucleus
- `POST /api/verisense-nucleus/preferences` - Store user preferences
- `GET /api/verisense-nucleus/preferences/:userId` - Get user preferences
- `POST /api/verisense-nucleus/recommendations` - Index recommendations
- `GET /api/verisense-nucleus/recommendations/:userId` - Get recommendations
- `GET /api/verisense-nucleus/health` - Health check

### Human-in-the-Loop
- `POST /api/human-in-the-loop/request` - Create approval request
- `POST /api/human-in-the-loop/approve/:id` - Approve action
- `POST /api/human-in-the-loop/reject/:id` - Reject action
- `GET /api/human-in-the-loop/approval/:id` - Get specific approval
- `GET /api/human-in-the-loop/approvals` - List approvals
- `GET /api/human-in-the-loop/stats` - Get statistics

### Agents
- `GET /api/agents/agents` - Get all available agents
- `GET /api/agents/agents/:agentId` - Get specific agent
- `GET /api/agents/by-capability/:capability` - Get agents by capability
- `POST /api/agents/suggest` - Suggest agent based on context

### RAG Agent
- `POST /api/rag-agent/query` - Query the RAG agent
- `POST /api/rag-agent/index` - Index a document
- `POST /api/rag-agent/index/batch` - Index multiple documents
- `GET /api/rag-agent/stats` - Get index statistics
- `DELETE /api/rag-agent/index` - Clear the index

## Architecture

The backend follows the technical plan structure:

- **Services Layer**: Business logic (ProductRecommendationAPI, VoiceAssistant, FashionEngine, PaymentService, AuthService)
- **Lib Layer**: Infrastructure (Raindrop config, Vultr PostgreSQL, Vultr Valkey)
- **Routes Layer**: API endpoints
- **Config Layer**: Environment configuration

## Integration with Frontend

The frontend Vite app expects these API endpoints. Update the frontend's Vultr service files to point to:
- Development: `http://localhost:3001/api/vultr`
- Production: `https://your-backend-domain.com/api/vultr`

## Deployment

This backend can be deployed to:
- Raindrop Platform (recommended)
- Vultr Kubernetes Engine
- Any Node.js hosting platform

Ensure all environment variables are set in your deployment environment.


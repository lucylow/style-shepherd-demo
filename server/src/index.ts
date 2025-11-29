/**
 * Style Shepherd Backend API Server
 * Main entry point for the backend API
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import env from './config/env.js';
import vultrRoutes from './routes/vultr.js';
import apiRoutes from './routes/api.js';
import sensespaceRoutes from './routes/sensespace.js';
import verisenseRoutes from './routes/verisense.js';
import verisenseNucleusRoutes from './routes/verisense-nucleus.js';
import mcpRoutes from './routes/mcp.js';
import agentRoutes from './routes/agent.js';
import humanInTheLoopRoutes from './routes/human-in-the-loop.js';
import agentPaymentRoutes from './routes/agent-payment.js';
import sponsorRoutes from './routes/sponsors.js';
import { vultrPostgres } from './lib/vultr-postgres.js';
import { vultrValkey } from './lib/vultr-valkey.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        // For Lovable/Raindrop deployment, allow same-origin requests
        callback(null, true); // Allow all origins in production (adjust as needed)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing - IMPORTANT: Stripe webhooks need raw body for signature verification
// We need to handle webhook route separately with raw body, then use JSON for other routes
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Body parsing for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const [postgresHealth, valkeyHealth] = await Promise.all([
      vultrPostgres.healthCheck(),
      vultrValkey.healthCheck(),
    ]);

    res.json({
      status: 'healthy',
      services: {
        postgres: postgresHealth,
        valkey: valkeyHealth,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Service health check failed',
    });
  }
});

// API routes
app.use('/api/vultr', vultrRoutes);
app.use('/api/sensespace', sensespaceRoutes);
app.use('/api/verisense', verisenseRoutes); // Alias for /api/sensespace for compatibility
app.use('/api/verisense-nucleus', verisenseNucleusRoutes); // Verisense Nucleus capabilities
app.use('/api/mcp', mcpRoutes); // MCP (Model Context Protocol) server for AI agents
app.use('/api/agent', agentRoutes);
app.use('/api/agent-payment', agentPaymentRoutes); // Agent payment API routes
app.use('/api/human-in-the-loop', humanInTheLoopRoutes); // Human-in-the-loop approval system
app.use('/api/sponsors', sponsorRoutes); // Sponsor integration endpoints (Ambient, Cambrian, Letta)
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    name: 'Style Shepherd API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      vultr: '/api/vultr',
      api: '/api',
    },
  });
});

// Error handling middleware
import { AppError, isAppError, toAppError } from './lib/errors.js';

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Convert to AppError if needed
  const error = isAppError(err) ? err : toAppError(err);
  
  // Log error with context
  const logData = {
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
    timestamp: new Date().toISOString(),
    ...(env.NODE_ENV === 'development' && { stack: error.stack }),
  };
  
  if (error.statusCode >= 500) {
    console.error('Server Error:', logData);
  } else {
    console.warn('Client Error:', logData);
  }
  
  // Send error response
  res.status(error.statusCode).json(error.toJSON());
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Style Shepherd API server running on port ${PORT}`);
  console.log(`📊 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down gracefully...`);
  
  // Stop accepting new connections
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      // Close database connections with timeout
      const shutdownTimeout = setTimeout(() => {
        console.error('Shutdown timeout exceeded, forcing exit');
        process.exit(1);
      }, 10000); // 10 second timeout

      await Promise.all([
        vultrPostgres.close().catch((err) => {
          console.error('Error closing PostgreSQL connection:', err);
        }),
        vultrValkey.close().catch((err) => {
          console.error('Error closing Valkey connection:', err);
        }),
      ]);

      clearTimeout(shutdownTimeout);
      console.log('All connections closed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 15 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 15000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

export default app;


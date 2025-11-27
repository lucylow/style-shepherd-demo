/**
 * MCP (Model Context Protocol) Routes
 * 
 * Exposes MCP server endpoints for AI agents to discover and use Verisense Nucleus tools.
 * Follows the MCP specification for tool discovery and execution.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validation.js';
import { MCPServer } from '../services/verisense/MCPServer.js';
import type { NucleusConfig } from '../services/verisense/index.js';

const router = Router();

// Singleton MCP server instance
let mcpServerInstance: MCPServer | null = null;

/**
 * Initialize MCP server instance
 */
function getMCPServer(): MCPServer {
  if (!mcpServerInstance) {
    const config: NucleusConfig = {
      id: 'style-shepherd-nucleus',
      name: 'Style Shepherd Nucleus',
      version: '1.0.0',
      publisherAddress: process.env.NUCLEUS_PUBLISHER_ADDRESS || '0x0000000000000000000000000000000000000000',
      nodeCount: 5,
      initialBalance: 100,
    };

    mcpServerInstance = new MCPServer(config);
  }

  return mcpServerInstance;
}

/**
 * GET /api/mcp/tools
 * List all available MCP tools
 */
router.get('/tools', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mcp = getMCPServer();
    const tools = mcp.listTools();

    res.status(200).json({
      success: true,
      tools,
      count: tools.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mcp/tools/:name
 * Get a specific tool definition
 */
router.get('/tools/:name', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.params;
    const mcp = getMCPServer();
    const tool = mcp.getTool(name);

    if (!tool) {
      return res.status(404).json({
        success: false,
        error: `Tool "${name}" not found`,
      });
    }

    res.status(200).json({
      success: true,
      tool,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mcp/tools/:name/call
 * Execute an MCP tool
 */
router.post(
  '/tools/:name/call',
  validateBody(
    z.object({
      arguments: z.record(z.any()).optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.params;
      const { arguments: args = {} } = req.body;

      const mcp = getMCPServer();
      const result = await mcp.callTool(name, args);

      res.status(200).json({
        success: !result.isError,
        result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/mcp/call
 * Execute an MCP tool (alternative endpoint with tool name in body)
 */
router.post(
  '/call',
  validateBody(
    z.object({
      tool: z.string().min(1, 'Tool name is required'),
      arguments: z.record(z.any()).optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tool, arguments: args = {} } = req.body;

      const mcp = getMCPServer();
      const result = await mcp.callTool(tool, args);

      res.status(200).json({
        success: !result.isError,
        result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/mcp/info
 * Get MCP server information
 */
router.get('/info', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mcp = getMCPServer();
    const tools = mcp.listTools();
    const status = mcp.getNucleus().getStatus();

    res.status(200).json({
      success: true,
      info: {
        protocol: 'MCP',
        version: '1.0.0',
        server: 'Verisense Nucleus MCP Server',
        toolCount: tools.length,
        nucleusStatus: {
          operational: mcp.getNucleus().canOperate(),
          balance: status.billing.balance,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;



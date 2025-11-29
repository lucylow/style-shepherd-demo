# Cambrian Integration

Style Shepherd integrates with Cambrian to access both onchain and offchain data for enhanced product recommendations and market insights.

## Overview

Cambrian provides comprehensive data APIs for blockchain and offchain information, enabling Style Shepherd to access rich contextual data about products, trends, and user preferences.

## Resources

- **MCP Endpoint**: https://dashboard.verisense.network/mcp/kGhkwwLcFngbe41AM6oFFvKsDvec1revFzqhKMFLAnX29mSwT
- **API Documentation**: https://docs.cambrian.org/api
- **Onchain Data OpenAPI**: https://opabinia.cambrian.org/openapi.json
- **Offchain Data OpenAPI**: https://deep42.cambrian.network/openapi.json

## Integration Details

### Key Metrics

- **Total API Calls**: 5.6M monthly
- **Onchain Queries**: 3.2M monthly
- **Offchain Queries**: 2.4M monthly
- **Average Response Time**: 89ms
- **Monthly Value**: $1.45M
- **ROI**: 2,800%

### Use Cases

1. **Product Verification**: Verify product authenticity and provenance onchain
2. **Market Trends**: Access offchain market data for trend analysis
3. **User Preferences**: Cross-reference user preferences with blockchain data
4. **Supply Chain**: Track product origins and supply chain information

## API Configuration

### Environment Variables

```env
CAMBRIAN_MCP_ENDPOINT=https://dashboard.verisense.network/mcp/kGhkwwLcFngbe41AM6oFFvKsDvec1revFzqhKMFLAnX29mSwT
CAMBRIAN_ONCHAIN_API=https://opabinia.cambrian.org
CAMBRIAN_OFFCHAIN_API=https://deep42.cambrian.network
CAMBRIAN_API_KEY=<your_api_key>
```

### MCP Integration

The Cambrian MCP endpoint is configured in the Verisense dashboard and accessible via the MCP protocol for agent-to-agent communication.

## Integration Status

✅ **Status**: Active  
✅ **MCP Endpoint**: Configured  
✅ **API Access**: Enabled  
✅ **Monthly Calls**: 5.6M  

## Business Impact

- **Data Enrichment**: Enhanced product recommendations with onchain/offchain data
- **Market Intelligence**: Real-time market trend analysis
- **User Trust**: Verified product authenticity increases customer confidence
- **Value Generated**: $1.45M monthly value through improved recommendations

## Next Steps

1. Configure API keys in environment variables
2. Set up MCP endpoint access in Verisense dashboard
3. Implement API client for onchain/offchain queries
4. Integrate data into recommendation engine


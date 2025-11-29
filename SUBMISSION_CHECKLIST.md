# Hackathon Submission Checklist

**Calling For All Agents! Hackathon**  
**Submission Deadline**: Extended to December 1, 2025, 22:51 UTC

---

## ✅ Pre-Submission Checklist

### 1. Repository Requirements

- [x] **GitHub Repository**: Public and accessible
  - URL: `https://github.com/lucylow/style-shepherd-demo`
  - [ ] Ensure all files are committed
  - [ ] Push latest changes
  - [ ] Verify repository is accessible to judges

- [x] **README.md**: Comprehensive and up-to-date
  - [x] Project overview
  - [x] Setup instructions
  - [x] Architecture documentation
  - [x] API documentation
  - [ ] Verify all links work
  - [ ] Add hackathon badge/mention

### 2. Agent Registration

- [x] **Verisense Agent Registration**
  - [x] Agent registered on Verisense dashboard
  - [ ] Verify agent is active and discoverable
  - [ ] Test A2A endpoints are accessible
  - [ ] Confirm agent.json is accurate

- [x] **MCP Registration**
  - [x] MCP tools registered
  - [ ] Test MCP endpoints (`/api/mcp`)
  - [ ] Verify tools are discoverable
  - [ ] Confirm Cambrian MCP endpoint is configured

- [x] **Agent Manifest**
  - [x] `agent.json` is complete and valid
  - [x] `verisense-agent-manifest.json` is complete
  - [ ] Validate manifest against Verisense schema
  - [ ] Update deployment URLs if needed

### 3. Sponsor Tool Integration

- [x] **Ambient - LLM Track**
  - [x] Integration documentation exists
  - [ ] Verify Ambient integration is functional
  - [ ] Document usage in agent.json
  - [ ] Add metrics/logging for Ambient usage

- [x] **Cambrian - MCP Track**
  - [x] MCP endpoint configured
  - [ ] Test Cambrian MCP endpoint connectivity
  - [ ] Verify onchain/offchain API access
  - [ ] Document Cambrian usage in demo

- [x] **Letta - RAG/Memory Track**
  - [x] RAG Agent implemented
  - [ ] Verify RAG functionality
  - [ ] Test memory/retrieval features
  - [ ] Document Letta integration

- [ ] **Track-Specific Submission** (if applicable)
  - [ ] Review track-specific rules
  - [ ] Ensure track requirements are met
  - [ ] Prepare track-specific documentation

### 4. Demo Video

- [x] **Script Prepared**
  - [x] 2-minute script written (`DEMO_VIDEO_SCRIPT_2MIN.md`)
  - [ ] Review script for clarity
  - [ ] Practice narration timing

- [ ] **Video Recording**
  - [ ] Record screen demo
  - [ ] Add voiceover narration
  - [ ] Edit video to exactly 2:00 minutes (or under)
  - [ ] Add captions/subtitles (recommended)
  - [ ] Export in required format (MP4, 1080p recommended)

- [ ] **Video Upload**
  - [ ] Upload to YouTube/Vimeo (unlisted)
  - [ ] Get video URL for submission
  - [ ] Test video playback
  - [ ] Create thumbnail image

### 5. A2A Compatibility

- [x] **A2A Protocol Implementation**
  - [x] JSON-RPC endpoint working
  - [ ] Test A2A communication with other agents
  - [ ] Verify profile access via SenseSpace
  - [ ] Test agent-to-agent message passing

- [x] **Mini App Interface**
  - [x] MiniApp UI at `/verisense-demo`
  - [ ] Test MiniApp in Verisense dashboard
  - [ ] Verify SenseSpace SDK integration
  - [ ] Test user interactions

### 6. Documentation

- [x] **Submission Document**
  - [x] `HACKATHON_SUBMISSION.md` created
  - [ ] Review for completeness
  - [ ] Verify all links and references
  - [ ] Add repository link to submission

- [x] **Technical Documentation**
  - [x] Architecture docs
  - [x] Integration guides
  - [x] API documentation
  - [ ] Verify all docs are accessible

- [x] **Demo Documentation**
  - [x] Demo quick start guide
  - [ ] Update with hackathon context
  - [ ] Add demo video link

### 7. Code Quality

- [ ] **Code Review**
  - [ ] Remove debug code
  - [ ] Add/update comments
  - [ ] Ensure error handling is comprehensive
  - [ ] Verify TypeScript types are correct

- [ ] **Dependencies**
  - [ ] Update package.json versions if needed
  - [ ] Remove unused dependencies
  - [ ] Document all required environment variables
  - [ ] Create `.env.example` file

- [ ] **Security**
  - [ ] Remove hardcoded secrets
  - [ ] Verify environment variable usage
  - [ ] Review API key handling
  - [ ] Check for exposed credentials

### 8. Testing

- [ ] **Local Testing**
  - [ ] Test all agent endpoints
  - [ ] Verify MCP tools work
  - [ ] Test MiniApp interface
  - [ ] Verify sponsor tool integrations
  - [ ] Test voice interactions

- [ ] **Integration Testing**
  - [ ] Test A2A communication
  - [ ] Verify Verisense profile access
  - [ ] Test MCP Nucleus services
  - [ ] Verify scheduled tasks (timers)

### 9. Deployment

- [ ] **Production Deployment**
  - [ ] Deploy to production environment
  - [ ] Verify all URLs are accessible
  - [ ] Test public endpoints
  - [ ] Verify SSL certificates

- [ ] **URL Verification**
  - [ ] Update agent.json with production URLs
  - [ ] Update verisense-agent-manifest.json
  - [ ] Verify all links in documentation
  - [ ] Test MiniApp URL in Verisense dashboard

### 10. Submission Platform

- [ ] **DoraHacks Submission**
  - [ ] Login to DoraHacks platform
  - [ ] Complete submission form
  - [ ] Upload GitHub repository link
  - [ ] Upload demo video (or provide URL)
  - [ ] Complete project description
  - [ ] Add tags (Blockchain, AI, Agent, Agentic, A2A, web3 ecosystem)
  - [ ] Submit before deadline

---

## 📋 Submission Form Checklist

When submitting on DoraHacks, ensure you have:

- [ ] **Project Name**: Style Shepherd
- [ ] **Repository URL**: https://github.com/lucylow/style-shepherd-demo
- [ ] **Demo Video URL**: [To be added]
- [ ] **Project Description**: One-liner and overview
- [ ] **Tags**: Blockchain, AI, Agent, Agentic, A2A, web3 ecosystem, Google, Verisense
- [ ] **Hackathon Track**: [Select applicable tracks]
- [ ] **Team Members**: Lucy Low
- [ ] **Contact Email**: low.lucyy@gmail.com

---

## 🎯 Key Submission Points

### Must Highlight

1. ✅ **Multi-agent architecture** (8 specialized agents)
2. ✅ **Autonomous operations** (background agents, scheduled tasks)
3. ✅ **Sponsor tool usage** (Ambient, Cambrian, Letta)
4. ✅ **A2A + MCP integration** (full Verisense ecosystem)
5. ✅ **Real impact** (28% return reduction, $88K savings)

### Must Demonstrate

1. ✅ **Autonomy**: Show autonomous agent operations
2. ✅ **Sophistication**: Multi-agent collaboration
3. ✅ **Technical Depth**: MCP tools, A2A protocol, RAG system
4. ✅ **Impact**: Real metrics and business value

---

## ⚠️ Common Pitfalls to Avoid

- [ ] **Video Too Long**: Keep it at or under 2 minutes
- [ ] **Missing Sponsor Tools**: Ensure at least 1 sponsor tool is clearly demonstrated
- [ ] **Incomplete Registration**: Verify agent is fully registered on Verisense
- [ ] **Broken Links**: Test all URLs before submission
- [ ] **Missing Demo Video**: This is required!
- [ ] **Late Submission**: Submit well before deadline (extended to Dec 1, 22:51 UTC)

---

## 📅 Timeline

- **Today**: Complete checklist items
- **By Nov 30**: Record and edit demo video
- **By Dec 1, 12:00 UTC**: Final code review and deployment
- **By Dec 1, 18:00 UTC**: Complete DoraHacks submission
- **Dec 1, 22:51 UTC**: Submission deadline (extended)

---

## 🆘 Need Help?

If you encounter issues:

1. **Verisense Integration**: Check `docs/sensespace/` and `docs/integrations/VERISENSE_QUICK_START.md`
2. **MCP Tools**: Review `docs/mcp/MCP_TOOLS_QUICK_REFERENCE.md`
3. **Sponsor Tools**: Check integration docs in `docs/integrations/`
4. **Demo Issues**: Review `docs/guides/DEMO_QUICK_START.md`

---

**Last Updated**: November 29, 2025  
**Status**: ⏳ In Progress  
**Next Review**: Before submission deadline

---

*Check off items as you complete them! ✅*


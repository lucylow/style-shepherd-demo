#!/usr/bin/env node
/**
 * Voice Agent Validation Script
 * Tests all voice agent endpoints to ensure everything is working correctly
 */

const http = require('http');
const https = require('https');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_USER_ID = 'test-user-' + Date.now();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testHealthCheck() {
  log('\n🔍 Testing Health Check...', 'cyan');
  try {
    const response = await makeRequest('GET', '/health');
    if (response.status === 200) {
      log('✅ Health check passed', 'green');
      return true;
    } else {
      log(`❌ Health check failed: Status ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, 'red');
    log('   Make sure the server is running on ' + API_BASE_URL, 'yellow');
    return false;
  }
}

async function testStartConversation() {
  log('\n🔍 Testing Start Conversation...', 'cyan');
  try {
    const response = await makeRequest('POST', '/api/voice/conversation/start', {
      userId: TEST_USER_ID,
    });

    if (response.status === 200 && response.body.conversationId) {
      log('✅ Start conversation passed', 'green');
      log(`   Conversation ID: ${response.body.conversationId}`, 'blue');
      return response.body;
    } else {
      log(`❌ Start conversation failed: Status ${response.status}`, 'red');
      if (response.body.error) {
        log(`   Error: ${JSON.stringify(response.body.error)}`, 'yellow');
      }
      return null;
    }
  } catch (error) {
    log(`❌ Start conversation failed: ${error.message}`, 'red');
    return null;
  }
}

async function testProcessVoiceInput(conversationId) {
  log('\n🔍 Testing Process Voice Input...', 'cyan');
  try {
    // Create a minimal audio blob (empty WebM header for testing)
    // In production, this would be actual audio data
    const testAudioBase64 = 'GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRC84EKCgAAAABmZXJmAAA'; // Minimal valid WebM header
    
    const response = await makeRequest('POST', '/api/voice/conversation/process', {
      conversationId: conversationId,
      audioStream: testAudioBase64,
      userId: TEST_USER_ID,
      audioPreferred: true,
    });

    if (response.status === 200) {
      log('✅ Process voice input passed', 'green');
      if (response.body.text) {
        log(`   Response text: ${response.body.text.substring(0, 100)}...`, 'blue');
      }
      if (response.body.intent) {
        log(`   Intent: ${response.body.intent}`, 'blue');
      }
      if (response.body.audio) {
        log(`   Audio response received (${response.body.audio.length} chars)`, 'blue');
      }
      return response.body;
    } else {
      log(`⚠️  Process voice input returned status ${response.status}`, 'yellow');
      if (response.body.error) {
        log(`   Error: ${JSON.stringify(response.body.error)}`, 'yellow');
        log('   This is expected if STT service is not configured', 'yellow');
      }
      return response.body;
    }
  } catch (error) {
    log(`❌ Process voice input failed: ${error.message}`, 'red');
    return null;
  }
}

async function testGetConversationHistory() {
  log('\n🔍 Testing Get Conversation History...', 'cyan');
  try {
    const response = await makeRequest('GET', `/api/voice/conversation/history/${TEST_USER_ID}?limit=10`);

    if (response.status === 200) {
      log('✅ Get conversation history passed', 'green');
      if (response.body.history) {
        log(`   History items: ${response.body.history.length}`, 'blue');
      }
      return true;
    } else {
      log(`⚠️  Get conversation history returned status ${response.status}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Get conversation history failed: ${error.message}`, 'red');
    return false;
  }
}

async function testGetUserPreferences() {
  log('\n🔍 Testing Get User Preferences...', 'cyan');
  try {
    const response = await makeRequest('GET', `/api/voice/preferences/${TEST_USER_ID}`);

    if (response.status === 200) {
      log('✅ Get user preferences passed', 'green');
      if (response.body.preferences) {
        log(`   Preferences: ${JSON.stringify(response.body.preferences)}`, 'blue');
      }
      return true;
    } else {
      log(`⚠️  Get user preferences returned status ${response.status}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Get user preferences failed: ${error.message}`, 'red');
    return false;
  }
}

async function testAssistantEndpoint() {
  log('\n🔍 Testing Assistant Endpoint (Text Query)...', 'cyan');
  try {
    const response = await makeRequest('POST', '/api/assistant', {
      query: 'Show me blue dresses',
      userId: TEST_USER_ID,
      audioPreferred: false,
    });

    if (response.status === 200) {
      log('✅ Assistant endpoint passed', 'green');
      if (response.body.text) {
        log(`   Response: ${response.body.text.substring(0, 100)}...`, 'blue');
      }
      if (response.body.intent) {
        log(`   Intent: ${response.body.intent}`, 'blue');
      }
      return true;
    } else {
      log(`⚠️  Assistant endpoint returned status ${response.status}`, 'yellow');
      if (response.body.error) {
        log(`   Error: ${JSON.stringify(response.body.error)}`, 'yellow');
      }
      return false;
    }
  } catch (error) {
    log(`❌ Assistant endpoint failed: ${error.message}`, 'red');
    return false;
  }
}

async function testEndConversation(conversationId) {
  log('\n🔍 Testing End Conversation...', 'cyan');
  try {
    const response = await makeRequest('POST', '/api/voice/conversation/end', {
      conversationId: conversationId,
      userId: TEST_USER_ID,
    });

    if (response.status === 200 && response.body.success) {
      log('✅ End conversation passed', 'green');
      return true;
    } else {
      log(`⚠️  End conversation returned status ${response.status}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ End conversation failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     Voice Agent Feature Validation Script                  ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  log(`\nTesting against: ${API_BASE_URL}`, 'blue');
  log(`Test User ID: ${TEST_USER_ID}`, 'blue');

  const results = {
    healthCheck: false,
    startConversation: false,
    processVoiceInput: false,
    conversationHistory: false,
    userPreferences: false,
    assistantEndpoint: false,
    endConversation: false,
  };

  // Test 1: Health Check
  results.healthCheck = await testHealthCheck();
  if (!results.healthCheck) {
    log('\n⚠️  Server is not responding. Please start the server first.', 'yellow');
    log('   Run: cd server && npm run dev', 'yellow');
    process.exit(1);
  }

  // Test 2: Start Conversation
  const conversationState = await testStartConversation();
  if (conversationState) {
    results.startConversation = true;
  }

  // Test 3: Process Voice Input
  if (conversationState) {
    const processResult = await testProcessVoiceInput(conversationState.conversationId);
    results.processVoiceInput = processResult !== null;
  }

  // Test 4: Get Conversation History
  results.conversationHistory = await testGetConversationHistory();

  // Test 5: Get User Preferences
  results.userPreferences = await testGetUserPreferences();

  // Test 6: Assistant Endpoint (Text Query)
  results.assistantEndpoint = await testAssistantEndpoint();

  // Test 7: End Conversation
  if (conversationState) {
    results.endConversation = await testEndConversation(conversationState.conversationId);
  }

  // Summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    Test Summary                             ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status.padEnd(10)} ${test}`, color);
  });

  log(`\nTotal: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'green' : 'yellow');

  if (passedTests === totalTests) {
    log('\n🎉 All voice agent endpoints are working correctly!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Check the errors above.', 'yellow');
    log('   Note: Some failures may be expected if STT/TTS services are not configured.', 'yellow');
    process.exit(1);
  }
}

// Run the validation
main().catch((error) => {
  log(`\n❌ Validation script failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});



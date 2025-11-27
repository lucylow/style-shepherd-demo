/**
 * RAG Agent Usage Example
 * 
 * This example demonstrates how to use the RAG agent:
 * 1. Initialize with sample documents
 * 2. Query the agent
 * 3. Index custom documents
 * 4. Get statistics
 */

import { ragAgent } from '../services/RAGAgent.js';
import { initializeRAGWithSamples } from '../services/rag-sample-documents.js';

async function main() {
  console.log('🚀 RAG Agent Example\n');

  try {
    // 1. Initialize with sample documents
    console.log('📚 Step 1: Initializing with sample documents...');
    await initializeRAGWithSamples();
    console.log('✅ Sample documents indexed\n');

    // 2. Get statistics
    console.log('📊 Step 2: Getting index statistics...');
    const stats = await ragAgent.getIndexStats();
    console.log('Index stats:', stats);
    console.log('');

    // 3. Query examples
    console.log('❓ Step 3: Querying the RAG agent...\n');

    // Example 1: Thanksgiving styling
    console.log('Query 1: "What should I wear to Thanksgiving dinner?"');
    const response1 = await ragAgent.query({
      query: 'What should I wear to Thanksgiving dinner?',
      user_id: 'example-user',
      topK: 3,
    });
    console.log('Answer:', response1.answer);
    console.log('Confidence:', response1.confidence);
    console.log('Sources:', response1.sources.map(s => s.title));
    console.log('');

    // Example 2: Color trends
    console.log('Query 2: "What colors are trending for fall 2025?"');
    const response2 = await ragAgent.query({
      query: 'What colors are trending for fall 2025?',
      topK: 2,
    });
    console.log('Answer:', response2.answer);
    console.log('Sources:', response2.sources.map(s => s.title));
    console.log('');

    // Example 3: Sizing question
    console.log('Query 3: "How should I size DenimCo jeans?"');
    const response3 = await ragAgent.query({
      query: 'How should I size DenimCo jeans?',
      topK: 2,
    });
    console.log('Answer:', response3.answer);
    console.log('Sources:', response3.sources.map(s => s.title));
    console.log('');

    // 4. Index a custom document
    console.log('📝 Step 4: Indexing a custom document...');
    await ragAgent.indexDocument({
      id: 'doc:custom-example',
      title: 'Custom Styling Guide',
      content: 'This is a custom document about personal styling. It covers color coordination, fit preferences, and seasonal considerations.',
      url: 'https://example.com/custom-guide',
      metadata: {
        category: 'custom',
        author: 'example',
      },
    });
    console.log('✅ Custom document indexed\n');

    // 5. Query with the new document
    console.log('❓ Step 5: Querying with new document...');
    const response4 = await ragAgent.query({
      query: 'Tell me about personal styling',
      topK: 3,
    });
    console.log('Answer:', response4.answer);
    console.log('Sources:', response4.sources.map(s => s.title));
    console.log('');

    // 6. Final statistics
    console.log('📊 Step 6: Final statistics...');
    const finalStats = await ragAgent.getIndexStats();
    console.log('Final stats:', finalStats);

    console.log('\n✅ Example completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as runRAGExample };



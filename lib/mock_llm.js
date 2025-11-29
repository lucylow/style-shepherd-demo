/**
 * Mock LLM Service for Demo Mode
 * Fast, deterministic responses for hackathon demo
 * In production, replace with real LLM calls (OpenAI, Cerebras, etc.)
 */

const MODEL_VERSION = "demo-v1";

const CannedResponses = {
  "trending": "Based on current trends from Ambient and Cambrian data: Wide-leg denim is trending up 23% this month, particularly in SEA markets. Sage green is also gaining popularity, replacing olive tones. For your style profile, I recommend checking out our wide-leg jeans collection in neutral tones.",
  "size recommendation": "Based on your measurements (height: 165cm, waist: 70cm, hips: 92cm) and previous purchases, I recommend size M for this item. Your fit history shows 92% satisfaction with size M in similar styles.",
  "makeup recommendation": "For your neutral undertone and light-medium depth (NC25), a dewy finish would complement your skin. Consider a soft glam look with neutral browns and rose tones that match your style preference.",
  "default": "I understand your request. Let me help you find the perfect items based on your style preferences and measurements."
};

/**
 * Generate mock LLM response
 * @param {string} prompt - User prompt
 * @param {Array} context - Context documents/sources
 * @returns {Promise<{text: string, model_version: string}>}
 */
async function generateResponse(prompt, context = []) {
  // Simulate minimal processing delay (demo mode)
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const lowerPrompt = prompt.toLowerCase();
  let text = CannedResponses.default;
  
  // Simple keyword matching for demo
  if (lowerPrompt.includes("trend") || lowerPrompt.includes("what's trending")) {
    text = CannedResponses.trending;
  } else if (lowerPrompt.includes("size") || lowerPrompt.includes("fit")) {
    text = CannedResponses["size recommendation"];
  } else if (lowerPrompt.includes("makeup") || lowerPrompt.includes("beauty")) {
    text = CannedResponses["makeup recommendation"];
  }
  
  // If context provided, mention it briefly
  if (context && context.length > 0) {
    const sourceNames = context.slice(0, 3).map(c => c.source_id || c.title || "source").join(", ");
    text += ` [Sources: ${sourceNames}]`;
  }
  
  return {
    text,
    model_version: MODEL_VERSION
  };
}

module.exports = {
  generateResponse,
  MODEL_VERSION
};


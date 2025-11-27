/**
 * Returns Predictor Service - JavaScript Bridge
 * JS version of the TypeScript predictor for Node-run scripts.
 * This allows the poller script to run without TypeScript compilation.
 */

/**
 * Mock prediction function that simulates improved return probability after agent intervention.
 * 
 * @param {Object} order - Order record with return probability before intervention
 * @param {string} order.order_id - Order identifier
 * @param {string} order.product_id - Product identifier
 * @param {number} order.order_value - Order value in currency units
 * @param {number} order.predicted_return_probability_before - Return probability before intervention (0-1)
 * @returns {Object} Prediction result with before/after probabilities and prevented value
 */
function mockPredictAfter(order) {
  // Validate input
  if (!order || !order.order_id) {
    throw new Error('Order record must have order_id');
  }
  if (typeof order.order_value !== 'number' || order.order_value < 0) {
    throw new Error('Order record must have valid order_value >= 0');
  }

  const before = Math.max(0, Math.min(1, order.predicted_return_probability_before || 0.3));

  // Deterministic pseudo-random improvement to show variability
  // Uses product_id as seed for consistent results
  const seed = Array.from(order.product_id || order.order_id || '')
    .reduce((s, ch) => s + ch.charCodeAt(0), 0) % 10;
  const improvement = 0.08 + (seed / 100); // 0.08 .. 0.17
  const after = Math.max(0, before - improvement);

  const preventedProb = Math.max(0, before - after);
  const preventedValue = preventedProb * (order.order_value || 0);

  return {
    order_id: order.order_id,
    predicted_before: Number(before.toFixed(3)),
    predicted_after: Number(after.toFixed(3)),
    prevented_probability: Number(preventedProb.toFixed(4)),
    prevented_value: Number(preventedValue.toFixed(2)),
  };
}

module.exports = { mockPredictAfter };


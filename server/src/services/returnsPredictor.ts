/**
 * Returns Predictor Service
 * Mock returns prediction engine for autonomous agent demo.
 * Simulates "before" and "after" probability and computes prevented value.
 */

export type OrderRecord = {
  order_id: string;
  product_id: string;
  order_value: number;
  predicted_return_probability_before: number;
  metadata?: Record<string, any>;
  sku?: string;
  user_id?: string;
  product_title?: string;
  brand?: string;
};

export type PredictionResult = {
  order_id: string;
  predicted_before: number;
  predicted_after: number;
  prevented_probability: number;
  prevented_value: number;
};

/**
 * Mock prediction function that simulates improved return probability after agent intervention.
 * Uses deterministic pseudo-random improvement based on product_id to show variability.
 * 
 * @param order - Order record with return probability before intervention
 * @returns Prediction result with before/after probabilities and prevented value
 */
export function mockPredictAfter(order: OrderRecord): PredictionResult {
  // Validate input
  if (!order.order_id) {
    throw new Error('Order record must have order_id');
  }
  if (typeof order.order_value !== 'number' || order.order_value < 0) {
    throw new Error('Order record must have valid order_value >= 0');
  }

  const before = Math.max(0, Math.min(1, order.predicted_return_probability_before ?? 0.3));

  // Deterministic pseudo-random improvement to show variability
  // Uses product_id as seed for consistent results
  const seed = Array.from(order.product_id || order.order_id || '')
    .reduce((s, ch) => s + ch.charCodeAt(0), 0) % 10;
  const improvement = 0.08 + (seed / 100); // 0.08 .. 0.17
  const after = Math.max(0, before - improvement);

  const preventedProb = Math.max(0, before - after);
  const preventedValue = preventedProb * (order.order_value ?? 0);

  return {
    order_id: order.order_id,
    predicted_before: Number(before.toFixed(3)),
    predicted_after: Number(after.toFixed(3)),
    prevented_probability: Number(preventedProb.toFixed(4)),
    prevented_value: Number(preventedValue.toFixed(2)),
  };
}

/**
 * Batch prediction for multiple orders
 */
export function mockPredictAfterBatch(orders: OrderRecord[]): PredictionResult[] {
  return orders.map(order => mockPredictAfter(order));
}


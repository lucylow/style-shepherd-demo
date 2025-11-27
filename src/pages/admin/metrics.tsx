// pages/admin/metrics.tsx
import React, { useEffect, useState } from 'react';
import AdminMetricCard from '../../components/AdminMetricCard';
import api from '@/lib/api';
import HeaderNav from '@/components/HeaderNav';
import Footer from '@/components/Footer';

type Snapshot = {
  query_latency_ms: { median: number; p95: number };
  prevented_returns_pct: number;
  mrr: number;
  arr: number;
  active_retailers: number;
  active_users: number;
  demo_mode: boolean;
  generated_at: string;
};

type Trends = {
  prevented_returns: Array<{ ts: string; value: number }>;
  query_latency: Array<{ ts: string; median: number; p95: number }>;
  revenue: Array<{ ts: string; mrr: number }>;
};

type Assumptions = {
  avg_order_value: number;
  monthly_orders_per_retailer: number;
  retailers_count: number;
  commission_capture_pct: number;
  baseline_return_rate_pct: number;
};

function Sparkline({ points = [], width = 120, height = 36 }: { points: number[]; width?: number; height?: number }) {
  if (!points || points.length === 0) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const len = points.length;
  const step = width / Math.max(1, len - 1);
  const coords = points
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / (max - min || 1)) * height;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={coords}
        fill="none"
        stroke="#2D8CFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminMetricsPage() {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [assumptions, setAssumptions] = useState<Assumptions | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/admin/metrics');
        setSnapshot(data.snapshot);
        setTrends(data.trends);
        setAssumptions(data.assumptions);
      } catch (e: any) {
        setError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <HeaderNav />
        <div style={{ padding: 40 }}>Loading metrics…</div>
        <Footer />
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <HeaderNav />
        <div style={{ padding: 40, color: 'red' }}>Error: {error}</div>
        <Footer />
      </div>
    );
  if (!snapshot || !trends)
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <HeaderNav />
        <div style={{ padding: 40 }}>No metrics available</div>
        <Footer />
      </div>
    );

  // Derived "why it matters" calculations
  // Example logic (presented as deterministic calculation for judges)
  const { avg_order_value, monthly_orders_per_retailer, retailers_count, commission_capture_pct, baseline_return_rate_pct } =
    assumptions || {};
  const preventedPct = snapshot.prevented_returns_pct / 100;
  // monthly orders (platform) = monthly_orders_per_retailer * retailers_count
  const monthlyOrders = (monthly_orders_per_retailer || 2000) * (retailers_count || snapshot.active_retailers || 50);
  // estimated monthly value of prevented returns (USD)
  const estimated_monthly_return_value = monthlyOrders * ((baseline_return_rate_pct || 35) / 100) * (avg_order_value || 85);
  const estimated_prevented_value = estimated_monthly_return_value * preventedPct;
  const captured_monthly_revenue = estimated_prevented_value * (commission_capture_pct || 0.12);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeaderNav />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div style={{ padding: 28, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>Style Shepherd — Metrics Dashboard (Demo)</h1>
          <p style={{ color: '#6B7280', marginTop: 6 }}>
            Numbers are simulated for presentation. Judges: this is the impact we measure & optimize.
          </p>

          <div style={{ display: 'flex', gap: 18, marginTop: 20, flexWrap: 'wrap' }}>
            <AdminMetricCard
              title="Query Latency (median)"
              value={`${snapshot.query_latency_ms.median} ms`}
              subtitle={`p95 ${snapshot.query_latency_ms.p95} ms — median shows typical interactive response time`}
              smallChart={<Sparkline points={trends.query_latency.map((t) => t.median)} />}
            />
            <AdminMetricCard
              title="% Prevented Returns"
              value={`${snapshot.prevented_returns_pct}%`}
              subtitle="Estimated reduction in returns across pilots"
              accent="#8ABEFF"
              smallChart={<Sparkline points={trends.prevented_returns.map((t) => t.value)} />}
            />
            <AdminMetricCard
              title="MRR (demo)"
              value={`$${snapshot.mrr.toLocaleString()}`}
              subtitle={`Active retailers: ${snapshot.active_retailers} • Active users: ${snapshot.active_users.toLocaleString()}`}
              smallChart={<Sparkline points={trends.revenue.map((t) => t.mrr)} />}
            />
            <AdminMetricCard
              title="ARR (demo)"
              value={`$${snapshot.arr.toLocaleString()}`}
              subtitle="Annualized recurring revenue (projected)"
            />
          </div>

          <div style={{ display: 'flex', gap: 20, marginTop: 26, alignItems: 'stretch', flexWrap: 'wrap' }}>
            <div
              style={{
                flex: 2,
                background: '#fff',
                padding: 18,
                borderRadius: 12,
                boxShadow: '0 6px 18px rgba(15,23,32,0.06)',
              }}
            >
              <h3 style={{ marginTop: 0 }}>Why it matters — concise math for judges</h3>
              <ol style={{ color: '#374151' }}>
                <li>
                  <strong>Platform monthly orders</strong>: {monthlyOrders.toLocaleString()} orders/mo (assumption:{' '}
                  {monthly_orders_per_retailer} orders/retailer × {retailers_count} retailers)
                </li>
                <li>
                  <strong>Baseline return value</strong>: {baseline_return_rate_pct}% × avg order ${avg_order_value} →
                  estimated monthly return value = ${estimated_monthly_return_value.toLocaleString()}
                </li>
                <li>
                  <strong>Estimated prevented value</strong>: {snapshot.prevented_returns_pct}% of that ={' '}
                  <strong>${Math.round(estimated_prevented_value).toLocaleString()}</strong>
                </li>
                <li>
                  <strong>Captured revenue (commission)</strong>: {Math.round((commission_capture_pct || 0.12) * 100)}% of
                  prevented value = <strong>${Math.round(captured_monthly_revenue).toLocaleString()} / mo</strong>
                </li>
                <li>
                  <strong>Impact pitch line</strong>: "With {snapshot.prevented_returns_pct}% prevention we can capture
                  ~${Math.round(captured_monthly_revenue).toLocaleString()}/mo in recurring revenue for the platform while
                  saving retailers &gt;${Math.round(estimated_prevented_value).toLocaleString()}/mo in reverse logistics."
                </li>
              </ol>

              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => {
                    const text = [
                      `Query latency median: ${snapshot.query_latency_ms.median} ms (p95 ${snapshot.query_latency_ms.p95} ms)`,
                      `% prevented returns: ${snapshot.prevented_returns_pct}%`,
                      `MRR: $${snapshot.mrr.toLocaleString()}`,
                      `ARR: $${snapshot.arr.toLocaleString()}`,
                      `Estimated captured revenue: $${Math.round(captured_monthly_revenue).toLocaleString()}/mo`,
                    ].join('\n');
                    navigator.clipboard?.writeText(text);
                    alert('Key stats copied to clipboard (demo).');
                  }}
                  style={{
                    background: '#2D8CFF',
                    color: '#fff',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Copy stats for pitch
                </button>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                background: '#fff',
                padding: 18,
                borderRadius: 12,
                boxShadow: '0 6px 18px rgba(15,23,32,0.06)',
              }}
            >
              <h4 style={{ marginTop: 0 }}>Judge-friendly TL;DR</h4>
              <p style={{ color: '#374151' }}>
                Present this: "Style Shepherd reduces returns by <strong>{snapshot.prevented_returns_pct}%</strong>. On a
                network of <strong>{retailers_count}</strong> retailers this saves millions in returns and unlocks
                recurring commission revenue (~ <strong>${Math.round(captured_monthly_revenue).toLocaleString()}/month</strong>
                ). Our product is low-latency (median <strong>{snapshot.query_latency_ms.median}ms</strong>) which makes
                voice commerce feel instant."
              </p>
              <small style={{ color: '#6B7280' }}>
                Tip: emphasize numbers and the "money saved vs. revenue captured" in your 2-minute demo.
              </small>
            </div>
          </div>

          <div style={{ marginTop: 22, color: '#6B7280', fontSize: 13 }}>
            <strong>Notes:</strong> Values above are simulated for the demo. Replace `/api/admin/metrics` with real
            telemetry in production.
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

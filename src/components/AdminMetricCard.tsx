// components/AdminMetricCard.tsx
import React from 'react';

export default function AdminMetricCard({ title, value, subtitle, accent = '#2D8CFF', smallChart }: {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: string;
  smallChart?: React.ReactNode;
}) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 12,
      padding: 20,
      boxShadow: '0 6px 18px rgba(15,23,32,0.06)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minWidth: 220
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0F1720' }}>{value}</div>
        </div>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: accent, opacity: 0.12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: accent }} />
        </div>
      </div>

      {subtitle && <div style={{ marginTop: 12, color: '#6B7280', fontSize: 13 }}>{subtitle}</div>}
      {smallChart && <div style={{ marginTop: 10 }}>{smallChart}</div>}
    </div>
  );
}



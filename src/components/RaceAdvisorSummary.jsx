import React from 'react';
import { Card } from './UI';

// ── Flag list — instant, rule-based, no API call ───────────────────────────
function FlagList({ flags }) {
  if (flags.length === 0) {
    return (
      <div style={{ fontSize: 13, color: '#059669', fontWeight: 600, padding: '4px 0 12px' }}>
        ✓ No flags raised — clean race by the numbers.
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 14 }}>
      {flags.map(f => (
        <div key={f.id} style={{
          display: 'flex', gap: 10, padding: '8px 0',
          borderBottom: '1px solid #F3F4F6',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
            background: f.severity === 'warn' ? '#D97706' : '#3B82F6',
          }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{f.title}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{f.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Combined section ────────────────────────────────────────────────────────
export function RaceAdvisorSummary({ session, stats, flags, laps }) {
  if (!laps || laps.length === 0) {
    return (
      <Card style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: '#9CA3AF' }}>No lap data — nothing to analyze.</div>
      </Card>
    );
  }
  return (
    <Card style={{ marginBottom: 8 }}>
      <FlagList flags={flags} />
    </Card>
  );
}

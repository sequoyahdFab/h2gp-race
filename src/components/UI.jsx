import React from 'react';
import { lapSpeed } from '../lib/calc';

export function Metric({ label, value, unit, highlight }) {
  return (
    <div className={`metric-card${highlight ? ' metric-highlight' : ''}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value ?? '—'}</div>
      {unit && <div className="metric-unit">{unit}</div>}
    </div>
  );
}

export function ResourceBar({ label, pct, color, valueLabel }) {
  const bg = color || (pct > 40 ? '#059669' : pct > 20 ? '#D97706' : '#DC2626');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
      <div style={{ width: 82, fontSize: 12, color: '#6B7280', flexShrink: 0, fontWeight: 600 }}>{label}</div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: bg }} />
      </div>
      <div style={{ width: 52, textAlign: 'right', fontSize: 12, fontFamily: "'DM Mono', monospace", color: '#374151', fontWeight: 500 }}>{valueLabel}</div>
    </div>
  );
}

export function StickDisplay({ total, used }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`stick ${i < used ? 'stick-used' : i === used ? 'stick-active' : 'stick-avail'}`}>
          #{i + 1}
        </div>
      ))}
    </div>
  );
}

export function StickAdvisor({ state, title, detail }) {
  return (
    <div className={`advisor advisor-${state || 'hold'}`}>
      <div className="advisor-title">{title}</div>
      <div className="advisor-detail">{detail}</div>
    </div>
  );
}

export function Alert({ type = 'info', children }) {
  return <div className={`alert alert-${type}`}>{children}</div>;
}

export function SectionLabel({ children, style }) {
  return <div className="section-label" style={style}>{children}</div>;
}

export function ProjRow({ label, value }) {
  return (
    <div className="proj-row">
      <span className="proj-label">{label}</span>
      <span className="proj-value">{value ?? '—'}</span>
    </div>
  );
}

export function Btn({ children, onClick, variant = 'primary', disabled, style }) {
  const cls = variant === 'primary' ? 'btn btn-primary' : variant === 'secondary' ? 'btn btn-amber' : 'btn btn-ghost';
  return (
    <button className={cls} onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  );
}

export function Card({ children, style }) {
  return <div className="card" style={style}>{children}</div>;
}

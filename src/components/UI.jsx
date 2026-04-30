import React from 'react';
import { lapSpeed, fmtTime } from '../lib/calc';

// ── Metric card ──────────────────────────────────────────────────────────────
export function Metric({ label, value, unit, large }) {
  return (
    <div style={{
      background: 'var(--color-background-secondary)',
      borderRadius: 'var(--border-radius-md)',
      padding: '9px 12px',
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{
        fontSize: large ? 28 : 20,
        fontWeight: 500,
        color: 'var(--color-text-primary)',
        lineHeight: 1.1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value ?? '—'}
      </div>
      {unit && (
        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{unit}</div>
      )}
    </div>
  );
}

// ── Speed badge ───────────────────────────────────────────────────────────────
const SPEED_STYLES = {
  good:  { background: '#E1F5EE', color: '#085041' },
  fast:  { background: '#FAECE7', color: '#4A1B0C' },
  slow:  { background: '#FAEEDA', color: '#633806' },
};
export function SpeedBadge({ lapTime, fast, slow }) {
  const sp = lapSpeed(lapTime, fast, slow);
  if (!sp) return null;
  return (
    <span style={{
      fontSize: 10, fontWeight: 500, padding: '2px 5px',
      borderRadius: 3, ...SPEED_STYLES[sp],
    }}>
      {sp}
    </span>
  );
}

// ── Resource bar ─────────────────────────────────────────────────────────────
export function ResourceBar({ label, pct, color, valueLabel }) {
  const bg = color || (pct > 40 ? '#1D9E75' : pct > 20 ? '#BA7517' : '#E24B4A');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
      <div style={{ width: 88, fontSize: 11, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
        {label}
      </div>
      <div style={{
        flex: 1, height: 9,
        background: 'var(--color-background-secondary)',
        borderRadius: 5, overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          height: '100%', borderRadius: 5,
          background: bg, transition: 'width 0.5s',
        }} />
      </div>
      <div style={{
        width: 52, textAlign: 'right', fontSize: 11,
        fontWeight: 500, color: 'var(--color-text-primary)',
      }}>
        {valueLabel}
      </div>
    </div>
  );
}

// ── H2 stick display ─────────────────────────────────────────────────────────
export function StickDisplay({ total, used }) {
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '1rem' }}>
      {Array.from({ length: total }).map((_, i) => {
        const isUsed = i < used;
        const isActive = i === used;
        return (
          <div key={i} style={{
            width: 28, height: 46, borderRadius: 5,
            border: `0.5px solid ${isActive ? '#1D9E75' : 'var(--color-border-secondary)'}`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 500, gap: 2,
            background: isUsed
              ? 'var(--color-background-secondary)'
              : isActive ? '#E1F5EE' : 'var(--color-background-primary)',
            color: isUsed
              ? 'var(--color-text-tertiary)'
              : isActive ? '#085041' : 'var(--color-text-secondary)',
          }}>
            #{i + 1}
          </div>
        );
      })}
    </div>
  );
}

// ── Stick advisor ─────────────────────────────────────────────────────────────
const ADVISOR_STYLES = {
  hold:   { background: '#E1F5EE', color: '#085041', border: '0.5px solid #9FE1CB' },
  soon:   { background: '#FAEEDA', color: '#633806', border: '0.5px solid #FAC775' },
  now:    { background: '#FCEBEB', color: '#501313', border: '0.5px solid #F7C1C1' },
  danger: { background: '#FCEBEB', color: '#501313', border: '0.5px solid #F7C1C1' },
};
export function StickAdvisor({ state, title, detail }) {
  const style = ADVISOR_STYLES[state] || ADVISOR_STYLES.hold;
  return (
    <div style={{
      ...style, borderRadius: 'var(--border-radius-lg)',
      padding: '12px 16px', marginBottom: '1rem', fontSize: 13,
      animation: state === 'now' ? 'pulse 1.5s infinite' : 'none',
    }}>
      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.5 }}>{detail}</div>
    </div>
  );
}

// ── Alert strip ───────────────────────────────────────────────────────────────
const ALERT_STYLES = {
  ok:     { background: '#E1F5EE', color: '#085041' },
  warn:   { background: '#FAEEDA', color: '#633806' },
  danger: { background: '#FCEBEB', color: '#501313' },
  info:   { background: '#E6F1FB', color: '#0C447C' },
};
export function Alert({ type = 'info', children }) {
  return (
    <div style={{
      ...ALERT_STYLES[type],
      padding: '7px 12px', borderRadius: 'var(--border-radius-md)',
      fontSize: 12, marginBottom: 7,
    }}>
      {children}
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
export function SectionLabel({ children, style }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)',
      textTransform: 'uppercase', letterSpacing: '0.04em',
      margin: '1rem 0 6px', ...style,
    }}>
      {children}
    </div>
  );
}

// ── Projection row ────────────────────────────────────────────────────────────
export function ProjRow({ label, value }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '4px 0',
      borderBottom: '0.5px solid var(--color-border-tertiary)',
      fontSize: 12,
    }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{value ?? '—'}</span>
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', disabled, style }) {
  const styles = {
    primary: { background: '#1D9E75', color: '#fff', border: 'none' },
    secondary: { background: 'var(--color-background-primary)', color: '#BA7517', border: '0.5px solid #BA7517' },
    ghost: { background: 'none', color: 'var(--color-text-secondary)', border: '0.5px solid var(--color-border-tertiary)' },
    danger: { background: 'none', color: '#E24B4A', border: '0.5px solid #E24B4A' },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 'var(--border-radius-md)',
        padding: '8px 16px', fontSize: 13, fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        ...styles[variant], ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '1rem',
      ...style,
    }}>
      {children}
    </div>
  );
}

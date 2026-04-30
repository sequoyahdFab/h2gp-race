import React, { useState } from 'react';

export function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </div>
      {visible && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 6,
          background: '#111827',
          color: '#F9FAFB',
          fontSize: 11,
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 400,
          lineHeight: 1.5,
          padding: '7px 10px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          maxWidth: 240,
          whiteSpace: 'normal',
          zIndex: 100,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {text}
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #111827',
          }} />
        </div>
      )}
    </div>
  );
}

// Field label with tooltip
export function TooltipLabel({ label, tip }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
      <span className="field-label" style={{ marginBottom: 0 }}>{label}</span>
      <div
        style={{ position: 'relative', display: 'inline-block' }}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        <div style={{
          width: 15, height: 15, borderRadius: '50%',
          background: '#E5E7EB', color: '#6B7280',
          fontSize: 9, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'help', flexShrink: 0,
          fontFamily: "'Barlow', sans-serif",
        }}>
          ?
        </div>
        {visible && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 6,
            background: '#111827',
            color: '#F9FAFB',
            fontSize: 11,
            fontFamily: "'Barlow', sans-serif",
            lineHeight: 1.5,
            padding: '7px 10px',
            borderRadius: 6,
            width: 220,
            zIndex: 100,
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            {tip}
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid #111827',
            }} />
          </div>
        )}
      </div>
    </div>
  );
}

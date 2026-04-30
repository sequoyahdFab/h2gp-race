import React, { useState } from 'react';
import SessionPage from './pages/SessionPage';
import RacePage from './pages/RacePage';

export default function App() {
  const [view, setView] = useState('sessions'); // 'sessions' | 'race'
  const [sessionId, setSessionId] = useState(null);
  const [initialRole, setInitialRole] = useState('strategy');

  const handleSelect = (id, role = 'strategy') => {
    setSessionId(id);
    setInitialRole(role);
    setView('race');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-tertiary)' }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.65 } }
        * { box-sizing: border-box; }
        input, select, textarea {
          border: 0.5px solid var(--color-border-secondary);
          border-radius: var(--border-radius-md);
          padding: 7px 10px;
          font-size: 14px;
          background: var(--color-background-primary);
          color: var(--color-text-primary);
          outline: none;
        }
        input:focus {
          border-color: #1D9E75;
          box-shadow: 0 0 0 2px rgba(29, 158, 117, 0.15);
        }
        button { font-family: inherit; }
      `}</style>

      {view === 'sessions' && (
        <SessionPage onSelect={handleSelect} />
      )}
      {view === 'race' && sessionId && (
        <RacePage
          sessionId={sessionId}
          initialRole={initialRole}
          onBack={() => setView('sessions')}
        />
      )}
    </div>
  );
}
